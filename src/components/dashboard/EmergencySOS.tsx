import { useState } from "react";
import { AlertTriangle, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export const EmergencySOS = () => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleEmergencyActivation = () => {
    if (!isEmergencyActive) {
      setIsEmergencyActive(true);
      setEmergencyStartTime(new Date());
      
      toast({
        title: "🚨 Emergency Alert Activated",
        description: "Emergency services have been notified. Help is on the way.",
        variant: "destructive",
      });

      // Simulate emergency response
      setTimeout(() => {
        toast({
          title: "📞 Emergency Response",
          description: "Emergency team contacted. ETA: 8-12 minutes.",
        });
      }, 2000);
    } else {
      setIsEmergencyActive(false);
      setEmergencyStartTime(null);
      
      toast({
        title: "Emergency Deactivated",
        description: "Emergency alert has been cancelled.",
      });
    }
  };

  const getElapsedTime = () => {
    if (!emergencyStartTime) return "00:00";
    const elapsed = Math.floor((Date.now() - emergencyStartTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Emergency SOS Button - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleEmergencyActivation}
          className={`
            relative overflow-hidden transition-all duration-300 shadow-lg
            ${isEmergencyActive 
              ? "bg-destructive hover:bg-destructive/90 animate-pulse shadow-destructive/50" 
              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30"
            }
          `}
          size="lg"
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          {isEmergencyActive ? "EMERGENCY ACTIVE" : "SOS"}
        </Button>
      </div>

      {/* Emergency Status Panel */}
      {isEmergencyActive && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-8 w-8 animate-pulse" />
                <div>
                  <h3 className="text-xl font-bold">EMERGENCY ACTIVE</h3>
                  <p className="text-sm text-muted-foreground">Help is on the way</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <Badge variant="destructive" className="text-lg font-mono">
                    {getElapsedTime()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    GPS coordinates sent
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Emergency Contacts Notified
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Emergency Services</span>
                    <Badge variant="secondary">Contacted</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Doctor</span>
                    <Badge variant="secondary">Contacted</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency Contact</span>
                    <Badge variant="secondary">Contacted</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleEmergencyActivation}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel Emergency
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    toast({
                      title: "Additional Help Requested",
                      description: "Backup emergency team dispatched.",
                    });
                  }}
                >
                  Request More Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};