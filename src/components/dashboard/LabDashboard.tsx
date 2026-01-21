import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, Edit, Trash2, Eye, FileText, AlertCircle, 
  CheckCircle, Clock, Filter, Search, Plus, Calendar, Users
} from 'lucide-react';

interface LabReport {
  _id: string;
  testName: string;
  patientId: { _id: string; name: string; age?: number; gender?: string } | string;
  doctorId?: { _id: string; name: string } | string;
  uploadedBy: { _id: string; name: string; role: string } | string;
  fileUrl?: string;
  fileName?: string;
  reportType?: string;
  status: 'Pending' | 'Processed' | 'Reviewed' | 'Archived';
  priority: 'Routine' | 'Urgent' | 'STAT';
  remarks?: string;
  notes?: string;
  date: string;
  createdAt: string;
  isDeleted?: boolean;
}

interface Patient {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
}

export const LabDashboard: React.FC = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Upload/Edit form state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<LabReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    testName: '',
    patientId: '',
    doctorId: '',
    fileUrl: '',
    fileName: '',
    reportType: '',
    priority: 'Routine',
    status: 'Pending',
    remarks: '',
    notes: ''
  });

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, priorityFilter]);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`${backendUrl}/api/patients`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients', err);
      toast({
        title: "Error",
        description: "Failed to load patient list",
        variant: "destructive"
      });
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      let url = `${backendUrl}/api/lab/reports?page=${page}&limit=${limit}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load lab reports', err);
      toast({
        title: "Error",
        description: "Failed to load lab reports",
        variant: "destructive"
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast({
        title: "Error",
        description: "Please select a patient before uploading the report",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('reportFile', selectedFile);
      uploadFormData.append('testName', formData.testName);
      uploadFormData.append('patientId', formData.patientId);
      if (formData.doctorId) uploadFormData.append('doctorId', formData.doctorId);
      if (formData.reportType) uploadFormData.append('reportType', formData.reportType);
      uploadFormData.append('priority', formData.priority);
      uploadFormData.append('status', formData.status);
      if (formData.remarks) uploadFormData.append('remarks', formData.remarks);
      if (formData.notes) uploadFormData.append('notes', formData.notes);

      const res = await fetch(`${backendUrl}/api/lab/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload');
      }

      toast({
        title: "Success",
        description: "Lab report uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      resetForm();
      loadReports();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to upload report",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      const uploadFormData = new FormData();
      if (selectedFile) {
        uploadFormData.append('reportFile', selectedFile);
      }
      uploadFormData.append('testName', formData.testName);
      uploadFormData.append('patientId', formData.patientId);
      if (formData.doctorId) uploadFormData.append('doctorId', formData.doctorId);
      if (formData.reportType) uploadFormData.append('reportType', formData.reportType);
      uploadFormData.append('priority', formData.priority);
      uploadFormData.append('status', formData.status);
      if (formData.remarks) uploadFormData.append('remarks', formData.remarks);
      if (formData.notes) uploadFormData.append('notes', formData.notes);

      const res = await fetch(`${backendUrl}/api/lab/reports/${editingReport._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update');
      }

      toast({
        title: "Success",
        description: "Lab report updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingReport(null);
      resetForm();
      loadReports();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update report",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/lab/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete');
      }

      toast({
        title: "Success",
        description: "Lab report deleted successfully",
      });

      loadReports();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (report: LabReport) => {
    setEditingReport(report);
    setFormData({
      testName: report.testName,
      patientId: typeof report.patientId === 'object' ? report.patientId._id : report.patientId,
      doctorId: typeof report.doctorId === 'object' ? report.doctorId._id : report.doctorId || '',
      fileUrl: report.fileUrl || '',
      fileName: report.fileName || '',
      reportType: report.reportType || '',
      priority: report.priority,
      status: report.status,
      remarks: report.remarks || '',
      notes: report.notes || ''
    });
    setSelectedFile(null);  // Clear any previously selected file
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      patientId: '',
      doctorId: '',
      fileUrl: '',
      fileName: '',
      reportType: '',
      priority: 'Routine',
      status: 'Pending',
      remarks: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processed: 'bg-blue-100 text-blue-800',
      Reviewed: 'bg-green-100 text-green-800',
      Archived: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      Routine: 'bg-gray-100 text-gray-800',
      Urgent: 'bg-orange-100 text-orange-800',
      STAT: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority] || ''}>{priority}</Badge>;
  };

  const filteredReports = reports.filter(r => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const patientName = typeof r.patientId === 'object' ? r.patientId.name : '';
    return (
      r.testName.toLowerCase().includes(search) ||
      patientName.toLowerCase().includes(search) ||
      r.reportType?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lab Dashboard</h1>
          <p className="text-muted-foreground">Manage and track all lab reports</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsUploadDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Upload New Report
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Lab Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testName">Test Name *</Label>
                  <Input
                    id="testName"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientId">Patient Name *</Label>
                  <Select 
                    value={formData.patientId} 
                    onValueChange={(v) => setFormData({ ...formData, patientId: v })}
                    required
                  >
                    <SelectTrigger id="patientId">
                      <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPatients ? (
                        <SelectItem value="_loading" disabled>Loading patients...</SelectItem>
                      ) : patients.length === 0 ? (
                        <SelectItem value="_empty" disabled>No patients found</SelectItem>
                      ) : (
                        patients.map((patient) => (
                          <SelectItem key={patient._id} value={patient._id}>
                            {patient.name}
                            {(patient.gender || patient.age) && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({patient.gender && patient.gender}{patient.age && `, ${patient.age}y`})
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.patientId && patients.find(p => p._id === formData.patientId) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {patients.find(p => p._id === formData.patientId)?.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Input
                    id="reportType"
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    placeholder="e.g., Blood Test, X-Ray"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
              <div>
                <Label htmlFor="reportFile">Upload Report Document *</Label>
                <Input
                  id="reportFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (10MB max)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Error",
                          description: "File size must be less than 10MB",
                          variant: "destructive"
                        });
                        e.target.value = '';
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                  required
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Technical Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Upload Report</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/lab/patient-reports">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patient Lab Requests</p>
                  <p className="text-lg font-semibold">View & Upload Reports</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/lab/calendar">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lab Schedule</p>
                  <p className="text-lg font-semibold">View Test Calendar</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/lab/upload-report">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 hover:border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upload Reports</p>
                  <p className="text-lg font-semibold">Upload Lab Reports</p>
                </div>
                <Upload className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'Pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.priority === 'Urgent' || r.priority === 'STAT').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'Reviewed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reports</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="STAT">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-muted-foreground">
              Page {page} of {totalPages} — Total: {total} reports
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No reports found</TableCell>
                </TableRow>
              ) : (
                filteredReports.map(r => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.testName}</TableCell>
                    <TableCell>
                      {typeof r.patientId === 'object' ? (
                        <div>
                          <div>{r.patientId.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.patientId.age && `${r.patientId.age}y`} {r.patientId.gender}
                          </div>
                        </div>
                      ) : (
                        r.patientId
                      )}
                    </TableCell>
                    <TableCell>{new Date(r.date || r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getPriorityBadge(r.priority)}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell>
                      {typeof r.uploadedBy === 'object' ? r.uploadedBy.name : 'Lab'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => window.open(r.fileUrl, '_blank')} disabled={!r.fileUrl}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(r)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} variant="outline">
              Previous
            </Button>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} variant="outline">
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-testName">Test Name *</Label>
                <Input
                  id="edit-testName"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-reportType">Report Type</Label>
                <Input
                  id="edit-reportType"
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Reviewed">Reviewed</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-reportFile">Replace Report Document (Optional)</Label>
              <Input
                id="edit-reportFile"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (10MB max)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "File size must be less than 10MB",
                        variant: "destructive"
                      });
                      e.target.value = '';
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  New file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              {editingReport?.fileName && !selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Current file: {editingReport.fileName}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep existing file. Upload new file to replace.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Technical Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabDashboard;
