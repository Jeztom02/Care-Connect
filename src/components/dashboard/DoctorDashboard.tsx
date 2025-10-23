import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppointments, usePatients, useAlerts, useUserProfile } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";
import { StatCard } from "@/components/ui/StatCard";
import { LineMini } from "@/components/charts/LineMini";

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { data: me } = useUserProfile();
  const { data: appts, refetch: refetchAppts } = useAppointments('doctor');
  const { data: patients, refetch: refetchPatients } = usePatients();
  const { data: alerts, refetch: refetchAlerts } = useAlerts();
  const { on, off } = useSocket();

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Good {new Date().getHours() < 12 ? 'morning' : (new Date().getHours() < 18 ? 'afternoon' : 'evening')}, Dr. {(me as any)?.name || localStorage.getItem('userName') || 'Doctor'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="btn-medical" onClick={() => navigate('/dashboard/doctor/appointments')}>
            New Appointment
          </Button>
          <Button variant="outline" className="border-primary/20" onClick={() => navigate('/dashboard/doctor/calendar')}>
            View Schedule
          </Button>
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