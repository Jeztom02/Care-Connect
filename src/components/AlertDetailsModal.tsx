import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, User, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertDetails {
  _id: string;
  title: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  patientId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdByUserId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  acknowledgedAt?: string;
  acknowledgedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AlertDetailsModalProps {
  alert: AlertDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onAlertUpdated: () => void;
}

export const AlertDetailsModal = ({ alert, isOpen, onClose, onAlertUpdated }: AlertDetailsModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle case when alert data is missing or malformed
  if (!alert) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Alert Details
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No alert data available</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleAcknowledge = async (status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    if (!alert) return;

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/alerts/${alert._id}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Alert ${status.toLowerCase()} successfully`,
        });
        onAlertUpdated();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update alert",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Open</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Acknowledged</Badge>;
      case 'RESOLVED':
        return <Badge variant="default" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getSafeValue = (value: any, fallback: string = 'N/A') => {
    return value || fallback;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alert Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{getSafeValue(alert.title, 'Untitled Alert')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(alert.status || 'OPEN')}
                    <span className="text-sm text-muted-foreground">
                      Created {formatDate(alert.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{getSafeValue(alert.message, 'No message provided')}</p>
            </CardContent>
          </Card>

          {/* Alert Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created By:</span>
                  </div>
                  <div className="ml-6">
                    <p className="font-medium">{getSafeValue(alert.createdByUserId?.name, 'Unknown User')}</p>
                    <p className="text-sm text-muted-foreground">{getSafeValue(alert.createdByUserId?.email, 'No email')}</p>
                    <Badge variant="outline" className="mt-1">{getSafeValue(alert.createdByUserId?.role, 'Unknown Role')}</Badge>
                  </div>
                </div>

                {alert.patientId && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Patient:</span>
                    </div>
                    <div className="ml-6">
                      <p className="font-medium">{getSafeValue(alert.patientId?.name, 'Unknown Patient')}</p>
                      <p className="text-sm text-muted-foreground">{getSafeValue(alert.patientId?.email, 'No email')}</p>
                    </div>
                  </div>
                )}
              </div>

              {alert.acknowledgedAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Acknowledged:</span>
                  </div>
                  <div className="ml-6">
                    <p className="text-sm">{formatDate(alert.acknowledgedAt)}</p>
                    {alert.acknowledgedBy && (
                      <p className="text-sm text-muted-foreground">by {getSafeValue(alert.acknowledgedBy?.name, 'Unknown User')}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {alert.status === 'OPEN' && (
            <div className="flex gap-3 justify-end">
              {alert._id === 'mock-alert' ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    This is a demo alert. Action buttons are disabled for mock data.
                  </p>
                  <Button variant="outline" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge (Demo)
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAcknowledge('ACKNOWLEDGED')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Acknowledge
                  </Button>
                  <Button
                    onClick={() => handleAcknowledge('RESOLVED')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Resolve
                  </Button>
                </>
              )}
            </div>
          )}

          {alert.status === 'ACKNOWLEDGED' && alert._id !== 'mock-alert' && (
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => handleAcknowledge('RESOLVED')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Mark as Resolved
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
