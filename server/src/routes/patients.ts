import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient } from '../models';

export const patientsRouter = Router();
patientsRouter.use(authenticateJwt);

patientsRouter.get('/', authorizeRoles('doctor', 'nurse', 'admin', 'volunteer', 'lab'), async (req: Request, res: Response) => {
  const user = req.user!;
  const { q, status, priority, doctor } = req.query as any;

  const filter: any = {};
  if (q) {
    const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: regex },
      { condition: regex },
      { roomNumber: regex },
      { email: regex },
      { phone: regex },
    ];
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Doctor scoping: only assigned patients by default
  if (user.role === 'doctor') {
    filter.assignedDoctorId = user.sub;
  }
  // Optional explicit doctor filter for admins/nurses
  if ((user.role === 'admin' || user.role === 'nurse') && doctor) {
    filter.assignedDoctorId = String(doctor);
  }

  const patients = await Patient.find(filter).sort({ createdAt: -1 });
  res.json(patients);
});

// Fetch the Patient document linked to the current user (for patient role)
patientsRouter.get('/me/self', async (req: Request, res: Response) => {
  try {
    const doc = await Patient.findOne({ userId: req.user!.sub });
    if (!doc) return res.status(404).json({ message: 'Patient record not found' });
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch patient record' });
  }
});

// Update current user's Patient document (e.g., emergencyContact)
patientsRouter.put('/me/self', async (req: Request, res: Response) => {
  try {
    const { emergencyContact, phone, email, name } = req.body ?? {};
    const update: any = {};
    if (typeof emergencyContact === 'string') update.emergencyContact = emergencyContact;
    if (typeof phone === 'string') update.phone = phone;
    if (typeof email === 'string') update.email = email;
    if (typeof name === 'string') update.name = name;
    const updated = await Patient.findOneAndUpdate({ userId: req.user!.sub }, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Patient record not found' });
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update patient record' });
  }
});

patientsRouter.get('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Not found' });
  res.json(patient);
});

patientsRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { name, status, age, gender, condition, priority, roomNumber, phone, email, assignedDoctorId } = req.body ?? {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const created = await Patient.create({
    name,
    status: status || 'Active',
    age, gender, condition, priority, roomNumber, phone, email,
    assignedDoctorId: assignedDoctorId || (req.user!.role === 'doctor' ? req.user!.sub : undefined),
  });
  res.status(201).json(created);
});

patientsRouter.put('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { name, status, age, gender, condition, priority, roomNumber, phone, email, assignedDoctorId, lastVisit, nextAppointment } = req.body ?? {};
  const updated = await Patient.findByIdAndUpdate(
    req.params.id,
    { name, status, age, gender, condition, priority, roomNumber, phone, email, assignedDoctorId, lastVisit, nextAppointment },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

patientsRouter.delete('/:id', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  const user = req.user!;
  // Diagnostic logs for deletion attempts
  // eslint-disable-next-line no-console
  console.log('[DELETE /api/patients/:id] request', { id: req.params.id, role: user.role, user: user.sub });
  const doc = await Patient.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  if (user.role === 'doctor') {
    // eslint-disable-next-line no-console
    console.log('[DELETE check] ownership', { assignedDoctorId: String(doc.assignedDoctorId), user: String(user.sub) });
    if (String(doc.assignedDoctorId) !== String(user.sub)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  await Patient.findByIdAndDelete(req.params.id);
  // eslint-disable-next-line no-console
  console.log('[DELETE success]', { id: req.params.id });
  res.status(204).end();
});
