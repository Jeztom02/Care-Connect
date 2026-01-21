import { useMemo, useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, AlertTriangle, Clock, User, MapPin, Thermometer, Activity, Loader2, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { usePatients } from "@/hooks/useApi";
import { SearchBar } from "@/components/SearchBar";
import { AddNoteDialog } from "@/components/patient/AddNoteDialog";
import { UpdateVitalsDialog } from "@/components/patient/UpdateVitalsDialog";
import { EmergencyAlertDialog } from "@/components/patient/EmergencyAlertDialog";
import { CarePathRecommendation } from "@/components/patient/CarePathRecommendation";
import { DischargeReadiness } from "@/components/patient/DischargeReadiness";
import { SimilarPatientsComponent } from "@/components/patient/SimilarPatients";
import { DoctorRecommendation } from "@/components/patient/DoctorRecommendation";
import { patientCareApi } from "@/services/patientCareService";
import { useToast } from "@/components/ui/use-toast";

export const PatientCare = () => {
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isEmergencyAlertOpen, setIsEmergencyAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [patientNotes, setPatientNotes] = useState<Record<string, any[]>>({});
  const [patientVitals, setPatientVitals] = useState<Record<string, any[]>>({});
  const { toast } = useToast();
  
  // Use the usePatients hook to manage patients data
  const { data: patientsData = [], loading, error, refetch: refetchPatients } = usePatients();
  
  // Add a manual refresh function
  const refreshPatientData = async () => {
    try {
      console.log('Refreshing patient data...');
      const updatedData = await refetchPatients();
      console.log('Refreshed patient data:', updatedData);
      setRefreshTrigger(prev => prev + 1); // Increment to trigger re-render
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh patient data',
        variant: 'destructive',
      });
    }
  };

  // Fetch notes for a patient
  const fetchPatientNotes = async (patientId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/patient-care/${patientId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle token expiration or invalid token
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            return fetchPatientNotes(patientId); // Retry with new token
          }
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setPatientNotes(prev => ({
        ...prev,
        [patientId]: data.data || []
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Optionally show error to user
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch patient notes',
        variant: 'destructive',
      });
    }
  };

  // Fetch vitals for a patient
  const fetchPatientVitals = async (patientId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/patient-care/${patientId}/vitals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle token expiration or invalid token
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            return fetchPatientVitals(patientId); // Retry with new token
          }
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch vitals');
      }
      
      const data = await response.json();
      setPatientVitals(prev => ({
        ...prev,
        [patientId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching vitals:', error);
      // Optionally show error to user
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch patient vitals',
        variant: 'destructive',
      });
    }
  };

  // Convert the data to the expected format if needed
  const formattedPatients = useMemo(() => {
    if (!patientsData) {
      console.log('No patients data available');
      return [];
    }
    
    console.log('Raw patients data:', patientsData);
    
    const formatted = patientsData.map(patient => {
      const patientId = patient._id || patient.id;
      
      return {
        ...patient,
        id: patientId,
        vitals: patientVitals[patientId]?.[0] || { heartRate: 0, bloodPressure: '-', temperature: 0, oxygenSaturation: 0 },
        carePlan: Array.isArray(patient.carePlan) ? patient.carePlan : [],
        notes: patientNotes[patientId] || []
      };
    });
    
    console.log('Formatted patients with notes and vitals:', formatted);
    return formatted;
  }, [patientsData, patientNotes, patientVitals, refreshTrigger]);

  // Filter patients based on search query and get current patient
  const { filteredPatients, currentPatient } = useMemo(() => {
    const list = formattedPatients || [];
    
    // Filter patients based on search query
    const filtered = searchQuery === "" 
      ? list 
      : list.filter(patient => 
          patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.room && patient.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (patient.condition && patient.condition.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    
    // Ensure selected index is within bounds
    const safeIndex = Math.min(selectedPatientIndex, Math.max(0, filtered.length - 1));
    const current = filtered[safeIndex] || null;
    
    return { filteredPatients: filtered, currentPatient: current };
  }, [formattedPatients, searchQuery, selectedPatientIndex]);

  // Fetch notes and vitals when currentPatient changes
  useEffect(() => {
    if (currentPatient?.id) {
      fetchPatientNotes(currentPatient.id);
      fetchPatientVitals(currentPatient.id);
    }
  }, [currentPatient?.id]);

  // Handle patient selection by ID
  const handlePatientSelect = (patientId: string) => {
    if (!formattedPatients || !Array.isArray(formattedPatients)) return;
    const index = formattedPatients.findIndex(p => p.id === patientId);
    if (index !== -1) {
      setSelectedPatientIndex(index);
      // Trigger Decision Tree refresh when patient changes
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleAddNote = async (note: string): Promise<void> => {
    if (!currentPatient) {
      toast({
        title: "❌ Error",
        description: "No patient selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Add the note using the API
      const response = await patientCareApi.addNote(currentPatient.id, note.trim());
      console.log('Note API response:', response);
      
      // Show success message
      toast({
        title: "✅ Note Added",
        description: "Your note has been saved successfully.",
        variant: "default",
        duration: 3000,
      });
      
      // Close the dialog
      setIsAddNoteOpen(false);
      
      // Refresh the notes for the current patient
      await fetchPatientNotes(currentPatient.id);
    } catch (error: any) {
      console.error("Error adding note:", error);
      
      // Handle authentication errors specifically
      if (error.response?.status === 401 || error.isAuthError) {
        toast({
          title: "🔒 Session Expired",
          description: error.message || "Your session has expired. Please log in again.",
          variant: "destructive",
          duration: 10000,
          action: (
            <Button 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => window.location.href = '/login'}
            >
              Log In
            </Button>
          ),
        });
      } else {
        const errorMessage = error.response?.data?.message || error.message || "Failed to add note. Please try again.";
        toast({
          title: "❌ Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVitals = async (vitals: any): Promise<void> => {
    if (!currentPatient) {
      toast({
        title: "❌ Error",
        description: "No patient selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Validate blood pressure format (e.g., 120/80)
      const bloodPressureRegex = /^\d{2,3}\/\d{2,3}$/;
      if (!bloodPressureRegex.test(vitals.bloodPressure)) {
        throw new Error('Please enter blood pressure in the format "120/80"');
      }
      
      // Parse and validate numeric values
      const parsedVitals = {
        heartRate: parseInt(vitals.heartRate, 10),
        temperature: parseFloat(vitals.temperature),
        oxygenSaturation: parseFloat(vitals.oxygenSaturation),
        respiratoryRate: parseInt(vitals.respiratoryRate, 10),
        bloodPressure: vitals.bloodPressure,
        notes: vitals.notes ? vitals.notes.trim() : ''
      };
      
      // Additional validation
      if (isNaN(parsedVitals.heartRate) || parsedVitals.heartRate < 30 || parsedVitals.heartRate > 250) {
        throw new Error('Heart rate must be between 30 and 250 bpm');
      }
      
      if (isNaN(parsedVitals.temperature) || parsedVitals.temperature < 30 || parsedVitals.temperature > 45) {
        throw new Error('Temperature must be between 30°C and 45°C');
      }
      
      if (isNaN(parsedVitals.oxygenSaturation) || parsedVitals.oxygenSaturation < 0 || parsedVitals.oxygenSaturation > 100) {
        throw new Error('Oxygen saturation must be between 0% and 100%');
      }
      
      if (isNaN(parsedVitals.respiratoryRate) || parsedVitals.respiratoryRate < 0 || parsedVitals.respiratoryRate > 60) {
        throw new Error('Respiratory rate must be between 0 and 60 breaths per minute');
      }
      
      // Record the vitals
      const response = await patientCareApi.recordVitals(currentPatient.id, parsedVitals);
      console.log('Vitals API response:', response);
      
      // Show success message
      toast({
        title: "✅ Vitals Updated",
        description: "Patient vitals have been successfully recorded.",
        variant: "default",
        duration: 4000,
      });
      
      // Close the dialog
      setIsUpdateVitalsOpen(false);
      
      // Refresh the vitals for the current patient
      await fetchPatientVitals(currentPatient.id);
      
      // Trigger Decision Tree components to refresh with new vitals
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Error updating vitals:", error);
      
      // Handle validation and other errors
      const errorMessage = error.response?.data?.message || error.message || "Failed to update vitals. Please check the values and try again.";
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
      
      throw error;
      
      if (error.isAuthError) {
        toast({
          title: "🔒 Session Expired",
          description: error.message || "Your session has expired. Please log in again.",
          variant: "destructive",
          duration: 10000,
          action: (
            <Button 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => window.location.href = '/login'}
            >
              Log In
            </Button>
          ),
        });
      } else {
        toast({
          title: "❌ Error",
          description: error.message || "Failed to update vitals. Please check the values and try again.",
          variant: "destructive",
          duration: 6000,
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAlert = async (details: { priority: 'high' | 'medium' | 'low'; details: string }): Promise<void> => {
    if (!currentPatient) return;
    
    try {
      setIsLoading(true);
      
      // Send the emergency alert
      await patientCareApi.createEmergencyAlert(currentPatient.id, { 
        priority: details.priority.toLowerCase(), 
        details: details.details.trim() 
      });
      
      // Force a complete refresh of the patient data
      const response = await refetchPatients();
      
      if (response && Array.isArray(response)) {
        // Update the local state with the new data
        setPatientsData([...response]);
        
        toast({
          title: "🚨 Emergency Alert Sent",
          description: `A ${details.priority} priority alert has been sent to the medical team.`,
          variant: "default",
          duration: 5000,
          className: "bg-blue-600 text-white"
        });
        
        setIsEmergencyAlertOpen(false);
      }
      return; // Explicitly return void
    } catch (error: any) {
      console.error("Error sending emergency alert:", error);
      
      // Show appropriate error message based on error type
      const errorMessage = error.message || "Failed to send emergency alert. Please try again.";
      
      if (error.isAuthError) {
        toast({
          title: "🔒 Session Expired",
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
          action: (
            <Button 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => window.location.href = '/login'}
            >
              Log In
            </Button>
          ),
        });
      } else {
        toast({
          title: "❌ Error",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case "heartRate":
        if (value < 60 || value > 100) return "text-red-600";
        return "text-green-600";
      case "temperature":
        if (value > 99.5) return "text-red-600";
        return "text-green-600";
      case "oxygenSaturation":
        if (value < 95) return "text-red-600";
        return "text-green-600";
      default:
        return "text-green-600";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load patients</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetchPatients()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!filteredPatients.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No patients found</h2>
          <p className="text-muted-foreground">
            {searchQuery ? 'No patients match your search criteria.' : 'No patients available.'}
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          )}
        </div>
      </div>
    );
  }

  const completedTasks = currentPatient && Array.isArray(currentPatient.carePlan)
    ? currentPatient.carePlan.filter((task: any) => task.completed).length
    : 0;
  const completionPercentage = currentPatient && Array.isArray(currentPatient.carePlan) && currentPatient.carePlan.length > 0
    ? (completedTasks / currentPatient.carePlan.length) * 100
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Patient Care</h1>
            <p className="text-muted-foreground text-sm md:text-base">Monitor and manage patient care plans</p>
          </div>
        </div>
        <div className="w-full md:w-64">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search patients..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Patients</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredPatients.map((patient, index) => (
                <div
                  key={patient.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${
                    currentPatient?.id === patient.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handlePatientSelect(patient.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{patient.name}</p>
                        <Badge variant={getPriorityColor(patient.priority) as any} className="text-xs">
                          {patient.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{patient.room} • {patient.condition}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentPatient.avatar} />
                  <AvatarFallback>{currentPatient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{currentPatient.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{currentPatient.room}</span>
                    <span>•</span>
                    <span>{currentPatient.condition}</span>
                  </div>
                </div>
              </div>
              <Badge variant={getPriorityColor(currentPatient.priority) as any}>
                {currentPatient.priority} Priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vital Signs */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current Vitals
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className={`text-lg font-bold ${getVitalStatus('heartRate', Number(currentPatient.vitals?.heartRate || 0))}`}>
                    {currentPatient.vitals?.heartRate ?? '-'} bpm
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                  <p className="text-lg font-bold">{currentPatient.vitals?.bloodPressure ?? '-'}</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className={`text-lg font-bold ${getVitalStatus('temperature', Number(currentPatient.vitals?.temperature || 0))}`}>
                    {currentPatient.vitals?.temperature ?? '-'}°F
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">O2 Saturation</p>
                  <p className={`text-lg font-bold ${getVitalStatus('oxygenSaturation', Number(currentPatient.vitals?.oxygenSaturation || 0))}`}>
                    {currentPatient.vitals?.oxygenSaturation ?? '-'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Care Plan Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Today's Care Plan
                </h4>
                <span className="text-sm text-muted-foreground">
                  {completedTasks}/{currentPatient.carePlan.length} completed
                </span>
              </div>
              <div className="mb-4">
                <Progress 
                  value={completionPercentage} 
                  aria-label={`Care plan progress: ${completionPercentage}% complete`}
                  aria-valuenow={completionPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
                <div className="sr-only">
                  {completionPercentage}% of care plan completed
                </div>
              </div>
              <div className="space-y-2">
                {Array.isArray(currentPatient.carePlan) && currentPatient.carePlan.length > 0 ? (
                  currentPatient.carePlan.map((task: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div>
                          <p className="font-medium">{task.task}</p>
                          <p className="text-sm text-muted-foreground">{task.time}</p>
                        </div>
                      </div>
                      {!task.completed && (
                        <Button size="sm" variant="outline">
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No care plan available.</div>
                )}
              </div>
            </div>

            {/* Care Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Care Notes</h4>
                <span className="text-sm text-muted-foreground">
                  {Array.isArray(currentPatient.notes) ? currentPatient.notes.length : 0} notes
                </span>
              </div>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                {Array.isArray(currentPatient.notes) && currentPatient.notes.length > 0 ? (
                  currentPatient.notes.map((note: any, index: number) => (
                    <div key={note._id || index} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">
                          {note.createdBy?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    No notes available.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsAddNoteOpen(true)}
                  disabled={isLoading}
                >
                  Add Note
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsUpdateVitalsOpen(true)}
                  disabled={isLoading}
                >
                  Update Vitals
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setIsEmergencyAlertOpen(true)}
                  disabled={isLoading}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Alert
                </Button>
              </div>
            </div>

            {/* Dialogs */}
            <AddNoteDialog
              open={isAddNoteOpen}
              onOpenChange={setIsAddNoteOpen}
              onSave={handleAddNote}
              isLoading={isLoading}
            />

            <UpdateVitalsDialog
              open={isUpdateVitalsOpen}
              onOpenChange={setIsUpdateVitalsOpen}
              onSave={handleUpdateVitals}
              isLoading={isLoading}
            />

            <EmergencyAlertDialog
              open={isEmergencyAlertOpen}
              onOpenChange={setIsEmergencyAlertOpen}
              onAlert={handleEmergencyAlert}
              isLoading={isLoading}
              patientId={currentPatient?.id}
            />
          </CardContent>
        </Card>

        {/* AI Decision Tree Components */}
        <div className="lg:col-span-3 space-y-6">
          <CarePathRecommendation 
            patientId={currentPatient.id}
            patientName={currentPatient.name}
            refreshTrigger={refreshTrigger}
          />
          
          <DischargeReadiness 
            patientId={currentPatient.id}
            patientName={currentPatient.name}
            refreshTrigger={refreshTrigger}
          />

          <SimilarPatientsComponent 
            patientId={currentPatient.id}
            patientName={currentPatient.name}
          />

          <DoctorRecommendation 
            patientId={currentPatient.id}
            patientName={currentPatient.name}
            patientCondition={currentPatient.condition}
          />
        </div>
      </div>
    </div>
  );
};