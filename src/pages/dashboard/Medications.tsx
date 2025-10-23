import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, CheckCircle, AlertTriangle, Plus, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useMedications } from "@/hooks/useApi";

interface MedicationsProps {
  userRole: string;
}

export const Medications = ({ userRole }: MedicationsProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { data, loading, error, refetch } = useMedications();
  const medications = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((m: any) => ({
      id: m._id,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      time: m.time || undefined,
      nextDue: m.nextDue || undefined,
      taken: m.status ? (m.status.toLowerCase() === 'completed') : null,
      patient: m.patientId?.name,
      instructions: m.instructions,
      sideEffects: m.sideEffects || [],
      condition: m.condition || undefined,
      status: m.status || 'Active',
    }));
  }, [data]);

  const getMedicationStatus = (taken: boolean | null) => {
    if (taken === null) return "As needed";
    return taken ? "Taken" : "Pending";
  };

  const getStatusColor = (taken: boolean | null) => {
    if (taken === null) return "bg-blue-100 text-blue-700";
    return taken ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
  };

  const getStatusIcon = (taken: boolean | null) => {
    if (taken === null) return Clock;
    return taken ? CheckCircle : AlertTriangle;
  };

  const todaysTaken = medications.filter(med => med.taken === true).length;
  const todaysPending = medications.filter(med => med.taken === false).length;
  const asNeeded = medications.filter(med => med.taken === null).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading medications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load medications</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Pill className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medications</h1>
          <p className="text-muted-foreground">
            {userRole === 'patient' ? 'Track your daily medications' : 'Monitor patient medication adherence'}
          </p>
        </div>
      </div>

      {/* Medication Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{todaysTaken}</p>
                <p className="text-sm text-muted-foreground">Taken Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{todaysPending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{asNeeded}</p>
                <p className="text-sm text-muted-foreground">As Needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-sm text-muted-foreground">Reminders Set</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medication Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-semibold">Medication Reminders</h3>
              <p className="text-sm text-muted-foreground">Get notified when it's time to take your medications</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled}
              />
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications List */}
      <div className="grid gap-4">
        {medications.map((medication) => {
          const StatusIcon = getStatusIcon(medication.taken);
          return (
            <Card key={medication.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Pill className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{medication.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{medication.dosage}</span>
                        <span>•</span>
                        <span>{medication.frequency}</span>
                        {medication.condition && (
                          <>
                            <span>•</span>
                            <span>for {medication.condition}</span>
                          </>
                        )}
                      </div>
                      {userRole !== 'patient' && (
                        <p className="text-sm text-muted-foreground">Patient: {medication.patient || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(medication.taken)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {getMedicationStatus(medication.taken)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                    <p className="font-semibold">{medication.time || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Due</p>
                    <p className="font-semibold">{medication.nextDue || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                    <p className="font-semibold">{medication.instructions || '—'}</p>
                  </div>
                </div>

                {Array.isArray(medication.sideEffects) && medication.sideEffects.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Possible Side Effects:</p>
                    <p className="text-sm">{medication.sideEffects.join(", ")}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {medication.taken === false && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Taken
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Set Reminder
                  </Button>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  {userRole === 'doctor' && (
                    <Button size="sm" variant="outline">
                      Adjust Dosage
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};