import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectMongo } from './db';
import { User, Patient, Appointment, Message, Alert, PatientStatus, CareUpdate, Medication, VolunteerTask, Announcement, SystemSettings, AuditLog } from './models';

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/compassion';
  await connectMongo(uri);

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Message.deleteMany({}),
    Alert.deleteMany({}),
    PatientStatus.deleteMany({}),
    CareUpdate.deleteMany({}),
    Medication.deleteMany({}),
    VolunteerTask.deleteMany({}),
    Announcement.deleteMany({}),
    SystemSettings.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const users = await User.create([
    { 
      email: 'admin@care.local', 
      name: 'Alice Admin', 
      role: 'admin', 
      passwordHash: bcrypt.hashSync('admin123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
    { 
      email: 'doctor@care.local', 
      name: 'Dr. Dan', 
      role: 'doctor', 
      passwordHash: bcrypt.hashSync('doctor123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
    { 
      email: 'nurse@care.local', 
      name: 'Nina Nurse', 
      role: 'nurse', 
      passwordHash: bcrypt.hashSync('nurse123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
    { 
      email: 'patient@care.local', 
      name: 'Pat Patient', 
      role: 'patient', 
      passwordHash: bcrypt.hashSync('patient123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
    { 
      email: 'family@care.local', 
      name: 'Fran Family', 
      role: 'family', 
      passwordHash: bcrypt.hashSync('family123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
    { 
      email: 'volunteer@care.local', 
      name: 'Victor Volunteer', 
      role: 'volunteer', 
      passwordHash: bcrypt.hashSync('volunteer123', 10),
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    },
  ]);

  const [admin, doctor, nurse, patient, family, volunteer] = users;

  const p1 = await Patient.create({ name: 'John Doe', status: 'Stable' });
  const p2 = await Patient.create({ name: 'Jane Smith', status: 'Observation' });

  const now = new Date();
  await Appointment.create([
    { patientId: p1._id, startsAt: new Date(now.getTime() + 60 * 60 * 1000), endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), status: 'SCHEDULED' },
    { patientId: p2._id, startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), endsAt: new Date(now.getTime() - 60 * 60 * 1000), status: 'COMPLETED' },
  ]);

  await Message.create([
    { content: 'Please check patient vitals at noon.', fromUserId: doctor._id, toUserId: nurse._id },
    { content: 'Vitals stable, proceeding with labs.', fromUserId: nurse._id, toUserId: doctor._id },
  ]);

  await Alert.create([
    { title: 'Lab System Delay', message: 'Expect delays in lab results.', status: 'OPEN', createdByUserId: admin._id },
    { title: 'Pharmacy Outage', message: 'Temporary outage for prescription refills.', status: 'ACKNOWLEDGED', createdByUserId: admin._id },
  ]);

  // Create patient status records
  await PatientStatus.create([
    {
      patientId: p1._id,
      vitals: {
        bloodPressure: { systolic: 120, diastolic: 80 },
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
        weight: 175,
        height: 70
      },
      condition: 'Stable',
      notes: 'Patient is responding well to treatment. Vitals are within normal range.',
      recordedBy: nurse._id
    },
    {
      patientId: p2._id,
      vitals: {
        bloodPressure: { systolic: 130, diastolic: 85 },
        heartRate: 78,
        temperature: 99.1,
        oxygenSaturation: 96,
        weight: 160,
        height: 65
      },
      condition: 'Stable',
      notes: 'Patient under observation. Slight elevation in temperature being monitored.',
      recordedBy: doctor._id
    }
  ]);

  // Create care updates
  await CareUpdate.create([
    {
      patientId: p1._id,
      type: 'Medication',
      title: 'Morning Medication Administered',
      description: 'Patient received morning dose of prescribed medication. No adverse reactions observed.',
      status: 'Completed',
      scheduledAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdBy: nurse._id
    },
    {
      patientId: p1._id,
      type: 'Treatment',
      title: 'Physical Therapy Session',
      description: 'Completed 30-minute physical therapy session focusing on mobility exercises. Patient showed good progress.',
      status: 'Completed',
      scheduledAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      createdBy: doctor._id
    },
    {
      patientId: p2._id,
      type: 'Observation',
      title: 'Vital Signs Check',
      description: 'Routine vital signs check completed. All readings within normal range.',
      status: 'Completed',
      scheduledAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      createdBy: nurse._id
    }
  ]);

  // Create medications
  await Medication.create([
    {
      patientId: p1._id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      instructions: 'Take with food in the morning',
      prescribedBy: doctor._id,
      status: 'Active'
    },
    {
      patientId: p1._id,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      instructions: 'Take with meals',
      prescribedBy: doctor._id,
      status: 'Active'
    },
    {
      patientId: p2._id,
      name: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Every 6 hours as needed',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      instructions: 'Take with food to reduce stomach irritation',
      prescribedBy: doctor._id,
      status: 'Active'
    }
  ]);

  // Create volunteer tasks
  await VolunteerTask.create([
    {
      title: 'Patient Companionship',
      description: 'Spend time with John Doe, providing companionship and emotional support.',
      type: 'Patient Support',
      priority: 'Medium',
      status: 'Assigned',
      assignedTo: volunteer._id,
      patientId: p1._id,
      scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      createdBy: admin._id
    },
    {
      title: 'Transportation Assistance',
      description: 'Help Jane Smith with transportation to physical therapy appointment.',
      type: 'Transportation',
      priority: 'High',
      status: 'Open',
      patientId: p2._id,
      scheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      createdBy: nurse._id
    }
  ]);

  // Create system settings
  await SystemSettings.create([
    {
      key: 'emailNotifications',
      value: true,
      category: 'Notification',
      description: 'Enable email notifications',
      updatedBy: admin._id
    },
    {
      key: 'smsNotifications',
      value: false,
      category: 'Notification',
      description: 'Enable SMS notifications',
      updatedBy: admin._id
    },
    {
      key: 'sessionTimeout',
      value: 60,
      category: 'Security',
      description: 'Session timeout in minutes',
      updatedBy: admin._id
    },
    {
      key: 'maintenanceMode',
      value: false,
      category: 'System',
      description: 'System maintenance mode',
      updatedBy: admin._id
    },
    {
      key: 'emergencyAlertThreshold',
      value: 5,
      category: 'Emergency',
      description: 'Number of alerts before emergency protocol',
      updatedBy: admin._id
    }
  ]);

  // Create sample announcement
  await Announcement.create({
    title: 'Welcome to Care Connect',
    message: 'Welcome to the Care Connect platform. This system is now fully operational with all features enabled.',
    type: 'Announcement',
    priority: 'Medium',
    targetRoles: ['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer'],
    isGlobal: true,
    status: 'Sent',
    sentAt: new Date(),
    createdBy: admin._id
  });
}

run().then(() => {
  // eslint-disable-next-line no-console
  console.log('Mongo seed complete');
  process.exit(0);
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});









