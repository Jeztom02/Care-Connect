import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { User, Announcement, SystemSettings, AuditLog, Message, Appointment, Patient, Alert } from '../models';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();
adminRouter.use(authenticateJwt);
adminRouter.use(authorizeRoles('admin'));

// Audit logging middleware
const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: any) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400) {
        AuditLog.create({
          action,
          resource,
          resourceId: req.params.id || req.body.id,
          oldValue: req.body.oldValue,
          newValue: req.body,
          performedBy: req.user!.sub,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: { method: req.method, url: req.url }
        }).catch(console.error);
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

// 1. MESSAGING SYSTEM

// Get all announcements
adminRouter.get('/announcements', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, type, priority } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Announcement.countDocuments(filter);

    res.json({
      announcements,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Create announcement
adminRouter.post('/announcements', auditLog('CREATE', 'Announcement'), async (req: Request, res: Response) => {
  try {
    const { title, message, type, priority, targetRoles, targetUsers, isGlobal, expiresAt } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'Announcement',
      priority: priority || 'Medium',
      targetRoles: targetRoles || [],
      targetUsers: targetUsers || [],
      isGlobal: isGlobal || false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user!.sub
    });

    // If announcement is being sent immediately, create individual messages
    if (req.body.sendImmediately) {
      await sendAnnouncementMessages(announcement);
      announcement.status = 'Sent';
      announcement.sentAt = new Date();
      await announcement.save();
    }

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
});

// Send announcement
adminRouter.post('/announcements/:id/send', auditLog('SEND', 'Announcement'), async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await sendAnnouncementMessages(announcement);
    
    announcement.status = 'Sent';
    announcement.sentAt = new Date();
    await announcement.save();

    res.json({ message: 'Announcement sent successfully' });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ message: 'Failed to send announcement' });
  }
});

// Helper function to send announcement messages
async function sendAnnouncementMessages(announcement: any) {
  let targetUserIds: string[] = [];

  if (announcement.isGlobal) {
    // Send to all users
    const allUsers = await User.find({}, '_id');
    targetUserIds = allUsers.map(user => user._id.toString());
  } else {
    // Send to specific roles
    if (announcement.targetRoles.length > 0) {
      const roleUsers = await User.find({ role: { $in: announcement.targetRoles } }, '_id');
      targetUserIds = roleUsers.map(user => user._id.toString());
    }
    
    // Add specific users
    if (announcement.targetUsers.length > 0) {
      targetUserIds = [...targetUserIds, ...announcement.targetUsers.map((id: any) => id.toString())];
    }
  }

  // Create individual messages
  const messages = targetUserIds.map(userId => ({
    fromUserId: announcement.createdBy,
    toUserId: userId,
    content: `[${announcement.type}] ${announcement.title}\n\n${announcement.message}`,
    isAnnouncement: true,
    announcementId: announcement._id
  }));

  await Message.insertMany(messages);
}

// 2. USER MANAGEMENT SYSTEM

