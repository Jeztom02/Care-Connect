import MedicationDashboard from "@/components/dashboard/MedicationDashboard.ts";

interface MedicationsProps {
  userRole: string;
}

/**
 * Medications component that renders the medication dashboard
 * @param userRole - The role of the current user (e.g., 'nurse', 'patient')
 */
const Medications = ({ userRole }: MedicationsProps) => {
  // The MedicationDashboard component handles all the logic and UI
  return <MedicationDashboard />;
};

export default Medications;