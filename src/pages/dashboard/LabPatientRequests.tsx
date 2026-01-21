import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Plus,
  Upload
} from 'lucide-react';
import labRequestService, { LabRequest, LabRequestFilters, CreateLabRequestData } from '@/services/labRequestService';
import patientService, { Patient } from '@/services/patientService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export const LabPatientRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  
  // Selected request for actions
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [sampleType, setSampleType] = useState('');

  // Upload form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Patient search
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Create request form
  const [createForm, setCreateForm] = useState<CreateLabRequestData>({
    patientId: '',
    testName: '',
    testType: 'Other',
    priority: 'Routine',
    clinicalNotes: '',
    symptoms: '',
    provisionalDiagnosis: '',
    instructions: '',
    fastingRequired: false,
  });

  useEffect(() => {
    loadRequests();
  }, [currentPage, statusFilter, priorityFilter]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      loadPatients();
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (patientSearchTerm.length >= 2) {
      searchPatients();
    } else if (patientSearchTerm.length === 0) {
      loadPatients();
    }
  }, [patientSearchTerm]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filters: LabRequestFilters = {
        page: currentPage,
        limit: 20,
      };

      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;

      const response = await labRequestService.getLabRequests(filters);
      setRequests(response.requests);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load lab requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load lab requests');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const patientList = await patientService.getPatients({ limit: 50 });
      setPatients(patientList);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
    }
  };

  const searchPatients = async () => {
    try {
      const results = await patientService.searchPatients(patientSearchTerm);
      setPatients(results);
    } catch (error: any) {
      console.error('Failed to search patients:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    const displayName = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    setPatientSearchTerm(displayName);
    setCreateForm({ ...createForm, patientId: patient._id });
    setShowPatientDropdown(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      await labRequestService.updateLabRequestStatus(selectedRequest._id, {
        status: newStatus,
        notes: statusNotes || undefined,
        sampleType: sampleType || undefined,
      });

      toast.success('Status updated successfully');
      setIsStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
      setSampleType('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleViewDetails = async (request: LabRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await labRequestService.cancelLabRequest(requestId, 'Cancelled by user');
      toast.success('Request cancelled successfully');
      loadRequests();
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or image file (JPG, PNG)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadReport = async () => {
    if (!selectedRequest || !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('requestId', selectedRequest._id);
      formData.append('testName', selectedRequest.testName);
      formData.append('patientId', selectedRequest.patientId._id);
      if (uploadNotes) {
        formData.append('notes', uploadNotes);
      }

      const token = localStorage.getItem('authToken');
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/lab/reports/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload report');
      }

      toast.success('Lab report uploaded successfully');
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadNotes('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Failed to upload report:', error);
      toast.error(error.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!createForm.patientId || !createForm.testName) {
      toast.error('Patient Name and Test Name are required');
      return;
    }

    try {
      await labRequestService.createLabRequest(createForm);
      toast.success('Lab request created successfully');
      setIsCreateDialogOpen(false);
      setCreateForm({
        patientId: '',
        testName: '',
        testType: 'Other',
        priority: 'Routine',
        clinicalNotes: '',
        symptoms: '',
        provisionalDiagnosis: '',
        instructions: '',
        fastingRequired: false,
      });
      setSelectedPatient(null);
      setPatientSearchTerm('');
      loadRequests();
    } catch (error: any) {
      console.error('Failed to create request:', error);
      toast.error(error.response?.data?.message || 'Failed to create request');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      'Pending': { variant: 'secondary', icon: Clock },
      'Accepted': { variant: 'default', icon: CheckCircle },
      'In Progress': { variant: 'default', icon: AlertCircle },
      'Sample Collected': { variant: 'default', icon: FileText },
      'Processing': { variant: 'default', icon: RefreshCw },
      'Completed': { variant: 'success', icon: CheckCircle },
      'Cancelled': { variant: 'destructive', icon: XCircle },
      'Rejected': { variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { variant: 'secondary', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'STAT': 'bg-red-100 text-red-800 border-red-300',
      'Urgent': 'bg-orange-100 text-orange-800 border-orange-300',
      'Routine': 'bg-blue-100 text-blue-800 border-blue-300',
    };

    return (
      <Badge className={colors[priority] || colors.Routine}>
        {priority}
      </Badge>
    );
  };

  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.testName.toLowerCase().includes(search) ||
      request.patientId.name.toLowerCase().includes(search) ||
      request.requestedBy.name.toLowerCase().includes(search)
    );
  });

  const isLabUser = user?.role === 'lab' || user?.role === 'admin';
  const canUpdateStatus = user?.role === 'lab' || user?.role === 'doctor' || user?.role === 'admin';
  const canCreateRequest = user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Patient Lab Requests</CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage and track lab test requests ({total} total)
              </p>
            </div>
            <div className="flex gap-2">
              {canCreateRequest && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Lab Request</DialogTitle>
                      <DialogDescription>
                        Submit a new lab test request for a patient
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 relative">
                          <Label htmlFor="patientName">Patient Name *</Label>
                          <Input
                            id="patientName"
                            placeholder="Search patient by name..."
                            value={patientSearchTerm}
                            onChange={(e) => {
                              setPatientSearchTerm(e.target.value);
                              setShowPatientDropdown(true);
                            }}
                            onFocus={() => setShowPatientDropdown(true)}
                            autoComplete="off"
                          />
                          {showPatientDropdown && patients.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                              {patients.map((patient) => (
                                <div
                                  key={patient._id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handlePatientSelect(patient)}
                                >
                                  <div className="font-medium">
                                    {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {patient.email} • {patient.gender} • {patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'}y
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {selectedPatient && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Selected: {selectedPatient.name || `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim()}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="testName">Test Name *</Label>
                          <Input
                            id="testName"
                            placeholder="e.g., Complete Blood Count"
                            value={createForm.testName}
                            onChange={(e) => setCreateForm({ ...createForm, testName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="testType">Test Type</Label>
                          <Select
                            value={createForm.testType}
                            onValueChange={(value) => setCreateForm({ ...createForm, testType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Blood Test">Blood Test</SelectItem>
                              <SelectItem value="Urine Test">Urine Test</SelectItem>
                              <SelectItem value="X-Ray">X-Ray</SelectItem>
                              <SelectItem value="CT Scan">CT Scan</SelectItem>
                              <SelectItem value="MRI">MRI</SelectItem>
                              <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                              <SelectItem value="ECG">ECG</SelectItem>
                              <SelectItem value="Biopsy">Biopsy</SelectItem>
                              <SelectItem value="Culture">Culture</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={createForm.priority}
                            onValueChange={(value: any) => setCreateForm({ ...createForm, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Routine">Routine</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                              <SelectItem value="STAT">STAT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symptoms">Symptoms</Label>
                        <Textarea
                          id="symptoms"
                          placeholder="Patient symptoms..."
                          value={createForm.symptoms}
                          onChange={(e) => setCreateForm({ ...createForm, symptoms: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                        <Textarea
                          id="clinicalNotes"
                          placeholder="Clinical indication for the test..."
                          value={createForm.clinicalNotes}
                          onChange={(e) => setCreateForm({ ...createForm, clinicalNotes: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provisionalDiagnosis">Provisional Diagnosis</Label>
                        <Input
                          id="provisionalDiagnosis"
                          placeholder="Suspected diagnosis"
                          value={createForm.provisionalDiagnosis}
                          onChange={(e) => setCreateForm({ ...createForm, provisionalDiagnosis: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions">Special Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Any special handling instructions..."
                          value={createForm.instructions}
                          onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fastingRequired"
                          checked={createForm.fastingRequired}
                          onCheckedChange={(checked) =>
                            setCreateForm({ ...createForm, fastingRequired: checked as boolean })
                          }
                        />
                        <Label htmlFor="fastingRequired" className="cursor-pointer">
                          Fasting Required
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRequest}>Create Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Button onClick={loadRequests} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by test name, patient, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Sample Collected">Sample Collected</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Priorities</SelectItem>
                <SelectItem value="STAT">STAT</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No lab requests found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{request.patientId.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.patientId.age}y, {request.patientId.gender}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.testName}</div>
                          {request.sampleType && (
                            <div className="text-xs text-muted-foreground">
                              Sample: {request.sampleType}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{request.testType}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{request.requestedBy.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {request.requestedByRole}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(request.requestDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.labReportId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/lab/reports/${request.labReportId._id}/download`, '_blank')}
                              title="Download Report"
                            >
                              <Download className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {isLabUser && !request.labReportId && request.status !== 'Cancelled' && request.status !== 'Rejected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsUploadDialogOpen(true);
                              }}
                              title="Upload Report"
                            >
                              <Upload className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {canUpdateStatus && !['Completed', 'Cancelled', 'Rejected'].includes(request.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setNewStatus(request.status);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              Update Status
                            </Button>
                          )}
                          {!['Completed', 'Cancelled'].includes(request.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelRequest(request._id)}
                              title="Cancel Request"
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
            <DialogDescription>
              Update the status of the lab request for {selectedRequest?.patientId.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Sample Collected">Sample Collected</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'Sample Collected' && (
              <div className="space-y-2">
                <Label htmlFor="sampleType">Sample Type</Label>
                <Input
                  id="sampleType"
                  placeholder="e.g., Blood, Serum, Urine"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lab Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedRequest.patientId.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.patientId.age}y, {selectedRequest.patientId.gender}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Test Name</Label>
                  <p className="font-medium">{selectedRequest.testName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.testType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedRequest.requestedBy.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedRequest.requestedByRole}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Date</Label>
                  <p>{format(new Date(selectedRequest.requestDate), 'PPP')}</p>
                </div>
              </div>

              {selectedRequest.clinicalNotes && (
                <div>
                  <Label className="text-muted-foreground">Clinical Notes</Label>
                  <p className="mt-1 text-sm">{selectedRequest.clinicalNotes}</p>
                </div>
              )}

              {selectedRequest.symptoms && (
                <div>
                  <Label className="text-muted-foreground">Symptoms</Label>
                  <p className="mt-1 text-sm">{selectedRequest.symptoms}</p>
                </div>
              )}

              {selectedRequest.provisionalDiagnosis && (
                <div>
                  <Label className="text-muted-foreground">Provisional Diagnosis</Label>
                  <p className="mt-1 text-sm">{selectedRequest.provisionalDiagnosis}</p>
                </div>
              )}

              {selectedRequest.instructions && (
                <div>
                  <Label className="text-muted-foreground">Special Instructions</Label>
                  <p className="mt-1 text-sm">{selectedRequest.instructions}</p>
                </div>
              )}

              {selectedRequest.fastingRequired && (
                <div>
                  <Badge variant="secondary">Fasting Required</Badge>
                </div>
              )}

              {selectedRequest.assignedToLab && (
                <div>
                  <Label className="text-muted-foreground">Assigned Lab User</Label>
                  <p className="font-medium">{selectedRequest.assignedToLab.name}</p>
                </div>
              )}

              {selectedRequest.sampleCollectedAt && (
                <div>
                  <Label className="text-muted-foreground">Sample Collection</Label>
                  <p>{format(new Date(selectedRequest.sampleCollectedAt), 'PPP p')}</p>
                  {selectedRequest.sampleType && (
                    <p className="text-sm text-muted-foreground">Type: {selectedRequest.sampleType}</p>
                  )}
                </div>
              )}

              {selectedRequest.labNotes && (
                <div>
                  <Label className="text-muted-foreground">Lab Notes</Label>
                  <p className="mt-1 text-sm">{selectedRequest.labNotes}</p>
                </div>
              )}

              {selectedRequest.labReportId && (
                <div>
                  <Label className="text-muted-foreground">Lab Report</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{selectedRequest.labReportId.testName}</span>
                    <Badge variant="secondary">{selectedRequest.labReportId.status}</Badge>
                  </div>
                </div>
              )}

              {selectedRequest.completedAt && (
                <div>
                  <Label className="text-muted-foreground">Completed At</Label>
                  <p>{format(new Date(selectedRequest.completedAt), 'PPP p')}</p>
                </div>
              )}

              {selectedRequest.cancellationReason && (
                <div>
                  <Label className="text-muted-foreground">Cancellation Reason</Label>
                  <p className="mt-1 text-sm text-destructive">{selectedRequest.cancellationReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Report Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Lab Report</DialogTitle>
            <DialogDescription>
              Upload the lab report for {selectedRequest?.patientId.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <p className="font-medium">{selectedRequest?.testName}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportFile">Report File *</Label>
              <Input
                id="reportFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {selectedFile && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (Max 10MB)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadNotes">Notes (Optional)</Label>
              <Textarea
                id="uploadNotes"
                placeholder="Add any notes about this report..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={3}
                disabled={uploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadNotes('');
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadReport}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabPatientRequests;

