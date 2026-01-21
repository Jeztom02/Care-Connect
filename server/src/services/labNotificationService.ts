import { getIO } from '../socket';
import { User, Patient } from '../models';
import { sendEmail } from '../email';
import { LabReport } from '../models/labReport';

interface LabReportNotificationData {
  reportId: string;
  testName: string;
  patientId: string;
  patientName: string;
  uploadedBy: string;
  uploadedByName: string;
  date: Date;
  priority: string;
  action: 'created' | 'updated' | 'deleted';
}

/**
 * Send notifications when lab reports are created, updated, or deleted
 */
export async function sendLabReportNotification(data: LabReportNotificationData) {
  try {
    const { reportId, testName, patientId, patientName, uploadedByName, priority, action } = data;

    // Get patient details
    const patient = await (Patient as any).findById(patientId)
      .populate('userId', 'email name preferences')
      .populate('assignedDoctorId', 'email name preferences');

    if (!patient) {
      console.error('Patient not found for notification:', patientId);
      return;
    }

    // Prepare notification message
    let message = '';
    let title = '';
    
    switch (action) {
      case 'created':
        title = 'New Lab Report Available';
        message = `A new lab report (${testName}) has been uploaded for ${patientName} by ${uploadedByName}.`;
        break;
      case 'updated':
        title = 'Lab Report Updated';
        message = `The lab report (${testName}) for ${patientName} has been updated.`;
        break;
      case 'deleted':
        title = 'Lab Report Removed';
        message = `A lab report (${testName}) for ${patientName} has been removed.`;
        break;
    }

    // Get socket.io instance for real-time notifications
    const io = getIO();
    
    // List of users to notify
    const usersToNotify: string[] = [];

    // 1. Notify assigned doctor
    if (patient.assignedDoctorId) {
      const doctorId = (patient.assignedDoctorId as any)._id?.toString() || patient.assignedDoctorId.toString();
      usersToNotify.push(doctorId);
      
      // Send real-time notification via socket
      io.to(`user:${doctorId}`).emit('lab:report:notification', {
        type: 'lab_report',
        action,
        reportId,
        testName,
        patientId,
        patientName,
        priority,
        message,
        timestamp: new Date()
      });

      // Send email if enabled
      const doctor = patient.assignedDoctorId as any;
      if (doctor.email && doctor.preferences?.notifications?.email !== false) {
        await sendEmail({
          to: doctor.email,
          subject: title,
          text: message,
          html: generateLabReportEmailHTML(title, message, testName, patientName, priority)
        }).catch(err => console.error('Failed to send email to doctor:', err));
      }
    }

    // 2. Notify assigned nurses (if they exist in your system)
    // You can add nurse assignment logic here

    // 3. Notify patient (if they have a user account)
    if (patient.userId) {
      const patientUserId = (patient.userId as any)._id?.toString() || patient.userId.toString();
      usersToNotify.push(patientUserId);

      // Send real-time notification via socket
      io.to(`user:${patientUserId}`).emit('lab:report:notification', {
        type: 'lab_report',
        action,
        reportId,
        testName,
        priority,
        message: `Your lab report (${testName}) is now available.`,
        timestamp: new Date()
      });

      // Send email if enabled
      const patientUser = patient.userId as any;
      if (patientUser.email && patientUser.preferences?.notifications?.email !== false) {
        await sendEmail({
          to: patientUser.email,
          subject: title,
          text: `Your lab report (${testName}) is now available.`,
          html: generateLabReportEmailHTML(
            title, 
            `Your lab report (${testName}) is now available. Please log in to view your results.`,
            testName,
            '',
            priority
          )
        }).catch(err => console.error('Failed to send email to patient:', err));
      }
    }

    // 4. Also broadcast to patient room for any connected devices
    io.to(`patient:${patientId}`).emit('lab:report:notification', {
      type: 'lab_report',
      action,
      reportId,
      testName,
      patientId,
      priority,
      message,
      timestamp: new Date()
    });

    // Update notification tracking in the report
    await (LabReport as any).findByIdAndUpdate(reportId, {
      notificationsSent: true,
      notifiedUsers: usersToNotify
    });

    console.log(`Lab report notifications sent for report ${reportId} to ${usersToNotify.length} users`);
  } catch (error) {
    console.error('Error sending lab report notification:', error);
  }
}

/**
 * Generate HTML email template for lab report notifications
 */
function generateLabReportEmailHTML(title: string, message: string, testName: string, patientName: string, priority: string): string {
  const priorityColor = priority === 'STAT' ? '#dc2626' : priority === 'Urgent' ? '#f59e0b' : '#10b981';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 ${title}</h1>
        </div>
        <div class="content">
          <div class="card">
            <p>${message}</p>
            ${patientName ? `<p><strong>Patient:</strong> ${patientName}</p>` : ''}
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>Priority:</strong> <span class="priority-badge" style="background-color: ${priorityColor};">${priority}</span></p>
          </div>
          <p>Please log in to Care Connect to view the complete report.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Care Connect Lab Module.</p>
          <p>If you wish to stop receiving these emails, please update your notification preferences in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Notify lab staff when a patient uploads medical history
 */
export async function notifyLabStaffOfPatientHistory(patientId: string, patientName: string, documentType: string) {
  try {
    const io = getIO();
    
    // Find all lab staff users
    const labUsers = await (User as any).find({ role: 'lab', isActive: true }).select('_id email name preferences');

    for (const labUser of labUsers) {
      // Send real-time notification
      io.to(`user:${labUser._id.toString()}`).emit('lab:history:notification', {
        type: 'patient_history',
        patientId,
        patientName,
        documentType,
        message: `${patientName} has uploaded a ${documentType} to their medical history.`,
        timestamp: new Date()
      });

      // Send email if enabled
      if (labUser.email && labUser.preferences?.notifications?.email !== false) {
        await sendEmail({
          to: labUser.email,
          subject: 'New Patient Medical History Upload',
          text: `${patientName} has uploaded a ${documentType} to their medical history. Please review when convenient.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>New Patient Medical History Upload</h2>
              <p>${patientName} has uploaded a <strong>${documentType}</strong> to their medical history.</p>
              <p>Please log in to review when convenient.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Dashboard</a>
            </div>
          `
        }).catch(err => console.error('Failed to send email to lab staff:', err));
      }
    }
  } catch (error) {
    console.error('Error notifying lab staff:', error);
  }
}
