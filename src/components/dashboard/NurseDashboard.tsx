import { Heart, Pill, Clock, AlertTriangle, Activity, Stethoscope, Syringe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import nurseService from "@/services/nurseService";
import { format } from "date-fns/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RecordMedicationDialog } from "@/components/nurse/RecordMedicationDialog";
import { PatientVitalsForm } from "@/components/forms/PatientVitalsForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Patient, Round, MedicationData } from "@/types/nurse";

type Alert = {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  time: string;
};

export const NurseDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const medicationFormRef = useRef<{ reset: () => void }>(null);

  // Fetch nurse's patients with automatic refetching
  const { 
    data: patients = [] as Patient[], 
    isLoading: isLoadingPatients,
    refetch: refetchPatients 
  } = useQuery<Patient[]>({
    queryKey: ['nursePatients'],
    queryFn: async () => {
      try {
        const data = await nurseService.getNursePatients();
        return data || [];
      } catch (error) {
        console.error('Error fetching nurse patients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load patients. Please try again.',
          variant: 'destructive',
        });
        return [];
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch patient vitals when a patient is selected
  const { 
    data: patientVitals = [], 
    refetch: refetchVitals 
  } = useQuery({
    queryKey: ['patientVitals', selectedPatient?._id],
    queryFn: () => selectedPatient ? patientCareApi.getVitals(selectedPatient._id) : [],
    enabled: !!selectedPatient,
  });

  // Fetch patient notes when a patient is selected
  const { 
    data: patientNotes = [], 
    refetch: refetchNotes 
  } = useQuery({
    queryKey: ['patientNotes', selectedPatient?._id],
    queryFn: () => selectedPatient ? patientCareApi.getNotes(selectedPatient._id) : [],
    enabled: !!selectedPatient,
  });

  // Fetch nurse's schedule
  const { data: schedule = [] as Round[], isLoading: isLoadingSchedule } = useQuery<Round[]>({
    queryKey: ['nurseSchedule'],
    queryFn: nurseService.getNurseSchedule,
  });

  // Calculate stats
  const patientsUnderCare = patients.length;
  const medicationsDue = schedule.reduce(
    (count, round) => count + (round.status === 'Scheduled' ? 1 : 0),
    0
  );
  const roundsCompleted = schedule.filter((round) => round.status === 'Completed').length;
  const totalRounds = schedule.length;
  const criticalAlerts = patients.filter(
    (patient) => patient.priority === 'High' || patient.priority === 'Critical'
  ).length;

  const shiftStats = [
    { 
      title: "Patients Under Care", 
      value: patientsUnderCare.toString(), 
      icon: Heart, 
      color: "text-primary" 
    },
    { 
      title: "Medications Due", 
      value: medicationsDue.toString(), 
      icon: Pill, 
      color: "text-secondary" 
    },
    { 
      title: "Rounds Completed", 
      value: `${roundsCompleted}/${totalRounds}`, 
      icon: Clock, 
      color: "text-medical-healing" 
    },
    { 
      title: "Critical Alerts", 
      value: criticalAlerts.toString(), 
      icon: AlertTriangle, 
      color: "text-destructive" 
    },
  ];

  // Handle record vitals with proper invalidation
  const recordVitalsMutation = useMutation({
    mutationFn: ({ patientId, vitalsData }: { patientId: string, vitalsData: any }) =>
      nurseService.recordVitals(patientId, vitalsData),
    onSuccess: () => {
      // Invalidate and refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nursePatients'] }),
        queryClient.invalidateQueries({ queryKey: ['patientVitals', selectedPatient?._id] }),
        refetchPatients(),
        refetchVitals()
      ]).then(() => {
        toast({
          title: "Vitals recorded successfully",
          description: "Patient's vital signs have been updated.",
        });
        setShowVitalsDialog(false);
      });
    },
    onError: (error: any) => {
      console.error('Vitals recording error:', error);
      toast({
        title: "Error recording vitals",
        description: error.response?.data?.message || "Failed to record vitals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRecordVitals = useCallback(async (data: any) => {
    if (!selectedPatient) return;
    
    await recordVitalsMutation.mutateAsync({
      patientId: selectedPatient._id,
      vitalsData: {
        ...data,
        recordedBy: currentUser?.id || 'nurse',
        recordedAt: new Date().toISOString()
      }
    });
  }, [selectedPatient, recordVitalsMutation, currentUser]);

  // Handle record medication with proper invalidation
  const recordMedicationMutation = useMutation({
    mutationFn: (medicationData: Omit<MedicationData, 'time' | 'patientId'> & { time?: Date }) => {
      if (!selectedPatient) throw new Error('No patient selected');
      
      const dataToSend: Omit<MedicationData, 'id'> = {
        ...medicationData,
        patientId: selectedPatient._id,
        time: medicationData.time || new Date(),
        // Ensure required fields are present
        prescriptionId: medicationData.prescriptionId || `temp-${Date.now()}`,
        medication: medicationData.medication || 'Unknown',
        dosage: medicationData.dosage || 'As directed'
      };
      
      return nurseService.recordMedication(dataToSend);
    },
    onSuccess: () => {
      // Invalidate and refetch all related data
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nursePatients'] }),
        queryClient.invalidateQueries({ queryKey: ['patientMedications', selectedPatient?._id] }),
        refetchPatients()
      ]).then(() => {
        toast({
          title: "Medication recorded",
          description: "Medication administration has been successfully recorded.",
        });
        setShowMedicationDialog(false);
      });
    },
    onError: (error: Error) => {
      console.error('Medication recording error:', error);
      toast({
        title: "Error recording medication",
        description: error.message || "Failed to record medication. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle complete round
  const completeRoundMutation = useMutation({
    mutationFn: async ({ roundId, notes = 'Round completed as scheduled' }: { roundId: string, notes?: string }) => {
      await nurseService.updateRoundStatus(roundId, 'Completed', notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurseSchedule'] });
      toast({
        title: "Round completed",
        description: "Patient round has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error completing round",
        description: error.response?.data?.message || "Failed to update round status",
        variant: "destructive",
      });
    },
  });

  if (isLoadingPatients || isLoadingSchedule) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Good {getGreetingTime()}, {localStorage.getItem('userName') || 'Nurse'} - {getShift()}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="btn-medical"
            onClick={() => {
              if (patients.length > 0) {
                setSelectedPatient(patients[0]);
                setShowVitalsDialog(true);
              }
            }}
            disabled={patients.length === 0}
          >
            <Activity className="mr-2 h-4 w-4" />
            Record Vitals
          </Button>
          <Button 
            variant="outline" 
            className="border-primary/20"
            onClick={() => {
              if (patients.length > 0) {
                setSelectedPatient(patients[0]);
                setShowMedicationDialog(true);
              }
            }}
            disabled={patients.length === 0}
          >
            <Syringe className="mr-2 h-4 w-4" />
            Administer Medication
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      {/* Record Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Patient Vitals</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Record vital signs for ${selectedPatient.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedPatient && (
              <PatientVitalsForm
                patientId={selectedPatient._id}
                onSuccess={() => setShowVitalsDialog(false)}
                onCancel={() => setShowVitalsDialog(false)}
                onSubmit={handleRecordVitals}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Medication Dialog */}
      <RecordMedicationDialog
        open={showMedicationDialog}
        onOpenChange={setShowMedicationDialog}
        patient={selectedPatient}
        onSave={(medicationData) => recordMedicationMutation.mutate({
          ...medicationData,
          patientId: selectedPatient._id,
          time: medicationData.time || new Date()
        })}
        isLoading={recordMedicationMutation.isPending}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shiftStats.map((stat) => (
          <StatCard
            key={stat.title}
            icon={<stat.icon className={`h-5 w-5 ${stat.color}`} />}
            label={stat.title}
            value={stat.value}
          />
        ))}
      </div>

      {/* Schedule and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your patient rounds for today</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rounds scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedule.map((round) => (
                  <div key={round._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {round.patientId?.name || 'Unknown Patient'}
                        {round.patientId?.roomNumber && ` (${round.patientId.roomNumber})`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(round.scheduledAt), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => completeRoundMutation.mutate({ roundId: round._id })}
                        disabled={round.status === 'Completed'}
                      >
                        {round.status === 'Completed' ? 'Completed' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Patient Alerts
            </CardTitle>
            <CardDescription>Recent alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {patients.filter((p) => p.priority === 'High' || p.priority === 'Critical').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No critical alerts at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients
                  .filter((p) => p.priority === 'High' || p.priority === 'Critical')
                  .map((patient) => (
                    <div key={patient._id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div
                        className={`p-2 rounded-full ${
                          patient.priority === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {patient.name} (Room {patient.roomNumber})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.priority} Priority
                        </p>
                        {patient.lastVitalCheck && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last vitals: {format(new Date(patient.lastVitalCheck), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowVitalsDialog(true);
                        }}
                      >
                        Record Vitals
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-foreground">Care Actions</CardTitle>
          <CardDescription>Quick access to patient care tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Vital Signs", color: "bg-primary", urgent: false },
              { label: "Medication", color: "bg-secondary", urgent: true },
              { label: "Patient Notes", color: "bg-medical-healing", urgent: false },
              { label: "Emergency", color: "bg-destructive", urgent: true },
              { label: "Discharge", color: "bg-accent", urgent: false },
            ].map((action, index) => (
              <Button 
                key={action.label}
                variant="outline" 
                className={`h-20 flex flex-col items-center justify-center border-border hover:bg-muted/50 relative ${
                  action.urgent ? 'border-destructive/30' : ''
                }`}
              >
                {action.urgent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
                )}
                <div className={`w-8 h-8 rounded-lg ${action.color} mb-2`} />
                <span className="text-sm text-foreground">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getShift() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Morning Shift (7AM - 3PM)';
  if (hour >= 14 && hour < 22) return 'Afternoon Shift (3PM - 11PM)';
  return 'Night Shift (11PM - 7AM)';
}

export default NurseDashboard;