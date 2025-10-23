import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, User, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/useApi";

interface AlertsProps {
  userRole: string;
}

export const Alerts = ({ userRole }: AlertsProps) => {
  const { data, loading, error, refetch } = useAlerts();
  const alerts = Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading alerts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load alerts</h2>
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
          <AlertTriangle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Critical notifications and warnings</p>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert: any) => (
          <Card key={alert._id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{alert.status || 'OPEN'}</Badge>
                      {alert.patientId?.name && (
                        <span className="font-semibold">{alert.patientId.name}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Acknowledge</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No alerts at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};