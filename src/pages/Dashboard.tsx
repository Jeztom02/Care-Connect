import React from 'react';
import { useParams, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NurseDashboard } from "@/components/dashboard/NurseDashboard";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { FamilyDashboard } from "@/components/dashboard/FamilyDashboard";
import { VolunteerDashboard } from "@/components/dashboard/VolunteerDashboard";
import { Settings } from "@/pages/dashboard/Settings";
import { Messages } from "@/pages/dashboard/Messages";
import { Calendar } from "@/pages/dashboard/Calendar";
import { Patients } from "@/pages/dashboard/Patients";
import { Appointments } from "@/pages/dashboard/Appointments";
import { MedicalRecords } from "@/pages/dashboard/MedicalRecords";
import { Prescriptions } from "@/pages/dashboard/Prescriptions";
import { PatientCare } from "@/pages/dashboard/PatientCare";
import Medications from "@/pages/dashboard/Medications";
import { Rounds } from "@/pages/dashboard/Rounds";
import { Alerts } from "@/pages/dashboard/Alerts";

interface DashboardProps {
  role?: string;
}
import { MyHealth } from "@/pages/dashboard/MyHealth";
import { TestResults } from "@/pages/dashboard/TestResults";
import { PatientStatus } from "@/pages/dashboard/PatientStatus";
import { CareUpdates } from "@/pages/dashboard/CareUpdates";
import { Emergency } from "@/pages/dashboard/Emergency";
import { UserManagement } from "@/pages/dashboard/UserManagement";
import { Analytics } from "@/pages/dashboard/Analytics";
import { SystemHealth } from "@/pages/dashboard/SystemHealth";
import { AdminMessaging } from "@/pages/dashboard/AdminMessaging";
import { AdminUserManagement } from "@/pages/dashboard/AdminUserManagement";
import { AdminAnalytics } from "@/pages/dashboard/AdminAnalytics";
import { AdminSettings } from "@/pages/dashboard/AdminSettings";
import { VolunteerTasks } from "@/pages/dashboard/VolunteerTasks";
import { VolunteerPatientSupport } from "@/pages/dashboard/VolunteerPatientSupport";
import { VolunteerReports } from "@/pages/dashboard/VolunteerReports";
import { EmergencySOS } from "@/components/dashboard/EmergencySOS";
import { AnimatePresence, motion } from "framer-motion";

export const Dashboard: React.FC<DashboardProps> = ({ role: propRole }) => {
  const params = useParams<{ role: string }>();
  const role = propRole || params.role;
  const location = useLocation();
  
  if (!role) {
    return <div>Invalid role</div>;
  }

  const renderMainDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      case 'patient':
        return <PatientDashboard />;
      case 'family':
        return <FamilyDashboard />;
      case 'volunteer':
        return <VolunteerDashboard />;
      default:
        return <div>Unknown role: {role}</div>;
    }
  };

  return (
    <DashboardLayout userRole={role}>
      <ErrorBoundary>
        {(role === 'patient' || role === 'family') && <EmergencySOS />}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
        <Routes location={location}>
        <Route index element={renderMainDashboard()} />
        <Route path="settings" element={<Settings userRole={role} />} />
        <Route path="messages" element={<Messages userRole={role} />} />
        <Route path="calendar" element={<Calendar userRole={role} />} />
        
        {/* Admin Routes */}
        {role === 'admin' && (
          <>
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="system" element={<SystemHealth />} />
            <Route path="messages" element={<AdminMessaging />} />
            <Route path="settings" element={<AdminSettings />} />
          </>
        )}
        
        {/* Doctor Routes */}
        {role === 'doctor' && (
          <>
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments userRole={role} />} />
            <Route path="records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions userRole={role} />} />
          </>
        )}
        
        {/* Nurse Routes */}
        {role === 'nurse' && (
          <>
            <Route path="patient-care" element={<PatientCare />} />
            <Route path="medications" element={<Medications userRole={role} />} />
            <Route path="rounds" element={<Rounds />} />
            <Route path="alerts" element={<Alerts userRole={role} />} />
          </>
        )}
        
        {/* Patient Routes */}
        {role === 'patient' && (
          <>
            <Route path="health" element={<MyHealth />} />
            <Route path="appointments" element={<Appointments userRole={role} />} />
            <Route path="medications" element={<Medications userRole={role} />} />
            <Route path="results" element={<TestResults />} />
          </>
        )}
        
        {/* Family Routes */}
        {role === 'family' && (
          <>
            <Route path="patient-status" element={<PatientStatus />} />
            <Route path="care-updates" element={<CareUpdates />} />
            <Route path="appointments" element={<Appointments userRole={role} />} />
            <Route path="emergency" element={<Emergency />} />
          </>
        )}
        
        {/* Volunteer Routes */}
        {role === 'volunteer' && (
          <>
            <Route path="tasks" element={<VolunteerTasks userRole={role} />} />
            <Route path="patient-support" element={<VolunteerPatientSupport userRole={role} />} />
            <Route path="schedule" element={<Calendar userRole={role} />} />
            <Route path="reports" element={<VolunteerReports userRole={role} />} />
          </>
        )}
        
          <Route path="*" element={<Navigate to={`/dashboard/${role}`} replace />} />
        </Routes>
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>
    </DashboardLayout>
  );
};