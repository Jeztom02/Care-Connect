import nodemailer, { Transporter } from 'nodemailer';

type TransportConfig = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  secure?: boolean;
};

let cachedTransporter: Transporter | null = null;

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function getEmailConfig(): TransportConfig {
  // Support both EMAIL_* and SMTP_* env names
  const host = getEnv('EMAIL_HOST') || getEnv('SMTP_HOST');
  const portStr = getEnv('EMAIL_PORT') || getEnv('SMTP_PORT');
  const user = getEnv('EMAIL_USER') || getEnv('SMTP_USER');
  const pass = getEnv('EMAIL_PASS') || getEnv('SMTP_PASS');
  const from = getEnv('MAIL_FROM') || getEnv('EMAIL_FROM') || 'Care Connect <no-reply@careconnect.local>';
  const secureStr = getEnv('EMAIL_SECURE') || getEnv('SMTP_SECURE');

  const port = portStr ? Number(portStr) : 587;
  const secure = typeof secureStr === 'string' ? secureStr.toLowerCase() === 'true' : port === 465; // override or infer

  return { host, port, user, pass, from, secure };
}

export function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const { host, port, user, pass, secure } = getEmailConfig();
  if (!host) return null;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port || 587),
    secure: !!secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  cachedTransporter = transporter;
  return transporter;
}

export async function verifyTransporter(): Promise<{ ok: boolean; message: string }>{
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, message: 'Email transport not configured. Set EMAIL_HOST/SMTP_HOST.' };
  }
  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection successful' };
  } catch (err) {
    const message = (err as Error).message || 'verify failed';
    return { ok: false, message };
  }
}

export async function sendEmail(options: { to: string; subject: string; html?: string; text?: string }): Promise<void> {
  const transporter = getTransporter();
  const { from } = getEmailConfig();
  if (!transporter) {
    // Fallback: log in dev
    // eslint-disable-next-line no-console
    console.log('[EMAIL:FALLBACK] No SMTP configured. Would send to', options.to, 'subject:', options.subject);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    // eslint-disable-next-line no-console
    console.log('[EMAIL:SENT]', { to: options.to, subject: options.subject, messageId: info.messageId });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[EMAIL:ERROR] Email send failed:', (err as Error).message);
    throw err;
  }
}


