import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Types
interface Medication {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'missed' | 'taken';
  nextDose?: string;
  patientId: string | { _id: string; name: string } | null;
  patientName?: string;
  isReminderSet?: boolean;
  reminderTime?: string;
  [key: string]: any;
}

interface User {
  id: string;
  role?: string;
}

interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  [key: string]: any;
}

const MedicationDashboard = ({ user, patientId: propPatientId }: { user: User; patientId?: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ patientId?: string }>();
  const patientId = propPatientId || params.patientId;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('medications');
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: '',
    status: 'pending',
    patientId: patientId || '',
  });

  // Mock WebSocket connection state (replace with actual implementation)
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  // Mock data fetch
  const { 
    data: medications = [], 
    isLoading, 
    error: medicationsError, 
    refetch: refetchMedications 
  } = useQuery<Medication[]>({
    queryKey: ['medications', patientId],
    queryFn: async () => {
      // Replace with actual API call
      return [];
    },
  });

  // Mock patients fetch
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      // Replace with actual API call
      return [];
    },
    enabled: !patientId,
  });

  // Filter medications based on search query
  const displayMedications = medications.filter(med => 
    med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add/Update medication mutation
  const addMedicationMutation = useMutation({
    mutationFn: async (medication: Partial<Medication>) => {
      // Replace with actual API call
      console.log('Saving medication:', medication);
      return medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setIsAddDialogOpen(false);
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        status: 'pending',
        patientId: patientId || '',
      });
      toast({
        title: 'Success',
        description: 'Medication saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save medication',
        variant: 'destructive',
      });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: string) => {
      // Replace with actual API call
      console.log('Deleting medication:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast({
        title: 'Success',
        description: 'Medication deleted successfully',
      });
    },
  });

  // Toggle reminder mutation
  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, reminderTime }: { id: string; reminderTime: string }) => {
      // Replace with actual API call
      console.log('Toggling reminder for:', id, 'at', reminderTime);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  // Helper function to get patient name
  const getPatientName = (patientId: string | { _id: string; name: string } | null) => {
    if (!patientId) return 'Unknown Patient';
    if (typeof patientId === 'object' && patientId !== null) {
      return patientId.name || 'Unknown Patient';
    }
    const patient = patients.find(p => p._id === patientId);
    return patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (medicationsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-lg font-medium mb-2">Error Loading Medications</p>
        <p className="text-gray-600 mb-4">
          {medicationsError instanceof Error ? medicationsError.message : 'An unknown error occurred'}
        </p>
        <Button
          variant="outline"
          onClick={() => refetchMedications()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Health Records</h1>
          <p className="text-muted-foreground">
            Manage your medications and test reports
          </p>
        </div>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('medications')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'medications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Medications
          </button>
          <button
            onClick={() => setActiveTab('test-reports')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'test-reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Test Reports
          </button>
        </nav>
      </div>

      {activeTab === 'medications' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Medication List</CardTitle>
                <CardDescription>
                  {isSocketConnected ? (
                    <span className="text-green-600">Connected to real-time updates</span>
                  ) : (
                    <span className="text-yellow-600">Connecting to real-time updates...</span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={() => {
                setNewMedication({
                  name: '',
                  dosage: '',
                  frequency: '',
                  status: 'pending',
                  patientId: patientId || '',
                });
                setIsAddDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Medication
              </Button>
            </div>
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
                    {!patientId && <TableHead>Patient</TableHead>}
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Dose</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMedications.length > 0 ? (
                    displayMedications.map((medication) => (
                      <TableRow key={medication._id}>
                        {!patientId && (
                          <TableCell className="font-medium">
                            {getPatientName(medication.patientId)}
                          </TableCell>
                        )}
                        <TableCell>{medication.name}</TableCell>
                        <TableCell>{medication.dosage}</TableCell>
                        <TableCell>{medication.frequency}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              medication.status === 'taken'
                                ? 'default'
                                : medication.status === 'pending' || medication.status === 'active'
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
                                  deleteMedicationMutation.mutate(medication._id);
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
                                  id: medication._id,
                                  reminderTime: medication.reminderTime || '09:00',
                                })
                              }
                              disabled={toggleReminderMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              {medication.isReminderSet ? (
                                <Bell className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <BellOff className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {medication.isReminderSet ? 'Disable' : 'Enable'} reminder
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={patientId ? 6 : 7} className="h-24 text-center">
                        No medications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'test-reports' && (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Test reports feature coming soon</p>
        </div>
      )}
    </div>
  );
};

export default MedicationDashboard;
