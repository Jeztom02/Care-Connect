import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { User, Patient } from '../models';

export const usersRouter = Router();
usersRouter.use(authenticateJwt);

// Get all users (admin only)
usersRouter.get('/', authorizeRoles('admin'), async (_req: Request, res: Response) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(users);
});

// List patient users joined with Patient docs (doctor, nurse, admin)
usersRouter.get('/patients', authorizeRoles('doctor', 'nurse', 'admin'), async (_req: Request, res: Response) => {
  try {
    // Find Patient docs and populate corresponding User (patient user account)
    const patients = await Patient.find({})
      .populate('userId', 'name email isActive')
      .sort({ createdAt: -1 });

    // Map to only active user accounts and return unified shape
    const results = patients
      .filter((p: any) => p.userId && p.userId.isActive !== false)
      .map((p: any) => {
        const user = p.userId as any;
        const fullName = typeof user?.name === 'string' ? user.name : (p.name || '');
        const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
        const lastName = rest.join(' ');
        return {
          _id: String(p._id), // Patient ID for appointments
          userId: String(user?._id || ''),
          name: fullName,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: user?.email,
          roomNumber: p.roomNumber,
          status: p.status || 'Active',
        };
      });

    res.json(results);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[USERS][PATIENTS_LIST] Error:', (err as Error).message);
    res.status(500).json({ message: 'Failed to fetch patient users' });
  }
});

// Global search users (all authenticated roles)
// Query by name/email partial match and/or role exact match
usersRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();

    const filter: any = {};
    const or: any[] = [];
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      or.push({ name: regex }, { email: regex });
    }
    if (or.length) filter.$or = or;
    if (role) filter.role = role;

    const results = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(25);
    res.json(results);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[USERS][SEARCH] Error:', (err as Error).message);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get user profile
usersRouter.get('/me', async (req: Request, res: Response) => {
  const user = req.user!;
  const userProfile = await User.findById(user.sub).select('-passwordHash');
  if (!userProfile) return res.status(404).json({ message: 'User not found' });
  res.json(userProfile);
});

// Update own profile (name, email, phone)
usersRouter.put('/me', async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body ?? {};
    const $set: any = {};
    const $unset: any = {};
    if (typeof name === 'string' && name.trim()) $set.name = name.trim();
    if (typeof email === 'string') {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });
      $set.email = normalizedEmail;
    }
    if (typeof phone === 'string') {
      const normalizedPhone = String(phone).trim();
      if (normalizedPhone) {
        $set.phone = normalizedPhone;
      } else {
        $unset.phone = '';
      }
    }

    if ($set.email) {
      const exists = await User.findOne({ _id: { $ne: req.user!.sub }, email: $set.email });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
    }
    if ($set.phone) {
      const existsPhone = await User.findOne({ _id: { $ne: req.user!.sub }, phone: $set.phone });
      if (existsPhone) return res.status(409).json({ message: 'Phone already in use' });
    }

    const updateOps: any = {};
    if (Object.keys($set).length) updateOps.$set = $set;
    if (Object.keys($unset).length) updateOps.$unset = $unset;

    const updated = await User.findByIdAndUpdate(req.user!.sub, updateOps, { new: true }).select('-passwordHash');
    if (!updated) return res.status(404).json({ message: 'User not found' });

    // Sync Patient record if this user has one
    try {
      const patient = await Patient.findOne({ userId: updated._id });
      if (patient) {
        if ($set.name) patient.name = $set.name;
        if ($set.email) (patient as any).email = $set.email;
        if ($set.phone) (patient as any).phone = $set.phone;
        if ($unset.phone !== undefined) (patient as any).phone = undefined;
        await patient.save();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[USERS][ME_UPDATE][PATIENT_SYNC] Error:', (e as Error).message);
    }

    return res.json(updated);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[USERS][ME_UPDATE] Error:', (e as Error).message);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get current user's preferences (all authenticated roles)
usersRouter.get('/me/preferences', async (req: Request, res: Response) => {
  try {
    const doc = await User.findById(req.user!.sub).select('preferences');
    if (!doc) return res.status(404).json({ message: 'User not found' });
    return res.json(doc.preferences || {});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[USERS][PREFERENCES][GET] Error:', (e as Error).message);
    return res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

// Update current user's preferences (all authenticated roles)
usersRouter.put('/me/preferences', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const update: any = {};
    if (Object.prototype.hasOwnProperty.call(body, 'darkMode')) {
      update['preferences.darkMode'] = !!body.darkMode;
    }
    if (body.notifications && typeof body.notifications === 'object') {
      if (Object.prototype.hasOwnProperty.call(body.notifications, 'email')) {
        update['preferences.notifications.email'] = !!body.notifications.email;
      }
      if (Object.prototype.hasOwnProperty.call(body.notifications, 'push')) {
        update['preferences.notifications.push'] = !!body.notifications.push;
      }
      if (Object.prototype.hasOwnProperty.call(body.notifications, 'sms')) {
        update['preferences.notifications.sms'] = !!body.notifications.sms;
      }
    }
    if (typeof body.language === 'string') {
      update['preferences.language'] = String(body.language);
    }
    if (typeof body.timezone === 'string') {
      update['preferences.timezone'] = String(body.timezone);
    }

    // Allow additional arbitrary keys under preferences safely
    if (body.preferences && typeof body.preferences === 'object') {
      for (const [k, v] of Object.entries(body.preferences)) {
        update[`preferences.${k}`] = v as any;
      }
    }

    const updated = await User.findByIdAndUpdate(req.user!.sub, update, { new: true }).select('preferences');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json(updated.preferences || {});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[USERS][PREFERENCES][PUT] Error:', (e as Error).message);
    return res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Get user by ID (admin only)
usersRouter.get('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update user role (admin only)
usersRouter.put('/:id/role', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role || !['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer'].includes(role)) {
    return res.status(400).json({ message: 'Valid role required' });
  }
  
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-passwordHash');
  
  if (!updated) return res.status(404).json({ message: 'User not found' });

  // If role changed to patient, ensure a Patient document exists
  if (role === 'patient') {
    try {
      const existingPatient = await Patient.findOne({ userId: updated._id });
      if (!existingPatient) {
        const patientDoc = await Patient.create({
          name: updated.name,
          email: updated.email,
          phone: (updated as any).phone,
          userId: updated._id,
          status: 'Active'
        });
        // eslint-disable-next-line no-console
        console.log('[USERS][ROLE_UPDATE][PATIENT_SYNC] Created patient', { userId: String(updated._id), patientId: String(patientDoc._id) });
      } else {
        // eslint-disable-next-line no-console
        console.log('[USERS][ROLE_UPDATE][PATIENT_SYNC] Patient already exists for user', { userId: String(updated._id) });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[USERS][ROLE_UPDATE][PATIENT_SYNC] Failed to create patient', { userId: String(updated._id), error: (e as Error).message });
    }
  }
  res.json(updated);
});

// Delete user (admin only)
usersRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.status(204).end();
});















