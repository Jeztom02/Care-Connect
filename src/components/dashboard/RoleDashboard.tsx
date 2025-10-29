import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ModernCard } from '@/components/ui/ModernCard';
import { Button } from '@/components/ui/button';
import { Bell, Stethoscope, User, Users, Activity, FileText, Calendar, Pill } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/components/ui/use-toast';

const StatCard = ({ title, value, icon: Icon, color = 'primary' }: { title: string; value: string | number; icon: React.ElementType; color?: string }) => (
  <ModernCard className="p-6 transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
      <div className={`rounded-full p-3 bg-${color}-100 dark:bg-${color}-900/30`}>
        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
  </ModernCard>
);

const QuickAction = ({ title, icon: Icon, onClick, color = 'primary' }: { title: string; icon: React.ElementType; onClick: () => void; color?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-${color}-50 dark:hover:bg-gray-800 transition-colors`}
  >
    <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/30 mb-2`}>
      <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <span className="text-sm font-medium">{title}</span>
  </button>
);

const DoctorDashboard = () => {
  const { sendMessage } = useWebSocket();
  const { toast } = useToast();

  const handleQuickAction = (action: string) => {
    sendMessage({
      type: 'USER_ACTION',
      payload: { action },
      timestamp: new Date().toISOString(),
    });
    
    toast({
      title: 'Action Performed',
      description: `${action} action was triggered`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value="142" icon={Users} color="primary" />
        <StatCard title="Appointments Today" value="8" icon={Calendar} color="secondary" />
        <StatCard title="Pending Prescriptions" value="5" icon={FileText} color="warning" />
        <StatCard title="Alerts" value="3" icon={Bell} color="error" />
      </div>

      <ModernCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickAction 
            title="New Patient" 
            icon={User} 
            onClick={() => handleQuickAction('Add New Patient')} 
          />
          <QuickAction 
            title="New Prescription" 
            icon={FileText} 
            onClick={() => handleQuickAction('Create Prescription')}
            color="secondary"
          />
          <QuickAction 
            title="Schedule" 
            icon={Calendar} 
            onClick={() => handleQuickAction('Schedule Appointment')}
            color="success"
          />
          <QuickAction 
            title="Vitals" 
            icon={Activity} 
            onClick={() => handleQuickAction('Record Vitals')}
            color="warning"
          />
          <QuickAction 
            title="Medications" 
            icon={Pill} 
            onClick={() => handleQuickAction('Manage Medications')}
            color="primary"
          />
          <QuickAction 
            title="Consultation" 
            icon={Stethoscope} 
            onClick={() => handleQuickAction('Start Consultation')}
            color="secondary"
          />
        </div>
      </ModernCard>

      {/* Add more sections like Recent Patients, Upcoming Appointments, etc. */}
    </div>
  );
};

const NurseDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Patients to Check" value="12" icon={Users} color="primary" />
      <StatCard title="Vitals to Record" value="7" icon={Activity} color="warning" />
      <StatCard title="Medications Due" value="5" icon={Pill} color="error" />
    </div>
    {/* Add nurse-specific components */}
  </div>
);

const PatientDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Upcoming Appointments" value="2" icon={Calendar} color="primary" />
      <StatCard title="Active Medications" value="3" icon={Pill} color="secondary" />
      <StatCard title="Unread Messages" value="1" icon={Bell} color="warning" />
    </div>
    {/* Add patient-specific components */}
  </div>
);

const FamilyDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard title="Patient's Medications" value="4" icon={Pill} color="primary" />
      <StatCard title="Recent Updates" value="3" icon={Bell} color="secondary" />
    </div>
    {/* Add family-specific components */}
  </div>
);

export const RoleDashboard = () => {
  const { isAdmin, isDoctor, isNurse, isPatient, isFamily } = useRoleAccess();

  if (isAdmin || isDoctor) {
    return <DoctorDashboard />;
  }

  if (isNurse) {
    return <NurseDashboard />;
  }

  if (isPatient) {
    return <PatientDashboard />;
  }

  if (isFamily) {
    return <FamilyDashboard />;
  }

  // Default view for unauthenticated or unknown roles
  return (
    <ModernCard className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-2">Welcome to Compassion Care</h2>
      <p className="text-gray-600 dark:text-gray-400">Please sign in to access your dashboard.</p>
    </ModernCard>
  );
};
