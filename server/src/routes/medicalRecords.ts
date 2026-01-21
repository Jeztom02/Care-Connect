import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { MedicalRecord } from '../models';
import { getIO } from '../socket';
import { classifyMedicalRecordType } from '../services/bayes';

export const medicalRecordsRouter = Router();
medicalRecordsRouter.use(authenticateJwt);

// List medical records with pagination and search (staff)
// Query params: q (text), type, status, patientId, page, limit, sort
medicalRecordsRouter.get('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const {
    q = '',
    type,
    status,
    patientId,
    page = '1',
    limit = '20',
    sort = '-createdAt',
  } = (req.query || {}) as Record<string, string>;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter: any = {};
  if (patientId) filter.patientId = patientId;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { summary: { $regex: q, $options: 'i' } },
      { diagnosis: { $regex: q, $options: 'i' } },
    ];
  }

  const sortObj: any = {};
  const sortFields = String(sort).split(',');
  for (const s of sortFields) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('-')) sortObj[trimmed.slice(1)] = -1; else sortObj[trimmed] = 1;
  }

  const [items, total] = await Promise.all([
    MedicalRecord.find(filter)
      .populate('patientId', 'name')
      .populate('createdBy', 'name role')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    MedicalRecord.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
});

// Get medical records by patientId
medicalRecordsRouter.get('/:patientId', authorizeRoles('doctor', 'nurse', 'admin', 'patient', 'family'), async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const items = await MedicalRecord.find({ patientId }).populate('patientId', 'name').populate('createdBy', 'name role').sort({ createdAt: -1 });
  res.json(items);
});

// Create a medical record (doctor/nurse/admin)
medicalRecordsRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { patientId, title, type, diagnosis, summary, files, recordedAt, status } = req.body ?? {};
  if (!patientId || !title) return res.status(400).json({ message: 'patientId and title are required' });
  const created = await MedicalRecord.create({
    patientId,
    createdBy: req.user!.sub,
    title,
    type,
    diagnosis,
    summary,
    files,
    recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    status,
  });
  const io = getIO();
  if (io) {
    const payload = { ...created.toObject(), _id: String(created._id) };
    io.to(String(created.patientId)).emit('medicalRecord:new', payload);
    io.to(String(created.createdBy)).emit('medicalRecord:new', payload);
  }
  res.status(201).json(created);
});

// Classify likely medical record type from text
medicalRecordsRouter.post('/classify-type', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { title, summary, diagnosis } = req.body ?? {};
  const result = classifyMedicalRecordType({ title, summary, diagnosis });
  res.json(result);
});

// Update medical record
medicalRecordsRouter.put('/:recordId', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { recordId } = req.params;
  const { title, type, diagnosis, summary, files, recordedAt, status } = req.body ?? {};
  const updated = await MedicalRecord.findByIdAndUpdate(
    recordId,
    { title, type, diagnosis, summary, files, recordedAt: recordedAt && new Date(recordedAt), status },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  const io = getIO();
  if (io) {
    const payload = { ...updated.toObject(), _id: String(updated._id) };
    io.to(String(updated.patientId)).emit('medicalRecord:updated', payload);
    io.to(String(updated.createdBy)).emit('medicalRecord:updated', payload);
  }
  res.json(updated);
});

// Delete medical record (admin or owning doctor)
medicalRecordsRouter.delete('/:recordId', authorizeRoles('admin', 'doctor'), async (req: Request, res: Response) => {
  const recordId = req.params.recordId;
  const record = await MedicalRecord.findById(recordId);
  if (!record) return res.status(404).json({ message: 'Not found' });

  // If doctor, enforce ownership (creator)
  if ((req.user as any)?.role === 'doctor' && String(record.createdBy) !== String(req.user!.sub)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const deleted = await MedicalRecord.findByIdAndDelete(recordId);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  const io = getIO();
  if (io) {
    const payload = { _id: String(deleted._id) };
    io.to(String(deleted.patientId)).emit('medicalRecord:deleted', payload);
    io.to(String(deleted.createdBy)).emit('medicalRecord:deleted', payload);
  }
  res.status(204).end();
});
