import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Heart, MapPin, Activity, Thermometer, Droplets, Weight, Clock, Loader2, RefreshCw } from "lucide-react";
import { usePatientStatus } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

export const PatientStatus = () => {
  const { data: patientStatuses, loading, error, refetch } = usePatientStatus();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Status Updated",
        description: "Patient status has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh patient status.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Mock data for demonstration when API is not available
  const mockPatientStatus = {
    _id: "1",
    patientId: { name: "John Smith", status: "Active" },
    vitals: {
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
      temperature: 98.6,
      oxygenSaturation: 98,
      weight: 175,
      height: 70
    },
    condition: "Stable",
    notes: "Patient is responding well to treatment. Vitals are within normal range.",
    recordedBy: { name: "Dr. Sarah Johnson", role: "doctor" },
    createdAt: new Date().toISOString()
  };

  const displayStatus = patientStatuses && patientStatuses.length > 0 ? patientStatuses[0] : mockPatientStatus;

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Critical": return "bg-red-100 text-red-700";
      case "Serious": return "bg-orange-100 text-orange-700";
      case "Stable": return "bg-green-100 text-green-700";
      case "Good": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getVitalStatus = (value: number, normalRange: { min: number; max: number }) => {
    if (value < normalRange.min || value > normalRange.max) {
      return { status: "abnormal", color: "text-red-600" };
    }
    return { status: "normal", color: "text-green-600" };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patient status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load patient status</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Patient Status</h1>
            <p className="text-muted-foreground">Monitor your loved one's condition</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Patient Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{displayStatus.patientId?.name || "John Smith"}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Room A-204</span>
              </div>
              <Badge className={`mt-2 ${getConditionColor(displayStatus.condition)}`}>
                {displayStatus.condition} Condition
              </Badge>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Last updated:</p>
              <p>{new Date(displayStatus.createdAt).toLocaleString()}</p>
              <p className="text-xs">by {displayStatus.recordedBy?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blood Pressure */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Blood Pressure</span>
              </div>
              <p className="text-2xl font-bold">
                {displayStatus.vitals?.bloodPressure?.systolic || 120}/
                {displayStatus.vitals?.bloodPressure?.diastolic || 80}
              </p>
              <p className="text-sm text-muted-foreground">mmHg</p>
            </div>

            {/* Heart Rate */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="font-medium">Heart Rate</span>
              </div>
              <p className="text-2xl font-bold">{displayStatus.vitals?.heartRate || 72}</p>
              <p className="text-sm text-muted-foreground">BPM</p>
            </div>

            {/* Temperature */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Temperature</span>
              </div>
              <p className="text-2xl font-bold">{displayStatus.vitals?.temperature || 98.6}°F</p>
              <p className="text-sm text-muted-foreground">Fahrenheit</p>
            </div>

            {/* Oxygen Saturation */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium">Oxygen Saturation</span>
              </div>
              <p className="text-2xl font-bold">{displayStatus.vitals?.oxygenSaturation || 98}%</p>
              <p className="text-sm text-muted-foreground">SpO2</p>
            </div>

            {/* Weight */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Weight className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Weight</span>
              </div>
              <p className="text-2xl font-bold">{displayStatus.vitals?.weight || 175} lbs</p>
              <p className="text-sm text-muted-foreground">Pounds</p>
            </div>

            {/* Height */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Height</span>
              </div>
              <p className="text-2xl font-bold">{displayStatus.vitals?.height || 70}"</p>
              <p className="text-sm text-muted-foreground">Inches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {displayStatus.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Latest Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{displayStatus.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Status Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patientStatuses && patientStatuses.length > 0 ? (
              patientStatuses.slice(0, 5).map((status, index) => (
                <div key={status._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getConditionColor(status.condition)}`}>
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{status.condition} Condition</p>
                      <p className="text-sm text-muted-foreground">
                        Recorded by {status.recordedBy?.name} • {new Date(status.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{status.condition}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No status history available</h3>
                <p className="text-muted-foreground">Patient status updates will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};