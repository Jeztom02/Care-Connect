import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Bell, CheckCircle, Clock, AlertCircle, Pill, User, Pencil, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import patientService from '@/services/patientService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns/format';
import medicationService, { Medication } from '@/services/medicationService';

export const MedicationDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    patientId: '',
    name: '',
    dosage: '',
    frequency: '',
    status: 'pending',
  });

  // Fetch medications
  const { 
    data: medications = [], 
    isLoading, 
    error: medicationsError 
  } = useQuery({
    queryKey: ['medications'],
    queryFn: () => medicationService.getMedications(),
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getPatients(),
  });

  // Filter medications based on search query
  const displayMedications = medications.filter(med => 
    med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add/Update medication mutation
  const addMedicationMutation = useMutation({
    mutationFn: (medication: Partial<Medication>) => 
      medication._id 
        ? medicationService.updateMedication(medication._id, medication)
        : medicationService.addMedication(medication),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setNewMedication({
        patientId: '',
        name: '',
        dosage: '',
        frequency: '',
        status: 'pending',
      });
      setIsAddDialogOpen(false);
      toast({
        title: 'Success',
        description: `Medication ${newMedication._id ? 'updated' : 'added'} successfully`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save medication',
        variant: 'destructive',
      });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: (id: string) => medicationService.deleteMedication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Success',
        description: 'Medication deleted successfully',
        variant: 'default',
      });
    },
  });

  // Toggle reminder mutation
  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, reminderTime }: { id: string; reminderTime: string }) => 
      medicationService.toggleReminder(id, reminderTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (medicationsError) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load medications. Please try again.</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['medications'] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Medication Dashboard</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Medication
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication List</CardTitle>
          <CardDescription>
            View and manage all medications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medications..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Dose</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMedications.map((medication) => (
                  <TableRow key={medication._id}>
                    <TableCell className="font-medium">
                      {medication.patientName || 'Unknown Patient'}
                    </TableCell>
                    <TableCell>{medication.name}</TableCell>
                    <TableCell>{medication.dosage}</TableCell>
                    <TableCell>{medication.frequency}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          medication.status === 'taken'
                            ? 'default'
                            : medication.status === 'pending'
                            ? 'outline'
                            : 'secondary'
                        }
                        className={medication.status === 'missed' ? 'bg-destructive/10 text-destructive' : ''}
                      >
                        {medication.status === 'taken' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {medication.status === 'missed' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {medication.status?.charAt(0).toUpperCase() + medication.status?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {medication.nextDose ? format(new Date(medication.nextDose), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewMedication(medication);
                            setIsAddDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this medication?')) {
                              deleteMedicationMutation.mutate(medication._id!);
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          variant={medication.isReminderSet ? 'outline' : 'ghost'}
                          size="sm"
                          onClick={() =>
                            toggleReminderMutation.mutate({
                              id: medication._id!,
                              reminderTime: medication.reminderTime || '09:00',
                            })
                          }
                          disabled={toggleReminderMutation.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Bell className="h-4 w-4" />
                          <span className="sr-only">
                            {medication.isReminderSet ? 'Disable' : 'Enable'} reminder
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Medication Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newMedication._id ? 'Edit' : 'Add'} Medication</DialogTitle>
            <DialogDescription>
              {newMedication._id ? 'Update the medication details' : 'Add a new medication to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">
                Patient
              </Label>
              <Select
                value={newMedication.patientId as string}
                onValueChange={(value) => {
                  const selectedPatient = patients.find(p => p._id === value);
                  setNewMedication(prev => ({
                    ...prev,
                    patientId: value,
                    patientName: selectedPatient?.name || '',
                  }));
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Medication Name
              </Label>
              <Input
                id="name"
                value={newMedication.name}
                onChange={(e) =>
                  setNewMedication({ ...newMedication, name: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., Ibuprofen"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dosage" className="text-right">
                Dosage
              </Label>
              <Input
                id="dosage"
                value={newMedication.dosage}
                onChange={(e) =>
                  setNewMedication({ ...newMedication, dosage: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., 200mg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Input
                id="frequency"
                value={newMedication.frequency}
                onChange={(e) =>
                  setNewMedication({ ...newMedication, frequency: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., 3 times a day"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewMedication({
                  patientId: '',
                  name: '',
                  dosage: '',
                  frequency: '',
                  status: 'pending',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => addMedicationMutation.mutate(newMedication)}
              disabled={addMedicationMutation.isPending}
            >
              {addMedicationMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationDashboard;
