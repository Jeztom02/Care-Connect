import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, MessageSquare, Clock, User, MapPin, Loader2, RefreshCw } from "lucide-react";
import { useAlerts } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

export const Emergency = () => {
  const { data: alerts, loading, error, refetch } = useAlerts();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyCalling, setEmergencyCalling] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Alerts Refreshed",
        description: "Emergency alerts have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh emergency alerts.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmergencyCall = async () => {
    setEmergencyCalling(true);
    try {
      // Simulate emergency call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Emergency Services Contacted",
        description: "Emergency services have been notified. Help is on the way.",
      });
    } catch (error) {
      toast({
        title: "Call Failed",
        description: "Failed to contact emergency services. Please try again or call 911 directly.",
        variant: "destructive",
      });
    } finally {
      setEmergencyCalling(false);
    }
  };

  // Mock emergency contacts and alerts
  const emergencyContacts = [
    { name: "Emergency Services", number: "911", type: "Emergency", priority: "Critical" },
    { name: "Hospital Main Line", number: "(555) 123-4567", type: "Hospital", priority: "High" },
    { name: "Nurse Station", number: "(555) 123-4568", type: "Nursing", priority: "High" },
    { name: "Doctor On-Call", number: "(555) 123-4569", type: "Medical", priority: "Medium" }
  ];

  const mockAlerts = [
    {
      _id: "1",
      title: "System Maintenance Alert",
      message: "Scheduled system maintenance will occur tonight from 2-4 AM. Some features may be temporarily unavailable.",
      status: "OPEN",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdByUserId: { name: "System Admin", role: "admin" }
    },
    {
      _id: "2",
      title: "Weather Advisory",
      message: "Severe weather warning in effect. Please ensure all outdoor activities are postponed.",
      status: "ACKNOWLEDGED",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      createdByUserId: { name: "Safety Officer", role: "admin" }
    }
  ];

  const displayAlerts = alerts && alerts.length > 0 ? alerts : mockAlerts;

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-red-100 text-red-700";
      case "ACKNOWLEDGED": return "bg-yellow-100 text-yellow-700";
      case "RESOLVED": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High": return "bg-orange-100 text-orange-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
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
          <span>Loading emergency information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load emergency information</h2>
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
          <div className="p-2 rounded-xl bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emergency</h1>
            <p className="text-muted-foreground">Emergency contacts and procedures</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Emergency Call Button */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="p-4 rounded-full bg-red-100 w-fit mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-800">Emergency Services</h3>
            <p className="text-red-700">For immediate medical emergencies</p>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              size="lg"
              onClick={handleEmergencyCall}
              disabled={emergencyCalling}
            >
              {emergencyCalling ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  Call 911
                </>
              )}
            </Button>
            <p className="text-sm text-red-600">Call 911 for life-threatening emergencies</p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{contact.name}</h4>
                  <Badge className={getPriorityColor(contact.priority)}>
                    {contact.priority}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary mb-2">{contact.number}</p>
                <p className="text-sm text-muted-foreground">{contact.type}</p>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold">Care Connect Medical Center</h4>
                <p className="text-muted-foreground">123 Medical Drive, Healthcare City, HC 12345</p>
                <p className="text-sm text-muted-foreground">Room A-204, Floor 2</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active alerts</h3>
                <p className="text-muted-foreground">All systems are operating normally.</p>
              </div>
            ) : (
              displayAlerts.map((alert) => (
                <div key={alert._id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{alert.title}</h4>
                    <Badge className={getAlertStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{alert.message}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{alert.createdByUserId?.name || "System"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeAgo(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Procedures */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Procedures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold mb-2">Medical Emergency</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Call 911 immediately for life-threatening situations</li>
                <li>Stay with the patient and provide comfort</li>
                <li>Do not move the patient unless absolutely necessary</li>
                <li>Follow any specific medical instructions if available</li>
              </ol>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold mb-2">Fire Emergency</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Pull the nearest fire alarm</li>
                <li>Evacuate the building using the nearest exit</li>
                <li>Do not use elevators during a fire</li>
                <li>Meet at the designated assembly point</li>
              </ol>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold mb-2">Security Emergency</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Call security at extension 911</li>
                <li>Report the incident to the nearest staff member</li>
                <li>Follow security personnel instructions</li>
                <li>Do not attempt to handle the situation yourself</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};