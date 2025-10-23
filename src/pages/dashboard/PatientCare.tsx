import { useMemo, useState } from "react";
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
import { patientCareApi } from "@/services/patientCareService";
import { useToast } from "@/components/ui/use-toast";

export const PatientCare = () => {
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isEmergencyAlertOpen, setIsEmergencyAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { data, loading, error, refetch } = usePatients();

  // Normalize data from API. Current backend Patient model exposes: _id, name, status
  // Get all patients and filter based on search query
  const { filteredPatients, currentPatient } = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    
    // Filter patients based on search query
    const filtered = list
      .filter(patient => 
        searchQuery === "" || 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.room && patient.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (patient.condition && patient.condition.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map((p: any) => ({
        id: p._id,
        name: p.name,
        room: p.room || "N/A",
        condition: p.condition || p.status || "Unknown",
        priority: p.priority || "Medium",
        avatar: p.avatar || "/placeholder-avatar.jpg",
        vitals: p.vitals || { heartRate: 0, bloodPressure: "-", temperature: 0, oxygenSaturation: 0 },
        carePlan: Array.isArray(p.carePlan) ? p.carePlan : [],
        notes: p.notes || "",
      }));

    // Ensure selected index is within bounds
    const safeIndex = Math.min(selectedPatientIndex, Math.max(0, filtered.length - 1));
    const current = filtered[safeIndex] || null;
    
    return { filteredPatients: filtered, currentPatient: current };
  }, [data, searchQuery, selectedPatientIndex]);

  // Handle patient selection by ID
  const handlePatientSelect = (patientId: string) => {
    if (!data || !Array.isArray(data)) return;
    const index = data.findIndex(p => p._id === patientId);
    if (index !== -1) {
      setSelectedPatientIndex(index);
    }
  };

  const handleAddNote = async (note: string) => {
    if (!currentPatient) return;
    
    try {
      setIsLoading(true);
      await patientCareApi.addNote(currentPatient.id, note);
      await refetch();
      toast({
        title: "Success",
        description: "Note added successfully",
      });
      setIsAddNoteOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVitals = async (vitals: any) => {
    if (!currentPatient) return;
    
    try {
      setIsLoading(true);
      await patientCareApi.recordVitals(currentPatient.id, vitals);
      await refetch();
      toast({
        title: "Success",
        description: "Vitals updated successfully",
      });
      setIsUpdateVitalsOpen(false);
    } catch (error) {
      console.error("Error updating vitals:", error);
      toast({
        title: "Error",
        description: "Failed to update vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAlert = async (alertData: { priority: string; details: string }) => {
    if (!currentPatient) return;
    
    try {
      setIsLoading(true);
      await patientCareApi.createEmergencyAlert(currentPatient.id, {
        priority: alertData.priority,
        details: alertData.details
      });
      toast({
        title: "Emergency Alert Sent",
        description: "The emergency team has been notified.",
        variant: "default",
      });
      setIsEmergencyAlertOpen(false);
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      toast({
        title: "Error",
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive",
      });
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
          <Button onClick={refetch}>Try Again</Button>
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
              <Progress value={completionPercentage} className="mb-4" />
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
              <h4 className="font-semibold mb-3">Care Notes</h4>
              <div className="p-3 bg-muted rounded-lg min-h-[100px]">
                <p className="text-sm whitespace-pre-wrap">{currentPatient.notes || 'No notes available.'}</p>
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};