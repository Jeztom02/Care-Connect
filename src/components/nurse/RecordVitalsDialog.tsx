import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RecordVitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
  onSave: (vitalsData: any) => void;
  isLoading?: boolean;
}

export function RecordVitalsDialog({ 
  open, 
  onOpenChange, 
  patient, 
  onSave, 
  isLoading = false 
}: RecordVitalsDialogProps) {
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    temperature: "",
    pulse: "",
    oxygenLevel: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...vitals,
      bloodPressure: vitals.bloodPressure,
      temperature: parseFloat(vitals.temperature),
      pulse: parseInt(vitals.pulse, 10),
      oxygenLevel: parseFloat(vitals.oxygenLevel),
      recordedAt: new Date()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Vitals</DialogTitle>
            <DialogDescription>
              Record vital signs for {patient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bloodPressure" className="text-right">
                Blood Pressure
              </Label>
              <Input
                id="bloodPressure"
                placeholder="120/80"
                className="col-span-3"
                value={vitals.bloodPressure}
                onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temperature" className="text-right">
                Temperature (°C)
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="36.5"
                className="col-span-3"
                value={vitals.temperature}
                onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pulse" className="text-right">
                Pulse (BPM)
              </Label>
              <Input
                id="pulse"
                type="number"
                placeholder="72"
                className="col-span-3"
                value={vitals.pulse}
                onChange={(e) => setVitals({...vitals, pulse: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="oxygenLevel" className="text-right">
                SpO₂ (%)
              </Label>
              <Input
                id="oxygenLevel"
                type="number"
                min="0"
                max="100"
                placeholder="98"
                className="col-span-3"
                value={vitals.oxygenLevel}
                onChange={(e) => setVitals({...vitals, oxygenLevel: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Additional notes"
                className="col-span-3"
                value={vitals.notes}
                onChange={(e) => setVitals({...vitals, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Vitals
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
