import { Heart, Calendar, Pill, FileText, Activity, Plus, AlertTriangle, Stethoscope, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { BarMini } from "@/components/charts/BarMini";
import { useState, useEffect } from "react";
import { AddNoteDialog } from "@/components/patient/AddNoteDialog";
import { UpdateVitalsDialog } from "@/components/patient/UpdateVitalsDialog";
import { EmergencyAlertDialog } from "@/components/patient/EmergencyAlertDialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VitalsData } from "@/components/patient/UpdateVitalsDialog";
import patientCareApi from "@/services/patientCareService";
import { useParams } from "react-router-dom";

export const PatientDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { patientId } = useParams<{ patientId: string }>();
  const [showAddNote, setShowAddNote] = useState(false);
  const [showUpdateVitals, setShowUpdateVitals] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Fetch patient data
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientCareApi.getPatientInfo(patientId!), 
    enabled: !!patientId,
    onSuccess: (data) => {
      setSelectedPatient(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load patient data",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a note
  const addNoteMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => 
      patientCareApi.addNote(patientId!, content),
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been added to the patient's record.",
      });
      setShowAddNote(false);
      queryClient.invalidateQueries({ queryKey: ['patientNotes', patientId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding note",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  // Mutation for recording vitals
  const recordVitalsMutation = useMutation({
    mutationFn: (vitals: VitalsData) => 
      patientCareApi.recordVitals(patientId!, vitals),
    onSuccess: () => {
      toast({
        title: "Vitals recorded",
        description: "Patient vitals have been recorded successfully.",
      });
      setShowUpdateVitals(false);
      queryClient.invalidateQueries({ queryKey: ['patientVitals', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error recording vitals",
        description: error.message || "Failed to record vitals",
        variant: "destructive",
      });
    },
  });

  // Mutation for emergency alert
  const emergencyAlertMutation = useMutation({
    mutationFn: (data: { priority: string; details: string }) => 
      patientCareApi.createEmergencyAlert(patientId!, data),
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "The medical team has been notified and will respond shortly.",
        variant: "destructive",
      });
      setShowEmergencyAlert(false);
      queryClient.invalidateQueries({ queryKey: ['emergencyAlerts', patientId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending alert",
        description: error.message || "Failed to send emergency alert",
        variant: "destructive",
      });
    },
  });

  // Fetch patient vitals
  const { data: vitalsData, isLoading: isLoadingVitals } = useQuery({
    queryKey: ['patientVitals', patientId],
    queryFn: () => patientCareApi.getVitals(patientId!),
    enabled: !!patientId,
  });

  // Fetch patient notes
  const { data: notesData, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['patientNotes', patientId],
    queryFn: () => patientCareApi.getNotes(patientId!),
    enabled: !!patientId,
  });

  // Fetch emergency alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['emergencyAlerts', patientId],
    queryFn: () => patientCareApi.getEmergencyAlerts(patientId!),
    enabled: !!patientId,
  });

  const healthStats = [
    { 
      title: "Status", 
      value: selectedPatient?.status || "-", 
      icon: Activity, 
      color: "text-primary",
      action: () => {}
    },
    { 
      title: "Last Vitals", 
      value: vitalsData?.[0] ? new Date(vitalsData[0].recordedAt).toLocaleDateString() : "-", 
      icon: Activity, 
      color: "text-secondary",
      action: () => setShowUpdateVitals(true)
    },
    { 
      title: "Notes", 
      value: notesData?.length || 0, 
      icon: FileText, 
      color: "text-medical-healing",
      action: () => setShowAddNote(true)
    },
    { 
      title: "Alerts", 
      value: alertsData?.filter((a: any) => a.status === 'active').length || 0, 
      icon: AlertTriangle, 
      color: "text-destructive",
      action: () => {}
    },
  ];

  const upcomingAppointments = [
    { doctor: "Dr. Sarah Johnson", specialty: "Cardiology", date: "Tomorrow", time: "2:00 PM", type: "Follow-up" },
    { doctor: "Dr. Michael Chen", specialty: "General Practice", date: "Next Week", time: "10:00 AM", type: "Check-up" },
    { doctor: "Lab Technician", specialty: "Laboratory", date: "Next Friday", time: "9:00 AM", type: "Blood Test" },
  ];

  const medicationReminders = [
    { medication: "Lisinopril", dosage: "10mg", time: "8:00 AM", taken: true },
    { medication: "Metformin", dosage: "500mg", time: "12:00 PM", taken: false },
    { medication: "Aspirin", dosage: "81mg", time: "8:00 PM", taken: false },
  ];

  const recentResults = [
    { test: "Blood Pressure", result: "120/80", status: "normal", date: "3 days ago" },
    { test: "Cholesterol", result: "185 mg/dL", status: "normal", date: "1 week ago" },
    { test: "Blood Sugar", result: "95 mg/dL", status: "normal", date: "1 week ago" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Health Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {localStorage.getItem('userName') || 'Patient'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="btn-medical">
            Book Appointment
          </Button>
          <Button variant="outline" className="border-primary/20">
            Message Doctor
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthStats.map((stat) => (
          <StatCard
            key={stat.title}
            icon={<stat.icon className={`h-5 w-5 ${stat.color}`} />}
            label={stat.title}
            value={stat.value}
          />
        ))}
      </div>

      {/* Mini Chart */}
      <div className="grid grid-cols-1 gap-6">
        {(() => {
          const taken = medicationReminders.filter(m => m.taken).length;
          const pending = medicationReminders.length - taken;
          return <BarMini title="Today's Medications (taken vs pending)" data={[{ x: 'Taken', y: taken }, { x: 'Pending', y: pending }]} />;
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your scheduled medical appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{appointment.doctor}</p>
                  <p className="text-sm text-muted-foreground">{appointment.specialty} • {appointment.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{appointment.date}</p>
                  <p className="text-xs text-muted-foreground">{appointment.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Medication Reminders */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Pill className="h-5 w-5 text-secondary" />
              Today's Medications
            </CardTitle>
            <CardDescription>Your daily medication schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicationReminders.map((med, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                med.taken ? 'bg-secondary/10 border border-secondary/20' : 'bg-orange-50 border border-orange-200'
              }`}>
                <div>
                  <p className="font-medium text-foreground">{med.medication}</p>
                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{med.time}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    med.taken ? 'bg-secondary/20 text-secondary' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {med.taken ? 'Taken' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Results */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-medical-healing" />
            Recent Test Results
          </CardTitle>
          <CardDescription>Your latest health monitoring results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentResults.map((result, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{result.test}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.status === 'normal' ? 'bg-secondary/20 text-secondary' :
                    result.status === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-lg font-semibold text-primary">{result.result}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patient Actions */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Patient Care Actions
          </CardTitle>
          <CardDescription>Manage patient care and document interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-border hover:bg-muted/50"
              onClick={() => setShowAddNote(true)}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Add Clinical Note</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-border hover:bg-muted/50"
              onClick={() => setShowUpdateVitals(true)}
            >
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-sm font-medium">Update Vitals</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40"
              onClick={() => setShowEmergencyAlert(true)}
            >
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">Emergency Alert</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddNoteDialog
        open={showAddNote}
        onOpenChange={setShowAddNote}
        onSave={async (note) => {
          await addNoteMutation.mutateAsync(note);
        }}
        isLoading={addNoteMutation.isPending}
      />

      <UpdateVitalsDialog
        open={showUpdateVitals}
        onOpenChange={setShowUpdateVitals}
        onSave={async (vitals) => {
          await recordVitalsMutation.mutateAsync(vitals);
        }}
        isLoading={recordVitalsMutation.isPending}
      />

      <EmergencyAlertDialog
        open={showEmergencyAlert}
        onOpenChange={setShowEmergencyAlert}
        onAlert={async (alertData) => {
          await emergencyAlertMutation.mutateAsync(alertData);
        }}
        isLoading={emergencyAlertMutation.isPending}
      />
    </div>
  );
};