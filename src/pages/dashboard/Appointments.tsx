import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User, Plus, Filter, Video, Phone, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppointments, usePatientUsers, useUsersByRole } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Inline modal component props and implementation moved above to avoid TSX parser confusion
interface CreateAppointmentInlineProps {
  open: boolean;
  onClose: () => void;
  form: any;
  setForm: (updater: any) => void;
  patients: any[];
  patientsLoading?: boolean;
  onCreate: () => void;
  userRole: string;
  doctors?: any[];
  doctorsLoading?: boolean;
}

export function CreateAppointmentInline({ open, onClose, form, setForm, patients, patientsLoading, onCreate, userRole, doctors, doctorsLoading }: CreateAppointmentInlineProps) {
  const [selectOpen, setSelectOpen] = useState(false);
  useEffect(() => {
    if (open) setSelectOpen(true);
  }, [open]);
  if (!open) return null;
  
  const isPatient = userRole === 'patient';
  const selectList = isPatient ? (doctors || []) : patients;
  const selectLoading = isPatient ? doctorsLoading : patientsLoading;
  const selectLabel = isPatient ? 'Select doctor' : 'Select patient';
  const emptyMessage = isPatient ? 'No doctors found' : 'No patients found';
  const formKey = isPatient ? 'doctorId' : 'patientId';
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>New Appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Select open={selectOpen} onOpenChange={setSelectOpen} value={form[formKey]} onValueChange={(v) => { setForm((f: any) => ({ ...f, [formKey]: v })); setSelectOpen(false); }}>
            <SelectTrigger><SelectValue placeholder={selectLabel} /></SelectTrigger>
            <SelectContent>
              {selectLoading ? (
                <SelectItem value="loading" disabled>
                  Loading {isPatient ? 'doctors' : 'patients'}...
                </SelectItem>
              ) : selectList.length === 0 ? (
                <SelectItem value="empty" disabled>
                  {emptyMessage}
                </SelectItem>
              ) : (
                selectList.map((item: any) => (
                  <SelectItem key={item._id} value={item._id}>
                    {isPatient ? (
                      `${item.name || 'Unknown'}${item.specialization ? ` – ${item.specialization}` : ''}`
                    ) : (
                      `${(item.firstName || item.lastName ? `${[item.firstName, item.lastName].filter(Boolean).join(' ')}` : item.name)}${item.roomNumber ? ` (Room ${item.roomNumber})` : item._id ? ` (${String(item._id).slice(-6)})` : ''}`
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Input placeholder="Title (optional)" value={form.title || ''} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input type="datetime-local" value={form.startsAt || ''} onChange={(e) => setForm((f: any) => ({ ...f, startsAt: e.target.value, endsAt: undefined }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={form.mode || 'In-person'} onValueChange={(v) => setForm((f: any) => ({ ...f, mode: v }))}>
            <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="In-person">In-person</SelectItem>
              <SelectItem value="Virtual">Virtual</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Location (Room or 'Video Call')" value={form.location || ''} onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))} />
          <Input placeholder="Notes (optional)" value={form.notes || ''} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreate}>Create</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AppointmentsProps {
  userRole: string;
}

export function Appointments({ userRole }: AppointmentsProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const { data: apptsData, loading, error, refetch } = useAppointments(userRole);
  const { toast } = useToast();
  const { on, off } = useSocket();
  const { data: patientsData, loading: patientsLoading } = usePatientUsers();
  const { data: doctorsData, loading: doctorsLoading } = useUsersByRole('doctor');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ patientId?: string; doctorId?: string; title?: string; startsAt?: string; endsAt?: string; mode?: string; location?: string; notes?: string }>({ mode: 'In-person' });
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<{ startsAt?: string; endsAt?: string; status?: string }>({});

  // Realtime refresh
  useEffect(() => {
    const handlers: Array<[string, () => void]> = [
      ['appointment:new', () => refetch()],
      ['appointment:updated', () => refetch()],
      ['appointment:deleted', () => refetch()],
    ];
    handlers.forEach(([e, h]) => on?.(e, h));
    return () => handlers.forEach(([e, h]) => off?.(e, h));
  }, [on, off, refetch]);

  const displayAppointments = useMemo(() => {
    try {
      const list = Array.isArray(apptsData) ? apptsData : [];
      const normalized = list.map((a: any) => ({
        _id: a?._id ?? String(Math.random()),
        title: a?.title || 'Medical Appointment',
        patient: a?.patientId?.name || 'Unknown Patient',
        doctor: a?.doctor || undefined,
        startsAt: a?.startsAt ?? '',
        endsAt: a?.endsAt ?? '',
        status: a?.status || 'SCHEDULED',
        location: a?.location || (a?.mode === 'Virtual' ? 'Video Call' : 'Room'),
        notes: a?.notes || '',
      }));
      const filtered = filterStatus === 'all' ? normalized : normalized.filter((a: any) => String(a.status || '').toLowerCase() === filterStatus.toLowerCase());
      return filtered;
    } catch (e) {
      console.error('[Appointments] normalize error', e);
      return [] as any[];
    }
  }, [apptsData, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-green-100 text-green-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (location: string) => {
    return location === "Video Call" ? Video : MapPin;
  };

  // Metrics must be computed before any early return to keep hooks order consistent
  const metrics = useMemo(() => {
    const list = Array.isArray(apptsData) ? (apptsData as any[]) : [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    // Set to Monday
    const day = startOfWeek.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day; // make Monday 1
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const inThisWeek = list.filter((a: any) => {
      const s = new Date(a.startsAt);
      return s >= startOfWeek && s < endOfWeek;
    });

    const confirmed = list.filter((a: any) => String(a.status || '').toUpperCase() === 'SCHEDULED');
    const pending = list.filter((a: any) => !a.status || String(a.status).toUpperCase() === 'PENDING');
    const virtual = list.filter((a: any) => (String(a.mode || '').toLowerCase() === 'virtual') || (String(a.location || '').toLowerCase().includes('video')));

    return {
      thisWeek: inThisWeek.length,
      confirmed: confirmed.length,
      pending: pending.length,
      virtual: virtual.length,
    };
  }, [apptsData]);

  const formatAppointmentTime = (startsAt: string, endsAt?: string) => {
    const start = new Date(startsAt);
    let end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 30 * 60 * 1000);
    if (isNaN(end.getTime())) {
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }
    const duration = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));

    return {
      date: isNaN(start.getTime()) ? '' : start.toLocaleDateString(),
      time: isNaN(start.getTime()) ? '' : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${duration} min`
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load appointments</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  // (moved above)

  return (
    <ErrorBoundary fallback={
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold text-destructive mb-2">Appointments failed to load</h2>
        <p className="text-muted-foreground mb-4">Please try again. If the problem persists, contact support.</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    }>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            {userRole === 'patient' ? 'Your upcoming appointments' : 'Manage patient appointments'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Appointment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Inline */}
      <CreateAppointmentInline
        open={creating}
        onClose={() => setCreating(false)}
        form={form}
        setForm={setForm}
        patients={Array.isArray(patientsData) ? (patientsData as any[]) : []}
        patientsLoading={!!patientsLoading}
        userRole={userRole}
        doctors={Array.isArray(doctorsData) ? (doctorsData as any[]) : []}
        doctorsLoading={!!doctorsLoading}
        onCreate={async () => {
          try {
            const isPatient = userRole === 'patient';
            const requiredField = isPatient ? form.doctorId : form.patientId;
            const fieldName = isPatient ? 'Doctor' : 'Patient';
            
            if (!requiredField || !form.startsAt) {
              toast({ title: 'Missing required fields', description: `${fieldName} and start time are required`, variant: 'destructive' });
              return;
            }
            // Auto-calculate endsAt if not provided (default 30 minutes)
            let payload = { ...form } as any;
            if (!payload.endsAt && payload.startsAt) {
              const start = new Date(payload.startsAt);
              const end = new Date(start.getTime() + 30 * 60 * 1000);
              payload.endsAt = end.toISOString();
            }
            const payloadMode = form.mode === 'Virtual' || form.mode === 'In-person' ? form.mode : 'In-person';
            const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/appointments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
              body: JSON.stringify({ ...payload, mode: payloadMode }),
            });
            if (!resp.ok) throw new Error('Failed to create');
            setCreating(false);
            setForm({ mode: 'In-person' });
            refetch();
            toast({ title: 'Appointment created' });
          } catch (e) {
            toast({ title: 'Failed to create appointment', variant: 'destructive' });
          }
        }}
      />

      {/* Appointment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.thisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.confirmed}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{metrics.virtual}</p>
                <p className="text-sm text-muted-foreground">Virtual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <div className="grid gap-4">
        {displayAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
              <p className="text-muted-foreground mb-4">
                {userRole === 'patient' 
                  ? "You don't have any appointments scheduled yet." 
                  : "No appointments have been scheduled."}
              </p>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          displayAppointments.map((appointment) => {
            const TypeIcon = getTypeIcon(appointment.location || "Room");
            const timeInfo = formatAppointmentTime(appointment.startsAt, appointment.endsAt);
            const isVirtual = appointment.location === "Video Call";
            return (
              <div key={appointment._id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <TypeIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.title || 'Medical Appointment'}</h3>
                          <p className="text-muted-foreground">
                            {userRole === 'patient' ? `with ${appointment.doctor || 'Healthcare Provider'}` : `Patient: ${appointment.patient || 'Unknown Patient'}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{timeInfo.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{timeInfo.time} ({timeInfo.duration})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{appointment.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{isVirtual ? 'Virtual' : 'In-person'}</span>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Notes:</p>
                        <p className="text-sm">{appointment.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {isVirtual && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      )}
                      {userRole !== 'patient' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setReschedulingId(String(appointment._id)); setRescheduleForm({ startsAt: appointment.startsAt, endsAt: appointment.endsAt, status: appointment.status }); }}>Reschedule</Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/appointments/${appointment._id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
                              toast({ title: 'Appointment cancelled' });
                              refetch();
                            } catch (e) {
                              toast({ title: 'Failed to cancel appointment', variant: 'destructive' });
                            }
                          }}>Cancel</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {reschedulingId === String(appointment._id) && (
                  <Card className="mt-2">
                    <CardHeader>
                      <CardTitle>Reschedule Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input type="datetime-local" value={rescheduleForm.startsAt || ''} onChange={(e) => setRescheduleForm(f => ({ ...f, startsAt: e.target.value }))} />
                        <Input type="datetime-local" value={rescheduleForm.endsAt || ''} onChange={(e) => setRescheduleForm(f => ({ ...f, endsAt: e.target.value }))} />
                        <Select value={rescheduleForm.status || appointment.status} onValueChange={(v) => setRescheduleForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async () => {
                          try {
                            const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/appointments/${appointment._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                              body: JSON.stringify(rescheduleForm),
                            });
                            if (!resp.ok) throw new Error('Failed');
                            setReschedulingId(null);
                            setRescheduleForm({});
                            refetch();
                            toast({ title: 'Appointment updated' });
                          } catch {
                            toast({ title: 'Failed to update appointment', variant: 'destructive' });
                          }
                        }}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setReschedulingId(null); setRescheduleForm({}); }}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
    </ErrorBoundary>
  );

}