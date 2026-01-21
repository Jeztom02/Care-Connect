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
import { VideoConsult } from "@/pages/dashboard/VideoConsult";
import { LabReports } from "@/pages/dashboard/LabReports";
import { PharmacyBilling } from "@/pages/dashboard/PharmacyBilling";
import { PatientPharmacyOrders } from "@/pages/dashboard/PatientPharmacyOrders";
import { LabDashboard } from "@/components/dashboard/LabDashboard";
import { PharmacyDashboard } from "@/components/dashboard/PharmacyDashboard";
import { UploadLabReport } from "@/pages/dashboard/UploadLabReport";
import { LabPatientRequests } from "@/pages/dashboard/LabPatientRequests";
import { PharmacyTransactions } from "@/pages/dashboard/PharmacyTransactions";
// import { EquipmentSale } from "@/pages/dashboard/EquipmentSale";
import { EquipmentList } from "@/pages/Equipment/EquipmentList";
import { AddEquipment } from "@/pages/Equipment/AddEquipment";
import { AdminEquipmentTransactions } from '@/pages/dashboard/AdminEquipmentTransactions';
import { AdminUsedEquipmentSales } from '@/pages/dashboard/AdminUsedEquipmentSales';

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
      case 'lab':
        return <LabDashboard />;
      case 'pharmacy':
        return <PharmacyDashboard />;
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
            <Route path="equipment" element={<EquipmentList />} />
            <Route path="equipment/transactions" element={<AdminEquipmentTransactions />} />
            <Route path="equipment/sales" element={<AdminUsedEquipmentSales />} />
          </>
        )}
        
        {/* Doctor Routes */}
        {role === 'doctor' && (
          <>
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments userRole={role} />} />
            <Route path="records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions userRole={role} />} />
            <Route path="video-consult" element={<VideoConsult />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="patient-reports" element={<LabPatientRequests />} />
            <Route path="pharmacy" element={<PharmacyBilling />} />
            <Route path="pharmacy-orders" element={<PatientPharmacyOrders />} />
          </>
        )}
        
        {/* Lab Routes */}
        {role === 'lab' && (
          <>
            <Route path="" element={<LabDashboard />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="upload-report" element={<UploadLabReport />} />
            <Route path="patient-reports" element={<LabPatientRequests />} />
            <Route path="calendar" element={<Calendar userRole={role} />} />
          </>
        )}

        {/* Pharmacy Routes */}
        {role === 'pharmacy' && (
          <>
            <Route path="" element={<PharmacyDashboard />} />
            <Route path="prescriptions" element={<Prescriptions userRole={role} />} />
            <Route path="billing" element={<PharmacyTransactions />} />
            <Route path="pharmacy" element={<PharmacyBilling />} />
          </>
        )}
        
        {/* Nurse Routes */}
        {role === 'nurse' && (
          <>
            <Route path="patient-care" element={<PatientCare />} />
            <Route path="medications" element={<Medications userRole={role} />} />
            <Route path="rounds" element={<Rounds />} />
            <Route path="alerts" element={<Alerts userRole={role} />} />
            <Route path="patient-reports" element={<LabPatientRequests />} />
          </>
        )}
        
        {/* Patient Routes */}
        {role === 'patient' && (
          <>
            <Route path="health" element={<MyHealth />} />
            <Route path="appointments" element={<Appointments userRole={role} />} />
            <Route path="equipment" element={<EquipmentList />} />
            <Route path="equipment/add" element={<AddEquipment />} />
            <Route path="equipment/my-listings" element={<EquipmentList />} />
            <Route path="medications" element={<Medications userRole={role} />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="pharmacy" element={<PharmacyBilling />} />
            <Route path="pharmacy-orders" element={<PatientPharmacyOrders />} />
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