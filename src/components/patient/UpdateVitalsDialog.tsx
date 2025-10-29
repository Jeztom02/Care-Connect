import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate blood pressure format (e.g., 120/80)
    const bloodPressureRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!vitals.bloodPressure || !bloodPressureRegex.test(vitals.bloodPressure)) {
      newErrors.bloodPressure = 'Please enter blood pressure in the format "120/80"';
    }
    
    // Validate heart rate (30-250 bpm)
    if (vitals.heartRate < 30 || vitals.heartRate > 250) {
      newErrors.heartRate = 'Heart rate must be between 30 and 250 bpm';
    }
    
    // Validate temperature (30-45°C)
    if (vitals.temperature < 30 || vitals.temperature > 45) {
      newErrors.temperature = 'Temperature must be between 30°C and 45°C';
    }
    
    // Validate oxygen saturation (0-100%)
    if (vitals.oxygenSaturation < 0 || vitals.oxygenSaturation > 100) {
      newErrors.oxygenSaturation = 'Oxygen saturation must be between 0% and 100%';
    }
    
    // Validate respiratory rate (0-60 breaths/min)
    if (vitals.respiratoryRate < 0 || vitals.respiratoryRate > 60) {
      newErrors.respiratoryRate = 'Respiratory rate must be between 0 and 60 breaths per minute';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show the first error in a toast
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive",
        });
      }
      return;
    }
    
    try {
      await onSave(vitals);
      // Reset form on successful save
      setVitals({
        bloodPressure: '',
        heartRate: 0,
        temperature: 0,
        oxygenSaturation: 0,
        respiratoryRate: 0,
        notes: ''
      });
      setErrors({});
      onOpenChange(false); // Close the dialog on success
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast({
        title: "Error",
        description: "Failed to save vitals. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof typeof vitals, value: string | number) => {
    // Clear any existing error for this field when it changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
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
                <div className="relative">
                  <Input
                    id="bloodPressure"
                    placeholder="120/80"
                    value={vitals.bloodPressure}
                    onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                    className={errors.bloodPressure ? 'border-red-500' : ''}
                    required
                  />
                  {errors.bloodPressure && (
                    <p className="text-xs text-red-500 mt-1">{errors.bloodPressure}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <div className="relative">
                  <Input
                    id="heartRate"
                    type="number"
                    min="30"
                    max="250"
                    value={vitals.heartRate || ''}
                    onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value) || 0)}
                    className={errors.heartRate ? 'border-red-500' : ''}
                    required
                  />
                  {errors.heartRate && (
                    <p className="text-xs text-red-500 mt-1">{errors.heartRate}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <div className="relative">
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    value={vitals.temperature || ''}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                    className={errors.temperature ? 'border-red-500' : ''}
                    required
                  />
                  {errors.temperature && (
                    <p className="text-xs text-red-500 mt-1">{errors.temperature}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">SpO₂ (%)</Label>
                <div className="relative">
                  <Input
                    id="oxygenSaturation"
                    type="number"
                    min="0"
                    max="100"
                    value={vitals.oxygenSaturation || ''}
                    onChange={(e) => handleInputChange('oxygenSaturation', parseInt(e.target.value) || 0)}
                    className={errors.oxygenSaturation ? 'border-red-500' : ''}
                    required
                  />
                  {errors.oxygenSaturation && (
                    <p className="text-xs text-red-500 mt-1">{errors.oxygenSaturation}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
              <div className="relative">
                <Input
                  id="respiratoryRate"
                  type="number"
                  min="0"
                  max="60"
                  value={vitals.respiratoryRate || ''}
                  onChange={(e) => handleInputChange('respiratoryRate', parseInt(e.target.value) || 0)}
                  className={errors.respiratoryRate ? 'border-red-500' : ''}
                  required
                />
                {errors.respiratoryRate && (
                  <p className="text-xs text-red-500 mt-1">{errors.respiratoryRate}</p>
                )}
              </div>
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
