import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pill, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import nurseService from "@/services/nurseService";

interface RecordMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
  onSave: (medicationData: any) => void;
  isLoading?: boolean;
}

export function RecordMedicationDialog({ 
  open, 
  onOpenChange, 
  patient, 
  onSave, 
  isLoading = false 
}: RecordMedicationDialogProps) {
  const [medication, setMedication] = useState({
    prescriptionId: "",
    medication: "",
    dosage: "",
    time: new Date(),
    notes: ""
  });

  // Fetch patient's active medications
  const { data: medications = [], isLoading: isLoadingMedications } = useQuery({
    queryKey: ['patientMedications', patient?._id],
    queryFn: () => nurseService.getPatientMedications(patient?._id || ''),
    enabled: !!patient?._id && open,
  });

  useEffect(() => {
    if (medications.length > 0 && !medication.prescriptionId) {
      setMedication(prev => ({
        ...prev,
        prescriptionId: medications[0]._id,
        medication: medications[0].medication,
        dosage: medications[0].dosage
      }));
    }
  }, [medications]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...medication,
      time: new Date()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Administer Medication</DialogTitle>
            <DialogDescription>
              Record medication administration for {patient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingMedications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : medications.length === 0 ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No active medications</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This patient doesn't have any active prescriptions.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Medication</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={medication.prescriptionId}
                    onChange={(e) => {
                      const selected = medications.find((m: any) => m._id === e.target.value);
                      if (selected) {
                        setMedication({
                          ...medication,
                          prescriptionId: selected._id,
                          medication: selected.medication,
                          dosage: selected.dosage
                        });
                      }
                    }}
                  >
                    {medications.map((med: any) => (
                      <option key={med._id} value={med._id}>
                        {med.medication} - {med.dosage}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="medication" className="text-right">
                    Medication
                  </Label>
                  <Input
                    id="medication"
                    className="col-span-3"
                    value={medication.medication}
                    onChange={(e) => setMedication({...medication, medication: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dosage" className="text-right">
                    Dosage
                  </Label>
                  <Input
                    id="dosage"
                    className="col-span-3"
                    value={medication.dosage}
                    onChange={(e) => setMedication({...medication, dosage: e.target.value})}
                    required
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="datetime-local"
                className="col-span-3"
                value={medication.time.toISOString().slice(0, 16)}
                onChange={(e) => setMedication({...medication, time: new Date(e.target.value)})}
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
                value={medication.notes}
                onChange={(e) => setMedication({...medication, notes: e.target.value})}
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
            <Button 
              type="submit" 
              disabled={isLoading || medications.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Administration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
