import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface VitalsData {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  notes?: string;
}

interface UpdateVitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vitals: VitalsData) => Promise<void>;
  isLoading?: boolean;
}

export function UpdateVitalsDialog({ open, onOpenChange, onSave, isLoading = false }: UpdateVitalsDialogProps) {
  const [vitals, setVitals] = useState<Omit<VitalsData, 'bloodPressureSystolic' | 'bloodPressureDiastolic'>>({
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(vitals);
  };

  const handleInputChange = (field: keyof typeof vitals, value: string | number) => {
    setVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Patient Vitals</DialogTitle>
            <DialogDescription>
              Record the patient's current vital signs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure (mmHg)</Label>
                <Input
                  id="bloodPressure"
                  placeholder="120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  min="0"
                  value={vitals.heartRate || ''}
                  onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  value={vitals.temperature || ''}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">SpO₂ (%)</Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  min="0"
                  max="100"
                  value={vitals.oxygenSaturation || ''}
                  onChange={(e) => handleInputChange('oxygenSaturation', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
              <Input
                id="respiratoryRate"
                type="number"
                min="0"
                value={vitals.respiratoryRate || ''}
                onChange={(e) => handleInputChange('respiratoryRate', parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={vitals.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the patient's condition"
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
              Save Vitals
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
