import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Plus, Loader2, RefreshCw, CheckCircle, AlertCircle, Calendar, User } from "lucide-react";
import { useCareUpdates } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

export const CareUpdates = () => {
  const { data: careUpdates, loading, error, refetch } = useCareUpdates();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Updates Refreshed",
        description: "Care updates have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh care updates.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Mock data for demonstration when API is not available
  const mockCareUpdates = [
    {
      _id: "1",
      patientId: { name: "John Smith", status: "Active" },
      type: "Medication",
      title: "Morning Medication Administered",
      description: "Patient received morning dose of prescribed medication. No adverse reactions observed.",
      status: "Completed",
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdBy: { name: "Nurse Emily Chen", role: "nurse" },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "2",
      patientId: { name: "John Smith", status: "Active" },
      type: "Treatment",
      title: "Physical Therapy Session",
      description: "Completed 30-minute physical therapy session focusing on mobility exercises. Patient showed good progress.",
      status: "Completed",
      scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      createdBy: { name: "Dr. Mike Wilson", role: "doctor" },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "3",
      patientId: { name: "John Smith", status: "Active" },
      type: "Observation",
      title: "Vital Signs Check",
      description: "Routine vital signs check completed. All readings within normal range.",
      status: "Completed",
      scheduledAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      createdBy: { name: "Nurse Sarah Johnson", role: "nurse" },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  const displayUpdates = careUpdates && careUpdates.length > 0 ? careUpdates : mockCareUpdates;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Medication": return "💊";
      case "Treatment": return "🏥";
      case "Therapy": return "🏃";
      case "Observation": return "👁️";
      case "Procedure": return "⚕️";
      default: return "📋";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Scheduled": return "bg-yellow-100 text-yellow-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle className="h-4 w-4" />;
      case "In Progress": return <Clock className="h-4 w-4" />;
      case "Scheduled": return <Calendar className="h-4 w-4" />;
      case "Cancelled": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading care updates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load care updates</h2>
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
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Care Updates</h1>
            <p className="text-muted-foreground">Latest updates on patient care</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUpdates.filter(u => u.status === 'Completed').length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUpdates.filter(u => u.status === 'In Progress').length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUpdates.filter(u => u.status === 'Scheduled').length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayUpdates.length}</p>
                <p className="text-sm text-muted-foreground">Total Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Care Updates List */}
      <div className="grid gap-4">
        {displayUpdates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No care updates available</h3>
              <p className="text-muted-foreground mb-4">Care updates will appear here as they are added by the medical team.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Update
              </Button>
            </CardContent>
          </Card>
        ) : (
          displayUpdates.map((update) => (
            <Card key={update._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 text-2xl">
                    {getTypeIcon(update.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{update.title}</h3>
                      <Badge className={`${getStatusColor(update.status)} flex items-center gap-1`}>
                        {getStatusIcon(update.status)}
                        {update.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{update.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{update.createdBy?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(update.createdAt)}</span>
                      </div>
                      {update.scheduledAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Scheduled: {new Date(update.scheduledAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {update.completedAt && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed: {new Date(update.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};