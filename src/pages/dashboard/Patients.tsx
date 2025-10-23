import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, UserPlus, Phone, Mail, Calendar, FileText, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePatientsQuery, useUserProfile } from "@/hooks/useApi";
import { apiRequest } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState<{ name: string; status: string; priority: string; roomNumber?: string; phone?: string; email?: string }>({ name: "", status: "Active", priority: "Medium" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ name?: string; status?: string; priority?: string; roomNumber?: string; phone?: string; email?: string; condition?: string }>({});
  const { data: me } = useUserProfile();
  const { toast } = useToast();

  // Debounce search to reduce API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Map UI status (lowercase) to backend values (capitalized)
  const statusParam = filterStatus !== 'all' ? (filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)) : undefined;

  const { data, loading, error, refetch } = usePatientsQuery({ q: debouncedSearch || undefined, status: statusParam, priority: priority !== 'all' ? priority : undefined });

  // Normalize API data to UI shape; backend exposes: _id, name, status
  const patients = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((p: any) => ({
      id: p._id,
      name: p.name || 'Unknown',
      age: p.age,
      gender: p.gender,
      condition: p.condition || p.status || "Unknown",
      lastVisit: p.lastVisit,
      nextAppointment: p.nextAppointment,
      status: p.status || "Active",
      priority: p.priority || "Medium",
      phone: p.phone,
      email: p.email,
      avatar: p.avatar || "/placeholder-avatar.jpg",
      roomNumber: p.roomNumber || "N/A",
      assignedDoctorId: p.assignedDoctorId,
    }));
  }, [data]);

  const filteredPatients = patients; // server-side filtered via usePatientsQuery

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Discharged": return "bg-blue-100 text-blue-700";
      case "Critical": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load patients</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">Manage and monitor patient care</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setCreating(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline Add Patient Form */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Full name" value={newPatient.name} onChange={(e) => setNewPatient(v => ({ ...v, name: e.target.value }))} />
              <Input placeholder="Email" value={newPatient.email || ''} onChange={(e) => setNewPatient(v => ({ ...v, email: e.target.value }))} />
              <Input placeholder="Phone" value={newPatient.phone || ''} onChange={(e) => setNewPatient(v => ({ ...v, phone: e.target.value }))} />
              <Input placeholder="Room Number" value={newPatient.roomNumber || ''} onChange={(e) => setNewPatient(v => ({ ...v, roomNumber: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Select value={newPatient.status} onValueChange={(v) => setNewPatient(s => ({ ...s, status: v }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newPatient.priority} onValueChange={(v) => setNewPatient(s => ({ ...s, priority: v }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!newPatient.name.trim()}
                onClick={async () => {
                  await apiRequest('/api/patients', { method: 'POST', body: JSON.stringify(newPatient) });
                  setCreating(false);
                  setNewPatient({ name: '', status: 'Active', priority: 'Medium' });
                  refetch();
                }}
              >Save</Button>
              <Button variant="outline" onClick={() => { setCreating(false); setNewPatient({ name: '', status: 'Active', priority: 'Medium' }); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{patients.filter(p => (p.status || '').toLowerCase() === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{patients.filter(p => (p.condition || '').toLowerCase() === 'critical').length}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.filter(p => !!p.nextAppointment).length}</p>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback>{(patient.name || 'U N').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    {editingId === patient.id ? (
                      <Input
                        value={editingValues.name ?? patient.name}
                        onChange={(e) => setEditingValues(v => ({ ...v, name: e.target.value }))}
                        className="font-semibold text-lg"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patient.age && patient.gender ? (
                        <span>{patient.age} years old • {patient.gender}</span>
                      ) : null}
                      <span>Room {editingId === patient.id ? (
                        <Input
                          value={editingValues.roomNumber ?? patient.roomNumber ?? ''}
                          onChange={(e) => setEditingValues(v => ({ ...v, roomNumber: e.target.value }))}
                          className="h-7 w-32"
                        />
                      ) : (patient.roomNumber || 'N/A')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {editingId === patient.id ? (
                    <Select value={editingValues.priority ?? patient.priority} onValueChange={(v) => setEditingValues(val => ({ ...val, priority: v }))}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getPriorityColor(patient.priority) as any}>
                      {patient.priority}
                    </Badge>
                  )}
                  {editingId === patient.id ? (
                    <Select value={editingValues.status ?? patient.status} onValueChange={(v) => setEditingValues(val => ({ ...val, status: v }))}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Discharged">Discharged</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Condition</p>
                  {editingId === patient.id ? (
                    <Input
                      value={editingValues.condition ?? patient.condition ?? ''}
                      onChange={(e) => setEditingValues(v => ({ ...v, condition: e.target.value }))}
                    />
                  ) : (
                    <p className="font-semibold">{patient.condition}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                  <p className="font-semibold">{patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
                  <p className="font-semibold">{patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {editingId === patient.id ? (
                      <Input
                        value={editingValues.phone ?? patient.phone ?? ''}
                        onChange={(e) => setEditingValues(v => ({ ...v, phone: e.target.value }))}
                        className="h-7"
                      />
                    ) : (
                      <span>{patient.phone || 'N/A'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {editingId === patient.id ? (
                      <Input
                        value={editingValues.email ?? patient.email ?? ''}
                        onChange={(e) => setEditingValues(v => ({ ...v, email: e.target.value }))}
                        className="h-7"
                      />
                    ) : (
                      <span>{patient.email || 'N/A'}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingId === patient.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await apiRequest(`/api/patients/${patient.id}`, { method: 'PUT', body: JSON.stringify(editingValues) });
                        setEditingId(null);
                        setEditingValues({});
                        refetch();
                      }}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditingValues({}); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(patient.id); setEditingValues({}); }}>
                        Edit
                      </Button>
                      {(me?.role === 'admin' || (me?.role === 'doctor' && patient.assignedDoctorId && String(patient.assignedDoctorId) === String(me?._id))) && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const ok = window.confirm(`Delete patient "${patient.name}"? This action cannot be undone.`);
                        if (!ok) return;
                        try {
                          await apiRequest(`/api/patients/${patient.id}`, { method: 'DELETE' });
                          toast({ title: 'Patient deleted', description: `${patient.name} was removed.` });
                          refetch();
                        } catch (e: any) {
                          toast({ title: 'Failed to delete patient', description: e?.message || 'Please try again.', variant: 'destructive' });
                        }
                      }}>
                        Delete
                      </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No patients found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};