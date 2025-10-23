import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Appointment, Patient } from '../models';
import { getIO } from '../socket';

export const appointmentsRouter = Router();
appointmentsRouter.use(authenticateJwt);

appointmentsRouter.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  let items;
  
  if (user.role === 'admin' || user.role === 'nurse') {
    // Admin/Nurse can see all appointments
    items = await Appointment.find().populate('patientId').sort({ startsAt: -1 });
  } else if (user.role === 'doctor') {
    // Doctors see their own appointments
    items = await Appointment.find({ doctorId: user.sub }).populate('patientId').sort({ startsAt: -1 });
  } else if (user.role === 'patient') {
    // Patients can see their own appointments (resolve Patient doc by userId)
    const selfPatient = await Patient.findOne({ userId: user.sub }).select('_id');
    const pid = selfPatient ? selfPatient._id : null;
    items = await Appointment.find(pid ? { patientId: pid } : { patientId: null }).populate('patientId').sort({ startsAt: -1 });
  } else if (user.role === 'family') {
    // Family members can see appointments for their associated patient
    // For now, we'll show all appointments - in a real app, you'd link family to specific patients
    items = await Appointment.find().populate('patientId').sort({ startsAt: -1 });
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json(items);
});

appointmentsRouter.get('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const item = await Appointment.findById(req.params.id).populate('patientId');
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

appointmentsRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { patientId, startsAt, endsAt, status, title, location, mode, notes } = req.body ?? {};
  if (!patientId || !startsAt || !endsAt) return res.status(400).json({ message: 'patientId, startsAt, endsAt required' });
  const created = await Appointment.create({
    patientId,
    doctorId: req.user!.role === 'doctor' ? req.user!.sub : undefined,
    title,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    status,
    location,
    mode,
    notes,
  });
  const io = getIO();
  if (io) {
    const payload = { ...created.toObject(), _id: String(created._id) };
    if (created.doctorId) io.to(String(created.doctorId)).emit('appointment:new', payload);
    io.to(String(created.patientId)).emit('appointment:new', payload);
    // Global channel for dashboards that need broad updates (e.g., admin/nurse calendars)
    io.emit('appointments:all', payload);
  }
  res.status(201).json(created);
});

appointmentsRouter.put('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { startsAt, endsAt, status, title, location, mode, notes } = req.body ?? {};
  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    {
      startsAt: startsAt && new Date(startsAt),
      endsAt: endsAt && new Date(endsAt),
      status,
      title,
      location,
      mode,
      notes,
    },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  const io = getIO();
  if (io) {
    const payload = { ...updated.toObject(), _id: String(updated._id) };
    if (updated.doctorId) io.to(String(updated.doctorId)).emit('appointment:updated', payload);
    io.to(String(updated.patientId)).emit('appointment:updated', payload);
    // Global channel emit
    io.emit('appointments:all', payload);
  }
  res.json(updated);
});

appointmentsRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  const io = getIO();
  if (io) {
    const payload = { _id: String(deleted._id) };
    if (deleted.doctorId) io.to(String(deleted.doctorId)).emit('appointment:deleted', payload);
    io.to(String(deleted.patientId)).emit('appointment:deleted', payload);
    // Global channel emit
    io.emit('appointments:all', payload);
  }
  res.status(204).end();
});
