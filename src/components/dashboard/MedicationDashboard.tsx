import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedicationSocket } from '@/hooks/useMedicationSocket';
import { useToast } from '../ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Bell, CheckCircle, Clock, AlertCircle, Pill, User, Pencil, Trash2 } from 'lucide-react';
import authService from '@/services/authService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import patientService from '@/services/patientService';
import medicationService, { Medication, MedicationStats } from '@/services/medicationService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns/format';

interface MedicationDashboardProps {
  patientId?: string;
}

const MedicationDashboard = ({ patientId }: MedicationDashboardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug: Log user role and permissions
  useEffect(() => {
    const user = authService.getUser();
    console.log('[MedicationDashboard] Current user:', user);
    console.log('[MedicationDashboard] Has admin role:', authService.hasRole('admin'));
    console.log('[MedicationDashboard] Has doctor role:', authService.hasRole('doctor'));
    console.log('[MedicationDashboard] Has nurse role:', authService.hasRole('nurse'));
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize WebSocket connection for real-time updates
  const { connected: isSocketConnected } = useMedicationSocket(patientId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<Medication>>(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    return {
      patientId: '',
      patientName: '',
      name: '',
      medication: '',
      dosage: '',
      frequency: '',
      startDate: formattedDate,
      endDate: '',
      status: 'pending' as const,
      isReminderSet: false,
      notes: ''
    };
  });

  // Get current user role
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getUser(),
  });

  // Fetch patients data based on user role
  const { 
    data: patients = [],
    isLoading: isLoadingPatients,
    error: patientsError,
    refetch: refetchPatients
  } = useQuery({
    queryKey: ['patients', user?.role, user?.id],
    queryFn: async () => {
      try {
        const userRole = user?.role?.toUpperCase();
        
        // For patients, use the getCurrentPatient endpoint which is specifically designed for patients
        if (userRole === 'PATIENT') {
          try {
            const patient = await patientService.getCurrentPatient();
            return [{
              id: patient._id,
              name: `${patient.firstName} ${patient.lastName}`.trim() || `Patient ${patient._id.slice(-4)}`,
              ...patient
            }];
          } catch (error) {
            // If getCurrentPatient fails, try with user ID if available
            if (user?.id) {
              const patient = await patientService.getPatientById(user.id);
              return [{
                id: patient._id,
                name: `${patient.firstName} ${patient.lastName}`.trim() || `Patient ${patient._id.slice(-4)}`,
                ...patient
              }];
            }
            throw error;
          }
        }
        
        // For staff with appropriate permissions, fetch all patients
        if (['ADMIN', 'DOCTOR', 'NURSE', 'VOLUNTEER'].includes(userRole || '')) {
          const data = await patientService.getPatients();
          return data.map(patient => ({
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName}`.trim() || `Patient ${patient._id.slice(-4)}`,
            ...patient
          }));
        }
        
        // No access
        return [];
      } catch (error) {
        console.error('Error fetching patients:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load patient data';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!user?.role, // Only run the query when we have the user's role
  });

  const fetchMedications = async (patientId?: string) => {
    if (!patientId) return [];
    try {
      return await medicationService.getPatientMedications(patientId);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load medications. Please try again later.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Determine the patient ID to use based on user role
  const targetPatientId = useMemo(() => {
    // If we have a patientId prop, use that (for staff viewing a specific patient)
    if (patientId) return patientId;
    
    // If user is a patient, use their own ID
    if (user?.role?.toUpperCase() === 'PATIENT' && user?.id) {
      return user.id;
    }
    
    // For staff, use the first patient in the list if available
    // But only if patients array is not empty
    if (Array.isArray(patients) && patients.length > 0) {
      return patients[0]?._id || '';
    }
    
    return ''; // Return empty string if no patient ID can be determined
  }, [patientId, user, patients]);

  const { 
    data: medications = [], 
    isLoading: isLoadingMedications,
    error: medicationsError
  } = useQuery({
    queryKey: ['medications', targetPatientId],
    queryFn: () => fetchMedications(targetPatientId),
    enabled: !!targetPatientId, // Only fetch if we have a valid patient ID
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Log any medication fetching errors
  useEffect(() => {
    if (medicationsError) {
      console.error('Medication fetch error:', medicationsError);
    }
  }, [medicationsError]);

  const { data: stats } = useQuery<MedicationStats>({
    queryKey: ['medicationStats'],
    queryFn: medicationService.getMedicationStats,
  });

  const { 
    data: searchResults,
    isFetching: isSearching 
  } = useQuery<Medication[]>({
    queryKey: ['medicationSearch', searchQuery],
    queryFn: () => medicationService.searchMedications(searchQuery),
    enabled: searchQuery.length > 0,
  });
  
  const isLoading = isLoadingPatients || isLoadingMedications || isSearching;
  const displayMedications = searchQuery ? (searchResults || []) : medications;

  // Add new medication
  const addMedicationMutation = useMutation({
    mutationFn: medicationService.addMedication,
    onSuccess: () => {
      // Invalidate and refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: ['medicationStats'] }),
        queryClient.invalidateQueries({ queryKey: ['patients'] })
      ]).then(() => {
        toast({
          title: 'Success',
          description: 'Medication added successfully',
          variant: 'default',
        });
        resetForm();
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add medication',
        variant: 'destructive',
      });
    },
  });

  // Update medication status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Medication['status'] }) =>
      medicationService.updateMedicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', 'medicationStats'] });
    },
  });

  // Update medication
  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Medication>) =>
      medicationService.updateMedication(id, data),
    onSuccess: () => {
      // Invalidate and refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: ['medicationStats'] })
      ]).then(() => {
        toast({
          title: 'Success',
          description: 'Medication updated successfully',
          variant: 'default',
        });
        resetForm();
        setIsAddDialogOpen(false);
      });
    },
    onError: (error: any) => {
      console.error('Update medication error:', error);
      
      let errorMessage = 'Failed to update medication';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Medication not found. The list has been refreshed.';
          queryClient.invalidateQueries({ queryKey: ['medications'] });
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this medication';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Toggle reminder
  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, reminderTime }: { id: string; reminderTime: string }) => {
      try {
        // First get the current medication by fetching all medications and finding the one with the matching ID
        const medications = await medicationService.getMedications();
        const currentMedication = medications.find(med => med._id === id);
        
        if (!currentMedication) {
          throw new Error('Medication not found');
        }
        
        // Toggle the reminder status using the updateMedication method
        const updatedMedication = await medicationService.updateMedication(id, {
          ...currentMedication,
          isReminderSet: !currentMedication.isReminderSet,
          reminderTime: reminderTime || currentMedication.reminderTime || '09:00'
        });
        
        return updatedMedication;
      } catch (error: any) {
        console.error('Error in toggleMedicationReminder:', error);
        
        // If it's a 404, the medication might have been deleted
        if (error.response?.status === 404) {
          // Invalidate the medications query to refresh the list
          await queryClient.invalidateQueries({ queryKey: ['medications'] });
          throw new Error('Medication not found. The list has been refreshed.');
        }
        
        // If it's a permission error
        if (error.response?.status === 403) {
          throw new Error('You do not have permission to update this medication reminder');
        }
        
        // For other errors, include the server message if available
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update reminder';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: ['medicationStats'] })
      ]).then(() => {
        toast({
          title: 'Success',
          description: 'Reminder settings updated successfully',
          variant: 'default',
        });
      });
    },
    onError: (error: any) => {
      console.error('Error toggling reminder:', error);
      
      let errorMessage = 'Failed to update reminder settings';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Medication not found. The list has been refreshed.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this medication reminder';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: (id: string) => medicationService.deleteMedication(id),
    onSuccess: () => {
      // Invalidate and refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: ['medicationStats'] })
      ]).then(() => {
        toast({
          title: 'Success',
          description: 'Medication deleted successfully',
          variant: 'default',
        });
      });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      
      let errorMessage = 'Failed to delete medication';
      if (error.response?.status === 404) {
        errorMessage = 'Medication not found. The list has been refreshed.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this medication';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Refresh the medications list if there was a 404 error
      if (error.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['medications'] });
      }
    }
  });

  // Handle delete medication
  const handleDeleteMedication = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    await deleteMedicationMutation.mutateAsync(id);
  };

  // Reset form to default values
  const resetForm = () => {
    setNewMedication({
      patientId: '',
      patientName: '',
      name: '',
      medication: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'pending',
      isReminderSet: false,
      notes: ''
    });
  };

  // Handle opening the add medication dialog
  const handleOpenAddDialog = () => {
    resetForm();
    setIsEditMode(false);
    setIsAddDialogOpen(true);
  };

  // Handle opening the edit medication dialog
  const handleEditMedication = (medication: Medication) => {
    // Ensure we have a valid medication ID
    if (!medication._id) {
      toast({
        title: 'Error',
        description: 'Cannot edit medication: Invalid medication ID',
        variant: 'destructive',
      });
      return;
    }

    // Set the form with the medication data
    setNewMedication({
      ...medication,
      _id: medication._id, // Ensure ID is included
      patientId: typeof medication.patientId === 'object' ? medication.patientId._id : medication.patientId,
      patientName: medication.patientName || '',
      name: medication.name || medication.medication || '',
      medication: medication.medication || medication.name || '',
      instructions: medication.instructions || medication.notes || '',
      notes: medication.notes || medication.instructions || '',
      startDate: medication.startDate ? new Date(medication.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: medication.endDate ? new Date(medication.endDate).toISOString().split('T')[0] : '',
    });
    
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      const requiredFields = [
        { field: 'patientId', name: 'Patient' },
        { field: 'name', name: 'Medication Name' },
        { field: 'dosage', name: 'Dosage' },
        { field: 'frequency', name: 'Frequency' },
        { field: 'startDate', name: 'Start Date' }
      ];

      const missingFields = requiredFields
        .filter(({ field }) => !newMedication[field as keyof typeof newMedication])
        .map(({ name }) => name);

      if (missingFields.length > 0) {
        toast({
          title: 'Missing Information',
          description: `Please fill in all required fields: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Ensure patientId is a string
      const patientId = newMedication.patientId 
        ? (typeof newMedication.patientId === 'object' 
            ? (newMedication.patientId as any)?._id || '' 
            : String(newMedication.patientId))
        : '';

      if (!patientId) {
        toast({
          title: 'Invalid Patient',
          description: 'Please select a valid patient',
          variant: 'destructive',
        });
        return;
      }

      // Prepare the medication data with the correct field names
      const medicationData = {
        ...newMedication,
        name: newMedication.name || newMedication.medication,
        patientId: patientId,
        patientName: newMedication.patientName || '',
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        startDate: newMedication.startDate,
        endDate: newMedication.endDate || undefined,
        status: newMedication.status || 'pending',
        isReminderSet: newMedication.isReminderSet || false,
        reminderTime: newMedication.isReminderSet ? (newMedication.reminderTime || '09:00') : undefined,
        notes: newMedication.notes || '',
      };
      
      if (isEditMode && newMedication._id) {
        // Update existing medication
        updateMedicationMutation.mutate({
          id: newMedication._id,
          ...medicationData
        });
      } else {
        // Add new medication
        addMedicationMutation.mutate(medicationData);
      }
    } catch (error: any) {
      console.error('Error in handleAddMedication:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle error state
  const hasError = Boolean(patientsError);
  
  if (hasError) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load data. Please try again later.</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => {
            if (patientsError) refetchPatients();
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            queryClient.invalidateQueries({ queryKey: ['medicationSearch', searchQuery] });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Medication Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and track patient medications and reminders
        </p>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search medications..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditMode(false);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddMedication}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Medication' : 'Add New Medication'}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Update the medication details' : 'Add a new medication for a patient'}
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
                      const selectedPatient = patients.find(p => p.id === value || p._id === value);
                      if (selectedPatient) {
                        setNewMedication(prev => ({
                          ...prev,
                          patientId: selectedPatient._id || selectedPatient.id || '',
                          patientName: selectedPatient.name || ''
                        }));
                      }
                    }}
                    required
                    disabled={patients.length === 0}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: { id: string; name: string }) => (
                        <SelectItem key={patient.id} value={patient.id}>
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
                    value={newMedication.name || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      name: e.target.value,
                      medication: e.target.value // Keep both for compatibility
                    }))}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dosage" className="text-right">
                    Dosage
                  </Label>
                  <Input
                    id="dosage"
                    value={newMedication.dosage || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      dosage: e.target.value
                    }))}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Frequency
                  </Label>
                  <Input
                    id="frequency"
                    value={newMedication.frequency || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      frequency: e.target.value
                    }))}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newMedication.startDate?.toString().split('T')[0] || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date (Optional)
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newMedication.endDate?.toString().split('T')[0] || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newMedication.notes || ''}
                    onChange={(e) => setNewMedication(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Reminder
                  </Label>
                  <div className="flex items-center space-x-4 col-span-3">
                    <input
                      type="checkbox"
                      id="isReminderSet"
                      checked={newMedication.isReminderSet || false}
                      onChange={(e) => setNewMedication(prev => ({
                        ...prev,
                        isReminderSet: e.target.checked
                      }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isReminderSet" className="text-sm font-medium">
                      Set reminder
                    </Label>
                    {newMedication.isReminderSet && (
                      <Input
                        type="time"
                        value={newMedication.reminderTime || '09:00'}
                        onChange={(e) => setNewMedication(prev => ({
                          ...prev,
                          reminderTime: e.target.value
                        }))}
                        className="w-32"
                      />
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMedicationMutation.isPending || updateMedicationMutation.isPending}>
                  {isEditMode ? 'Update' : 'Add'} Medication
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Medication List</CardTitle>
        <CardDescription>
          View and manage all medications
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                    {(() => {
                      const patientId = medication.patientId;
                      const getPatientName = (patientId: string | { _id: string; name: string } | null) => {
                        if (!patientId) return 'Unknown Patient';
                        if (typeof patientId === 'object' && patientId !== null) {
                          return patientId.name || 'Unknown Patient';
                        }
                        const patient = patients.find(p => p.id === patientId || p._id === patientId);
                        return patient?.name || 'Unknown Patient';
                      };
                      return getPatientName(patientId);
                    })()}
                  </TableCell>
                  <TableCell>{medication.medication || medication.name}</TableCell>
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
                      {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
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
                        onClick={() => handleEditMedication(medication)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMedication(medication._id)}
                        disabled={deleteMedicationMutation.isPending}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        {deleteMedicationMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                      <Button
                        variant={medication.isReminderSet ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={async () => {
                          try {
                            // Use the toggleReminderMutation directly since it already handles verification
                            await toggleReminderMutation.mutateAsync({
                              id: medication._id,
                              reminderTime: medication.reminderTime || '09:00',
                            });
                          } catch (error) {
                            console.error('Error toggling reminder:', error);
                            // Error handling is already done in the mutation's onError
                          }
                        }}
                        disabled={toggleReminderMutation.isPending}
                        className="h-8 w-8 p-0"
                      >
                        {toggleReminderMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Bell 
                            className={`h-4 w-4 ${medication.isReminderSet ? 'text-primary' : ''}`} 
                            fill={medication.isReminderSet ? 'currentColor' : 'none'}
                          />
                        )}
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
    </div>
  );
};

export default MedicationDashboard;
