import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Bell, BellOff } from 'lucide-react';

// Types
export interface Medication {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  reminderEnabled: boolean;
  patientId: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  prescribedBy?: string;
  patientName?: string;
  createdAt?: string;
  updatedAt?: string;
}

type MedicationFormData = Omit<Medication, '_id' | 'createdAt' | 'updatedAt' | 'patientName' | 'prescribedBy'>;

interface User {
  id: string;
  role?: string;
}

interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
}

// Mock API functions - replace these with actual API calls
const fetchMedications = async (patientId?: string): Promise<Medication[]> => {
  // This would be replaced with an actual API call
  return [];
};

const addMedication = async (data: MedicationFormData): Promise<Medication> => {
  // This would be replaced with an actual API call
  return { ...data, _id: Math.random().toString(), reminderEnabled: false };
};

const updateMedication = async (id: string, data: Partial<MedicationFormData>): Promise<Medication> => {
  // This would be replaced with an actual API call
  return { _id: id, ...data } as Medication;
};

const deleteMedication = async (id: string): Promise<void> => {
  // This would be replaced with an actual API call
  return Promise.resolve();
};

const toggleReminder = async (id: string, enabled: boolean): Promise<void> => {
  // This would be replaced with an actual API call
  return Promise.resolve();
};

export const MedicationDashboard = ({ user, patientId: propPatientId }: { user: User; patientId?: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ patientId?: string }>();
  const patientId = propPatientId || params.patientId;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [newMedication, setNewMedication] = useState<MedicationFormData>({
    name: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    patientId: patientId || '',
    reminderEnabled: false,
    status: 'pending',
  });

  // Fetch medications
  const { 
    data: medications = [], 
    isLoading, 
    error: medicationsError, 
    refetch: refetchMedications 
  } = useQuery<Medication[]>({
    queryKey: ['medications', patientId],
    queryFn: () => fetchMedications(patientId),
    enabled: !!patientId,
  });

  // Fetch patients (for staff/admin view)
  const { 
    data: patients = [], 
    error: patientsError, 
    refetch: refetchPatients 
  } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => [], // Replace with actual patient fetch
    enabled: user.role !== 'patient',
  });

  // Mutations
  const addMedicationMutation = useMutation({
    mutationFn: addMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Success',
        description: 'Medication added successfully',
      });
      setIsAddDialogOpen(false);
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        startDate: new Date().toISOString().split('T')[0],
        patientId: patientId || '',
        reminderEnabled: false,
        status: 'pending',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add medication',
        variant: 'destructive',
      });
    },
  });

  const updateMedicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicationFormData> }) => 
      updateMedication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Success',
        description: 'Medication updated successfully',
      });
      setEditingMedication(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update medication',
        variant: 'destructive',
      });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: deleteMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Success',
        description: 'Medication deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete medication',
        variant: 'destructive',
      });
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      toggleReminder(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reminder',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMedication) {
      updateMedicationMutation.mutate({
        id: editingMedication._id,
        data: newMedication,
      });
    } else {
      addMedicationMutation.mutate({
        ...newMedication,
        patientId: patientId || '',
      });
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate,
      notes: medication.notes,
      patientId: medication.patientId,
      reminderEnabled: medication.reminderEnabled,
      status: medication.status || 'pending',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      deleteMedicationMutation.mutate(id);
    }
  };

  const handleToggleReminder = (id: string, enabled: boolean) => {
    toggleReminderMutation.mutate({ id, enabled: !enabled });
  };

  // Filter medications based on search query
  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.frequency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading medications...</div>;
  }

  if (medicationsError) {
    return (
      <div className="p-4">
        <div className="text-red-500 mb-2">
          Error loading medications. Please try again.
        </div>
        <Button 
          onClick={() => refetchMedications()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Medication Dashboard</h2>
        <Button onClick={() => {
          setEditingMedication(null);
          setNewMedication({
            name: '',
            dosage: '',
            frequency: '',
            startDate: new Date().toISOString().split('T')[0],
            patientId: patientId || '',
            reminderEnabled: false,
            status: 'pending',
          });
          setIsAddDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Medication
        </Button>
      </div>

      <div className="mb-4">
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

      <div className="border rounded-md">
        {filteredMedications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No medications found matching your search.' : 'No medications found.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Dosage</th>
                <th className="text-left p-4">Frequency</th>
                <th className="text-left p-4">Start Date</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedications.map((med) => (
                <tr key={med._id} className="border-b hover:bg-muted/50">
                  <td className="p-4">{med.name}</td>
                  <td className="p-4">{med.dosage}</td>
                  <td className="p-4">{med.frequency}</td>
                  <td className="p-4">
                    {new Date(med.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      med.status === 'active' ? 'bg-green-100 text-green-800' :
                      med.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      med.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {med.status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleReminder(med._id, med.reminderEnabled)}
                        title={med.reminderEnabled ? 'Disable reminder' : 'Enable reminder'}
                      >
                        {med.reminderEnabled ? (
                          <Bell className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <BellOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(med)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(med._id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Medication Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingMedication ? 'Edit Medication' : 'Add New Medication'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Medication Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    placeholder="e.g., Ibuprofen"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Dosage <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                      placeholder="e.g., 200mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                      placeholder="e.g., Twice daily"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={newMedication.startDate}
                      onChange={(e) => setNewMedication({...newMedication, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={newMedication.endDate || ''}
                      onChange={(e) => setNewMedication({...newMedication, endDate: e.target.value || undefined})}
                    />
                  </div>
                </div>

                {user.role !== 'patient' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={newMedication.status}
                      onChange={(e) => setNewMedication({...newMedication, status: e.target.value as any})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newMedication.notes || ''}
                    onChange={(e) => setNewMedication({...newMedication, notes: e.target.value})}
                    className="w-full p-2 border rounded-md min-h-[80px]"
                    placeholder="Additional notes about this medication..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={newMedication.reminderEnabled || false}
                    onChange={(e) => setNewMedication({...newMedication, reminderEnabled: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium">
                    Enable reminders for this medication
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMedicationMutation.isPending || updateMedicationMutation.isPending}>
                  {editingMedication ? 'Update' : 'Add'} Medication
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationDashboard;
