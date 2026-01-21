import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, FileText, Clock, Eye, Download, AlertCircle, CheckCircle, Filter, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppointments, usePatients, useAlerts, useUserProfile } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/ui/StatCard";
import { LineMini } from "@/components/charts/LineMini";

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
  extractedResults?: any;
}

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: me } = useUserProfile();
  const { data: appts, refetch: refetchAppts } = useAppointments('doctor');
  const { data: patients, refetch: refetchPatients } = usePatients();
  const { data: alerts, refetch: refetchAlerts } = useAlerts();
  const { on, off } = useSocket();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => {
    try { return localStorage.getItem('viewPatientId'); } catch { return null; }
  });

  // Lab Reports State
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Compute today's appointments for this doctor
  const today = useMemo(() => new Date(), []);
  const todaysAppts = useMemo(() => {
    const list = Array.isArray(appts) ? appts : [];
    const start = new Date(today);
    start.setHours(0,0,0,0);
    const end = new Date(today);
    end.setHours(23,59,59,999);
    return list.filter((a: any) => {
      const t = new Date(a.startsAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    }).sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [appts, today]);

  const hoursScheduled = useMemo(() => {
    return todaysAppts.reduce((sum: number, a: any) => {
      const durMin = (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / (1000 * 60);
      return sum + (isFinite(durMin) ? durMin : 0);
    }, 0) / 60;
  }, [todaysAppts]);

  const apptTrend = useMemo(() => {
    const list = Array.isArray(appts) ? appts : [];
    const days: Array<{ x: string; y: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = list.filter((a: any) => {
        const t = new Date(a.startsAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      days.push({ x: label, y: count });
    }
    return days;
  }, [appts]);

  const todayStats = useMemo(() => ([
    { title: "Appointments Today", value: String(todaysAppts.length), icon: Calendar, color: "text-primary" },
    { title: "Active Patients", value: String(Array.isArray(patients) ? patients.length : 0), icon: Users, color: "text-secondary" },
    { title: "Pending Reviews", value: String((Array.isArray(alerts) ? alerts.filter((a: any) => a.status === 'OPEN').length : 0)), icon: FileText, color: "text-medical-healing" },
    { title: "Hours Scheduled", value: hoursScheduled.toFixed(1), icon: Clock, color: "text-accent" },
  ]), [todaysAppts.length, patients, alerts, hoursScheduled]);

  const upcomingAppointments = useMemo(() => {
    return todaysAppts.map((a: any) => ({
      patient: a.patientId?.name || 'Patient',
      time: new Date(a.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: a.title || (a.mode === 'Virtual' ? 'Virtual Visit' : 'Appointment'),
      urgent: a.notes?.toLowerCase().includes('urgent') || false,
    }));
  }, [todaysAppts]);

  const recentAlerts = useMemo(() => {
    const list = Array.isArray(alerts) ? alerts : [];
    return list.slice(0, 5).map((al: any) => ({
      message: al.title || al.message || 'Alert',
      priority: (al.priority || (al.status === 'OPEN' ? 'high' : 'low')).toString().toLowerCase(),
      time: new Date(al.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [alerts]);

  // Realtime updates for appointments and alerts
  useEffect(() => {
    const handlers: Array<[string, (...args: any[]) => void]> = [
      ['appointment:new', () => refetchAppts()],
      ['appointment:updated', () => refetchAppts()],
      ['appointment:deleted', () => refetchAppts()],
      ['alert:new', () => refetchAlerts()],
      ['alert:updated', () => refetchAlerts()],
    ];
    handlers.forEach(([e, h]) => on?.(e, h));
    return () => handlers.forEach(([e, h]) => off?.(e, h));
  }, [on, off, refetchAppts, refetchAlerts]);

  // If patients list loads and no selection, preselect first patient
  useEffect(() => {
    if (!selectedPatientId && Array.isArray(patients) && patients.length > 0) {
      const first = patients[0];
      const id = first._id || first.id;
      setSelectedPatientId(id);
      try { localStorage.setItem('viewPatientId', id); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  // Load lab reports
  useEffect(() => {
    loadLabReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLabReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${backendUrl}/api/lab/reports?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setLabReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      console.error('Failed to load lab reports', err);
      toast({
        title: "Error",
        description: "Failed to load lab reports",
        variant: "destructive"
      });
      setLabReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDownloadReport = async (report: LabReport) => {
    if (!report.fileUrl) {
      toast({
        title: "Error",
        description: "Report file not available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const res = await fetch(`${backendUrl}/api/lab/reports/${report._id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName || 'lab-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: any }> = {
      Pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      Processed: { className: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
      Reviewed: { className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      Archived: { className: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText }
    };
    const config = variants[status] || variants.Pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      Routine: 'bg-gray-100 text-gray-800 border-gray-300',
      Urgent: 'bg-orange-100 text-orange-800 border-orange-300',
      STAT: 'bg-red-100 text-red-800 border-red-300'
    };
    return <Badge className={`${variants[priority] || ''} border`}>{priority}</Badge>;
  };

  const filteredReports = useMemo(() => {
    return labReports.filter(r => {
      // Search filter
      if (reportSearchQuery) {
        const search = reportSearchQuery.toLowerCase();
        const patientName = typeof r.patientId === 'object' ? r.patientId.name : '';
        const match = r.testName.toLowerCase().includes(search) ||
                      patientName.toLowerCase().includes(search) ||
                      r.reportType?.toLowerCase().includes(search);
        if (!match) return false;
      }
      
      // Status filter
      if (reportStatusFilter !== 'all' && r.status !== reportStatusFilter) {
        return false;
      }
      
      return true;
    });
  }, [labReports, reportSearchQuery, reportStatusFilter]);

  // If patients list loads and no selection, preselect first patient
  useEffect(() => {
    if (!selectedPatientId && Array.isArray(patients) && patients.length > 0) {
      const first = patients[0];
      const id = first._id || first.id;
      setSelectedPatientId(id);
      try { localStorage.setItem('viewPatientId', id); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Good {new Date().getHours() < 12 ? 'morning' : (new Date().getHours() < 18 ? 'afternoon' : 'evening')}, Dr. {(me as any)?.name || localStorage.getItem('userName') || 'Doctor'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Button className="btn-medical" onClick={() => navigate('/dashboard/doctor/appointments')}>
            New Appointment
          </Button>
          <Button variant="outline" className="border-primary/20" onClick={() => navigate('/dashboard/doctor/calendar')}>
            View Schedule
          </Button>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPatientId || ''}
              onChange={(e) => {
                const v = e.target.value || null;
                setSelectedPatientId(v);
                try {
                  if (v) localStorage.setItem('viewPatientId', v); else localStorage.removeItem('viewPatientId');
                } catch {}
              }}
              className="medical-input h-9"
              aria-label="Select patient to view"
            >
              <option value="">Select patient</option>
              {(Array.isArray(patients) ? patients : []).map((p: any) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name || p.displayName || p.email}</option>
              ))}
            </select>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedPatientId(null); try { localStorage.removeItem('viewPatientId'); } catch {} }}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {todayStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            icon={<stat.icon className={`h-5 w-5 ${stat.color}`} />}
            label={stat.title}
            value={stat.value}
            progress={stat.title === 'Hours Scheduled' ? Math.min(100, Math.round((Number(hoursScheduled) / 8) * 100)) : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <LineMini title="Appointments (last 7 days)" data={apptTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appointment, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                appointment.urgent ? 'border-l-4 border-destructive bg-destructive/5' : 'bg-muted/20'
              }`}>
                <div>
                  <p className="font-medium text-foreground">{appointment.patient}</p>
                  <p className="text-sm text-muted-foreground">{appointment.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{appointment.time}</p>
                  {appointment.urgent && (
                    <span className="text-xs text-destructive font-medium">Urgent</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Alerts</CardTitle>
            <CardDescription>Important notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.priority === 'high' ? 'bg-destructive' :
                  alert.priority === 'medium' ? 'bg-orange-500' : 'bg-secondary'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                      alert.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-secondary/10 text-secondary'
                    }`}>
                      {alert.priority} priority
                    </span>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Lab Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="medical-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Lab Reports
                </CardTitle>
                <CardDescription>View and download lab reports uploaded by Lab</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient or test..."
                    className="pl-8"
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Reviewed">Reviewed</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {reportSearchQuery || reportStatusFilter !== 'all' 
                  ? 'No reports match your filters' 
                  : 'No lab reports available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.slice(0, 10).map((report) => (
                    <TableRow 
                      key={report._id}
                      className={selectedReport?._id === report._id ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">
                        {typeof report.patientId === 'object' ? (
                          <div>
                            <div>{report.patientId.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.patientId.gender && `${report.patientId.gender}`}
                              {report.patientId.age && `, ${report.patientId.age}y`}
                            </div>
                          </div>
                        ) : (
                          report.patientId
                        )}
                      </TableCell>
                      <TableCell>{report.testName}</TableCell>
                      <TableCell>
                        {report.reportType ? (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {report.reportType}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(report.date || report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                            disabled={!report.fileUrl}
                            title="Download report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {filteredReports.length > 10 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/doctor/records?type=lab%20results')}
                >
                  View All Reports ({filteredReports.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Details / AI Analysis Panel */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">Report Details</CardTitle>
            <CardDescription className="text-xs">
              {selectedReport ? 'AI-extracted insights' : 'Select a report to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedReport ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No report selected</p>
                <p className="text-xs mt-1">Click on a report to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Patient Info */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Patient</p>
                  <p className="font-semibold">
                    {typeof selectedReport.patientId === 'object' 
                      ? selectedReport.patientId.name 
                      : selectedReport.patientId}
                  </p>
                  {typeof selectedReport.patientId === 'object' && (
                    <p className="text-xs text-muted-foreground">
                      {selectedReport.patientId.gender} • {selectedReport.patientId.age}y
                    </p>
                  )}
                </div>

                {/* Test Info */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Test Name</p>
                  <p className="font-medium">{selectedReport.testName}</p>
                </div>

                {selectedReport.reportType && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Report Type</p>
                    <p className="text-sm">{selectedReport.reportType}</p>
                  </div>
                )}

                {/* Status & Priority */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    {getPriorityBadge(selectedReport.priority)}
                  </div>
                </div>

                {/* Remarks */}
                {selectedReport.remarks && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{selectedReport.remarks}</p>
                  </div>
                )}

                {/* AI Extracted Results */}
                {selectedReport.extractedResults ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI-Extracted Results</p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                      {Object.entries(selectedReport.extractedResults).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-blue-900">{key}:</span>{' '}
                          <span className="text-blue-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Pending OCR</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      AI analysis is being processed. Results will appear here soon.
                    </p>
                  </div>
                )}

                {/* Uploaded By */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Uploaded by:{' '}
                    <span className="font-medium">
                      {typeof selectedReport.uploadedBy === 'object' 
                        ? selectedReport.uploadedBy.name 
                        : 'Lab'}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadReport(selectedReport)}
                    disabled={!selectedReport.fileUrl}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Frequently used tools and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Patient Records", color: "bg-primary", to: "/dashboard/doctor/records" },
              { label: "Prescriptions", color: "bg-secondary", to: "/dashboard/doctor/prescriptions" },
              { label: "Lab Results", color: "bg-medical-healing", to: "/dashboard/doctor/records?type=lab%20results" },
              { label: "Referrals", color: "bg-accent", to: "/dashboard/doctor/patients?filter=referrals" },
            ].map((action) => (
              <Button 
                key={action.label}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-border hover:bg-muted/50"
                onClick={() => navigate(action.to)}
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} mb-2`} />
                <span className="text-sm text-foreground">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};