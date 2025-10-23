import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAppointments } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";

interface CalendarProps {
  userRole: string;
}

export const Calendar = ({ userRole }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data, loading, error, refetch } = useAppointments(userRole);
  const { on, off } = useSocket();

  useEffect(() => {
    const handlers: Array<[string, () => void]> = [
      ['appointment:new', () => refetch()],
      ['appointment:updated', () => refetch()],
      ['appointment:deleted', () => refetch()],
    ];
    handlers.forEach(([e, h]) => on?.(e, h));
    return () => handlers.forEach(([e, h]) => off?.(e, h));
  }, [on, off, refetch]);

  const appointments = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((a: any) => {
      const start = new Date(a.startsAt);
      const end = new Date(a.endsAt);
      const durationMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
      return {
        id: String(a._id),
        title: a.title || 'Medical Appointment',
        patient: a.patientId?.name || 'Patient',
        doctor: a.doctor || undefined,
        location: a.location || (a.mode === 'Virtual' ? 'Video Call' : 'Room'),
        mode: a.mode || 'In-person',
        status: a.status || 'SCHEDULED',
        date: new Date(start),
        timeStr: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationStr: `${durationMin} min`,
      };
    });
  }, [data]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const hasAppointment = appointments.some(apt => 
        apt.date.toDateString() === date.toDateString()
      );
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-colors relative
            ${isSelected 
              ? "bg-primary text-primary-foreground" 
              : isToday
                ? "bg-muted text-foreground font-bold"
                : "hover:bg-muted text-foreground"
            }
          `}
        >
          {day}
          {hasAppointment && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-medical-trust rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  const getTodaysAppointments = () => {
    return appointments.filter(apt => apt.date.toDateString() === selectedDate.toDateString());
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(apt => apt.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Manage your appointments and schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading calendar…</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-destructive">{error}</div>
            ) : null}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>

        {/* Appointments Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getTodaysAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getTodaysAppointments().map(appointment => (
                    <div key={appointment.id} className="p-3 border border-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{appointment.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {appointment.mode}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.timeStr} ({appointment.durationStr})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{appointment.patient || appointment.doctor || 'Patient'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No appointments scheduled for this day.</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingAppointments().map(appointment => (
                  <div key={appointment.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{appointment.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {appointment.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{appointment.timeStr} • {appointment.patient || appointment.doctor || 'Patient'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};