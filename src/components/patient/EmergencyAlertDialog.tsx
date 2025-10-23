import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmergencyAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlert: (details: { priority: 'high' | 'medium' | 'low', details: string }) => Promise<void>;
  isLoading?: boolean;
}

export function EmergencyAlertDialog({ open, onOpenChange, onAlert, isLoading = false }: EmergencyAlertDialogProps) {
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [details, setDetails] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setIsConfirmed(true);
      return;
    }
    await onAlert({ priority, details });
    setDetails('');
    setIsConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isConfirmed ? 'Confirm Emergency Alert' : 'Trigger Emergency Alert'}
            </DialogTitle>
            <DialogDescription>
              {isConfirmed 
                ? 'Please confirm this emergency alert. This will notify the medical team immediately.'
                : 'Use this only for urgent medical situations requiring immediate attention.'}
            </DialogDescription>
          </DialogHeader>
          
          {!isConfirmed ? (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This will notify the emergency response team. Only use for genuine emergencies.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={priority === 'high' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('high')}
                  >
                    High
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'medium' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('medium')}
                  >
                    Medium
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'low' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('low')}
                  >
                    Low
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Emergency Details</Label>
                <Textarea
                  id="details"
                  placeholder="Describe the emergency situation..."
                  className="min-h-[100px]"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Emergency Alert - {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</AlertTitle>
                <AlertDescription className="mt-2">
                  {details}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to send this emergency alert? The medical team will be notified immediately.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (isConfirmed) {
                  setIsConfirmed(false);
                } else {
                  onOpenChange(false);
                }
              }}
              disabled={isLoading}
            >
              {isConfirmed ? 'Back' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isConfirmed ? (
                'Confirm Emergency Alert'
              ) : (
                'Trigger Alert'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