// Get all users with pagination and search
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create new user
adminRouter.post('/users', auditLog('CREATE', 'User'), async (req: Request, res: Response) => {
  try {
    const { name, email, role, password, isActive = true, phone } = req.body;
    
    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: 'Name, email, role, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role,
      passwordHash,
      isActive
    });

    // If creating a patient user, also create a Patient document
    if (String(role) === 'patient') {
      try {
        const existingPatient = await Patient.findOne({ userId: user._id });
        if (!existingPatient) {
          const patientDoc = await Patient.create({
            name: String(name),
            email: email.toLowerCase(),
            phone: typeof phone === 'string' ? phone : undefined,
            userId: user._id,
            status: 'Active'
          });
          // eslint-disable-next-line no-console
          console.log('[ADMIN][USER_CREATE][PATIENT_SYNC] Created patient', { userId: String(user._id), patientId: String(patientDoc._id) });
        } else {
          // eslint-disable-next-line no-console
          console.log('[ADMIN][USER_CREATE][PATIENT_SYNC] Patient already exists for user', { userId: String(user._id) });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[ADMIN][USER_CREATE][PATIENT_SYNC] Failed to create patient', { userId: String(user._id), error: (e as Error).message });
      }
    }

    const userResponse = await User.findById(user._id).select('-passwordHash');
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user
adminRouter.put('/users/:id', auditLog('UPDATE', 'User'), async (req: Request, res: Response) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const updateData: any = { name, email, role, isActive };
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
adminRouter.delete('/users/:id', auditLog('DELETE', 'User'), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// 3. SYSTEM ANALYTICS & REPORTS

// Get analytics data
adminRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { period = 'week', startDate, endDate } = req.query;
    
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: monthAgo };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
          };
        }
        break;
    }

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } }
        }
      }
    ]);

    // Get alert statistics
    const alertStats = await Alert.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get message statistics
    const messageStats = await Message.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ensure consistent JSON structure with safe defaults
    res.json({
      appointments: Array.isArray(appointmentStats) ? appointmentStats : [],
      users: Array.isArray(userStats) ? userStats : [],
      alerts: Array.isArray(alertStats) ? alertStats : [],
      messages: Array.isArray(messageStats) ? messageStats : [],
      period: typeof period === 'string' ? period : 'week'
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Export analytics as CSV or PDF
adminRouter.get('/analytics/export', async (req: Request, res: Response) => {
  try {
    const { period = 'week', startDate, endDate, format = 'csv' } = req.query as Record<string, string>;

    let dateFilter: any = {};
    const now = new Date();
    switch (period) {
      case 'today':
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        break;
      case 'week':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        break;
    }

    const [appointmentStats, userStats, alertStats, messageStats] = await Promise.all([
      Appointment.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } } } },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }
      ]),
      Alert.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    if (String(format).toLowerCase() === 'pdf') {
      // Simple PDF placeholder to avoid 404; in production use a PDF generator.
      const content = `Analytics Report (Period: ${period})\n\n` +
        `Appointments: ${appointmentStats.length} records\n` +
        `Users by role: ${userStats.length} records\n` +
        `Alerts by status: ${alertStats.length} records\n` +
        `Messages: ${messageStats.length} records\n`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().slice(0,10)}.pdf"`);
      // Return a minimal PDF file structure is non-trivial; instead, return text as octet-stream to avoid viewer errors.
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.send(Buffer.from(content, 'utf-8'));
    }

    // Default: CSV
    const lines: string[] = [];
    lines.push(`Section,Key,Count,Extra1,Extra2`);
    appointmentStats.forEach((a: any) => {
      lines.push(["Appointments", a._id, a.count, `completed:${a.completed}`, `cancelled:${a.cancelled}`].join(','));
    });
    userStats.forEach((u: any) => {
      lines.push(["Users", u._id, u.count, `active:${u.active}`, ''].join(','));
    });
    alertStats.forEach((al: any) => {
      lines.push(["Alerts", al._id, al.count, '', ''].join(','));
    });
    messageStats.forEach((m: any) => {
      lines.push(["Messages", m._id, m.count, '', ''].join(','));
    });

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
});

// 4. SYSTEM SETTINGS

// Get all settings
adminRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const settings = await SystemSettings.find(filter)
      .populate('updatedBy', 'name email')
      .sort({ category: 1, key: 1 });

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update setting
adminRouter.put('/settings/:key', auditLog('UPDATE', 'SystemSettings'), async (req: Request, res: Response) => {
  try {
    const { value, description } = req.body;
    
    const setting = await SystemSettings.findOneAndUpdate(
      { key: req.params.key },
      { 
        value, 
        description,
        updatedBy: req.user!.sub 
      },
      { upsert: true, new: true }
    ).populate('updatedBy', 'name email');

    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

// 5. AUDIT LOGS

// Get audit logs
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, action, resource, userId } = req.query;
    const filter: any = {};
    
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.performedBy = userId;

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Dashboard overview
adminRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      todayAppointments,
      weekAppointments,
      openAlerts,
      recentMessages,
      systemHealth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Appointment.countDocuments({ 
        startsAt: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } 
      }),
      Appointment.countDocuments({ createdAt: { $gte: weekAgo } }),
      Alert.countDocuments({ status: 'OPEN' }),
      Message.countDocuments({ createdAt: { $gte: weekAgo } }),
      SystemSettings.find({ category: 'System' })
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        todayAppointments,
        weekAppointments,
        openAlerts,
        recentMessages
      },
      systemHealth
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// User preferences
adminRouter.get('/user-preferences', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.sub).select('preferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences || {});
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Failed to fetch user preferences' });
  }
});

adminRouter.put('/user-preferences', auditLog('UPDATE', 'UserPreferences'), async (req: Request, res: Response) => {
  try {
    const { darkMode, notifications } = req.body;
    
    const updateData: any = {};
    if (darkMode !== undefined) {
      updateData['preferences.darkMode'] = darkMode;
    }
    if (notifications) {
      if (notifications.email !== undefined) {
        updateData['preferences.notifications.email'] = notifications.email;
      }
      if (notifications.push !== undefined) {
        updateData['preferences.notifications.push'] = notifications.push;
      }
      if (notifications.sms !== undefined) {
        updateData['preferences.notifications.sms'] = notifications.sms;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.sub,
      updateData,
      { new: true }
    ).select('preferences');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences || {});
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ message: 'Failed to update user preferences' });
  }
});
