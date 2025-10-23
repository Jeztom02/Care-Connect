import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJwt, authorizeRoles } from '../auth';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${unique}${ext}`);
  }
});

export const uploadsRouter = Router();
uploadsRouter.use(authenticateJwt);

uploadsRouter.get('/sign-get', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const key = String(req.query.key || '').trim();
    if (!key) return res.status(400).json({ message: 'key is required' });
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return res.status(500).json({ message: 'S3 not configured' });
    }
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const s3 = new S3Client({ region });
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    return res.json({ url });
  } catch (err) {
    console.error('[UPLOADS sign-get] error:', (err as Error).message);
    return res.status(500).json({ message: 'Failed to sign GET URL' });
  }
});

// Sign a GET URL by parsing a provided S3 URL to extract the key
uploadsRouter.get('/sign-from-url', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) return res.status(400).json({ message: 'url is required' });

    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return res.status(500).json({ message: 'S3 not configured' });
    }

    let key = '';
    // Compute basePath similar to presign logic
    const origin = `https://${bucket}.s3.${region}.amazonaws.com`;
    let basePath = '';
    const rawBase = process.env.S3_PUBLIC_URL || '';
    if (rawBase) {
      if (rawBase.startsWith('s3://')) {
        const withoutScheme = rawBase.slice('s3://'.length);
        const parts = withoutScheme.split('/');
        parts.shift();
        basePath = parts.join('/');
      } else if (rawBase.startsWith(origin)) {
        basePath = rawBase.slice(origin.length);
      } else {
        try {
          const urlObj = new URL(rawBase);
          basePath = urlObj.pathname;
        } catch {
          basePath = '';
        }
      }
      basePath = basePath.replace(/^\//, '').replace(/\/$/, '');
    }
    if (rawUrl.startsWith('s3://')) {
      const withoutScheme = rawUrl.slice('s3://'.length);
      const parts = withoutScheme.split('/');
      parts.shift();
      key = parts.join('/');
    } else if (rawUrl.startsWith(`https://${bucket}.s3.${region}.amazonaws.com/`)) {
      key = rawUrl.slice(`https://${bucket}.s3.${region}.amazonaws.com/`.length);
    } else if (basePath) {
      const base = basePath ? `${origin}/${basePath}` : origin;
      const baseWithSlash = base.endsWith('/') ? base : base + '/';
      if (rawUrl.startsWith(baseWithSlash)) {
        key = rawUrl.slice(baseWithSlash.length);
      }
    }

    if (!key) return res.status(400).json({ message: 'Could not extract S3 key from url' });

    // Normalize duplicated basePath occurrences, e.g., medical-records/medical-records/...
    if (basePath) {
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dupRe = new RegExp(`^(?:${esc(basePath)}\/)+`);
      if (dupRe.test(key)) {
        // Remove all leading repeats of basePath/
        key = key.replace(dupRe, '');
        // Re-add single basePath/
        key = `${basePath}/${key}`;
      }
    }
    key = key.replace(/^\//, '');

    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const s3 = new S3Client({ region });
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    return res.json({ url, key });
  } catch (err) {
    console.error('[UPLOADS sign-from-url] error:', (err as Error).message);
    return res.status(500).json({ message: 'Failed to sign URL from provided link' });
  }
});

const upload = multer({ storage });

// S3 presigned URL flow
// Requires env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, optional S3_PUBLIC_URL
uploadsRouter.post('/presign', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { files } = (req.body || {}) as { files?: Array<{ name: string; type: string }> };
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'files array required' });
    }

    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return res.status(500).json({ message: 'S3 not configured' });
    }

    // Lazy import to avoid requiring deps when not used
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const s3 = new S3Client({ region });
    const prefix = `medical-records/${new Date().toISOString().slice(0, 10)}/`;

    const results = await Promise.all(files.map(async (f) => {
      const safeBase = String(f.name).replace(/[^a-zA-Z0-9._-]/g, '_');
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}`;
      const key = `${prefix}${unique}`;
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: f.type });
      const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
      // Build a web-accessible URL without duplicating the basePath (e.g., 'medical-records')
      const origin = `https://${bucket}.s3.${region}.amazonaws.com`;
      let basePath = '';
      const rawBase = process.env.S3_PUBLIC_URL || '';
      if (rawBase) {
        if (rawBase.startsWith('s3://')) {
          const withoutScheme = rawBase.slice('s3://'.length);
          const parts = withoutScheme.split('/');
          parts.shift(); // drop bucket
          basePath = parts.join('/');
        } else if (rawBase.startsWith(origin)) {
          basePath = rawBase.slice(origin.length);
        } else {
          // If a CDN is used, keep basePath empty to avoid path assumptions
          const urlObj = new URL(rawBase);
          basePath = urlObj.pathname;
        }
        basePath = basePath.replace(/^\//, '').replace(/\/$/, '');
      }
      // If basePath is included in key, remove it to avoid duplication in URL
      const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let keyForUrl = key;
      if (basePath && new RegExp('^' + escape(basePath) + '/').test(keyForUrl)) {
        keyForUrl = keyForUrl.replace(new RegExp('^' + escape(basePath) + '/'), '');
      }
      const url = basePath ? `${origin}/${basePath}/${keyForUrl}` : `${origin}/${keyForUrl}`;
      return { uploadUrl, url, key, mime: f.type, name: f.name };
    }));

    return res.json({ files: results });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[UPLOADS presign] error:', (err as Error).message);
    return res.status(500).json({ message: 'Failed to generate presigned URLs' });
  }
});

// Upload one or more files. Roles: doctor, nurse, admin
uploadsRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const payload = files.map(f => ({
      url: `${baseUrl}/uploads/${f.filename}`,
      name: f.originalname,
      mime: f.mimetype,
      size: f.size,
    }));
    res.status(201).json({ files: payload });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[UPLOADS] error:', (err as Error).message);
    res.status(500).json({ message: 'Upload failed' });
  }
});
