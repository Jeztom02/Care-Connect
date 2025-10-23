import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { User, Patient } from '../models';

export const volunteerRouter = Router();
volunteerRouter.use(authenticateJwt);

// Get volunteer tasks (volunteer role only)
volunteerRouter.get('/tasks', authorizeRoles('volunteer'), async (req: Request, res: Response) => {
  // Mock volunteer tasks - in a real app, you'd have a Task model
  const tasks = [
    {
      id: '1',
      title: 'Companion visit with Mrs. Johnson',
      patient: 'Room 201 - Mrs. Johnson',
      time: '10:00 AM',
      status: 'completed',
      priority: 'medium',
      description: 'Provide companionship and assist with reading'
    },
    {
      id: '2',
      title: 'Meal assistance for Mr. Davis',
      patient: 'Room 203 - Mr. Davis',
      time: '12:00 PM',
      status: 'in-progress',
      priority: 'high',
      description: 'Help with lunch and ensure proper nutrition'
    },
    {
      id: '3',
      title: 'Wheelchair transport to therapy',
      patient: 'Room 205 - Ms. Chen',
      time: '2:00 PM',
      status: 'pending',
      priority: 'medium',
      description: 'Transport patient to physical therapy session'
    }
  ];
  
  res.json(tasks);
});

// Get volunteer schedule (volunteer role only)
volunteerRouter.get('/schedule', authorizeRoles('volunteer'), async (req: Request, res: Response) => {
  // Mock volunteer schedule
  const schedule = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      task: 'Companion visit',
      patient: 'Mrs. Johnson',
      status: 'completed'
    },
    {
      id: '2',
      date: new Date().toISOString().split('T')[0],
      time: '12:00 PM',
      task: 'Meal assistance',
      patient: 'Mr. Davis',
      status: 'in-progress'
    },
    {
      id: '3',
      date: new Date().toISOString().split('T')[0],
      time: '2:00 PM',
      task: 'Transport assistance',
      patient: 'Ms. Chen',
      status: 'pending'
    }
  ];
  
  res.json(schedule);
});

// Get volunteer reports (volunteer role only)
volunteerRouter.get('/reports', authorizeRoles('volunteer'), async (req: Request, res: Response) => {
  // Mock volunteer reports
  const reports = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      tasksCompleted: 5,
      hoursVolunteered: 4,
      patientsHelped: 3,
      notes: 'Great day helping patients with various tasks'
    },
    {
      id: '2',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tasksCompleted: 3,
      hoursVolunteered: 3,
      patientsHelped: 2,
      notes: 'Focused on meal assistance and companionship'
    }
  ];
  
  res.json(reports);
});

// Get patient support updates (volunteer role only)
volunteerRouter.get('/patient-support', authorizeRoles('volunteer'), async (req: Request, res: Response) => {
  // Mock patient support updates
  const updates = [
    {
      id: '1',
      patient: 'Mrs. Johnson',
      update: 'Had a wonderful conversation about her grandchildren',
      time: '10:30 AM',
      type: 'companionship'
    },
    {
      id: '2',
      patient: 'Mr. Davis',
      update: 'Ate 80% of his lunch with assistance',
      time: '12:45 PM',
      type: 'nutrition'
    },
    {
      id: '3',
      patient: 'Ms. Chen',
      update: 'Expressed gratitude for the transport assistance',
      time: '2:15 PM',
      type: 'transport'
    }
  ];
  
  res.json(updates);
});















