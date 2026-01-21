import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pill, Search, Users, DollarSign, Clock, 
  CheckCircle, AlertCircle, Eye, Package,
  FileText, Calendar, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Prescription {
  _id: string;
  patientId: any;
  doctorId: any;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  items?: any[];
  notes?: string;
  createdAt: string;
  paymentStatus?: string;
  totalAmount?: number;
}

export const PharmacyDashboard: React.FC = () => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/prescriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load prescriptions');
      
      const data = await response.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load prescriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prescriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillPrescription = async () => {
    if (!selectedPrescription) return;

    try {
      const response = await fetch(`${backendUrl}/api/prescriptions/${selectedPrescription._id}/fulfill`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Fulfilled',
          notes: fulfillmentNotes,
        }),
      });

      if (!response.ok) throw new Error('Failed to fulfill prescription');

      toast({
        title: 'Success',
        description: 'Prescription fulfilled successfully',
      });

      setIsFulfillOpen(false);
      setFulfillmentNotes('');
      setSelectedPrescription(null);
      loadPrescriptions();
    } catch (error: any) {
      console.error('Failed to fulfill prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to fulfill prescription',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-700' },
      'Pending': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700' },
      'Fulfilled': { variant: 'default', className: 'bg-blue-100 text-blue-700' },
      'Expired': { variant: 'destructive', className: 'bg-red-100 text-red-700' },
      'Discontinued': { variant: 'outline', className: 'bg-gray-100 text-gray-700' },
    };

    const statusConfig = config[status] || config['Pending'];

    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status}
      </Badge>
    );
  };

  const getPatientName = (patient: any) => {
    if (!patient) return 'Unknown Patient';
    if (typeof patient === 'string') return 'Patient';
    return patient.name || patient.firstName || 'Patient';
  };

  const getDoctorName = (doctor: any) => {
    if (!doctor) return 'Unknown Doctor';
    if (typeof doctor === 'string') return 'Doctor';
    return doctor.name || doctor.firstName || 'Doctor';
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const patientName = getPatientName(rx.patientId).toLowerCase();
      const medication = (rx.medication || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = patientName.includes(searchLower) || medication.includes(searchLower);
      const matchesStatus = statusFilter === 'all' || (rx.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter(rx => rx.status === 'Pending' || rx.status === 'Active').length;
    const fulfilled = prescriptions.filter(rx => rx.status === 'Fulfilled').length;
    const revenue = prescriptions
      .filter(rx => rx.paymentStatus === 'Paid')
      .reduce((sum, rx) => sum + (rx.totalAmount || 0), 0);

    return { total, pending, fulfilled, revenue };
  }, [prescriptions]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Manage prescriptions and fulfill medication orders</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/pharmacy/prescriptions">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              All Prescriptions
            </Button>
          </Link>
          <Link to="/dashboard/pharmacy/billing">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fulfilled</p>
                <p className="text-2xl font-bold">{stats.fulfilled}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Prescriptions</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading prescriptions...</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No prescriptions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.slice(0, 10).map((rx) => (
                  <TableRow key={rx._id}>
                    <TableCell className="font-medium">{getPatientName(rx.patientId)}</TableCell>
                    <TableCell>{getDoctorName(rx.doctorId)}</TableCell>
                    <TableCell>{rx.medication}</TableCell>
                    <TableCell>{rx.dosage}</TableCell>
                    <TableCell>{format(new Date(rx.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(rx.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(rx);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(rx.status === 'Pending' || rx.status === 'Active') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                            setSelectedPrescription(rx);
                              setIsFulfillOpen(true);
                            }}
                          >
                            Fulfill
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{getPatientName(selectedPrescription.patientId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p className="font-medium">{getDoctorName(selectedPrescription.doctorId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Medication</Label>
                  <p className="font-medium">{selectedPrescription.medication}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dosage</Label>
                  <p className="font-medium">{selectedPrescription.dosage}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="font-medium">{selectedPrescription.frequency}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">{selectedPrescription.duration}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPrescription.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{format(new Date(selectedPrescription.createdAt), 'PPP')}</p>
                </div>
              </div>
              {selectedPrescription.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfill Prescription Dialog */}
      <Dialog open={isFulfillOpen} onOpenChange={setIsFulfillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Prescription</DialogTitle>
            <DialogDescription>
              Mark this prescription as fulfilled and add any notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPrescription && (
              <div className="space-y-2">
                <p><strong>Patient:</strong> {getPatientName(selectedPrescription.patientId)}</p>
                <p><strong>Medication:</strong> {selectedPrescription.medication} - {selectedPrescription.dosage}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Fulfillment Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the fulfillment..."
                value={fulfillmentNotes}
                onChange={(e) => setFulfillmentNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFulfillOpen(false)}>Cancel</Button>
            <Button onClick={handleFulfillPrescription}>Mark as Fulfilled</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyDashboard;
