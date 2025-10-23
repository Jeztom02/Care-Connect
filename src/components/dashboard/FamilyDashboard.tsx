import { UserCheck, Heart, Calendar, AlertTriangle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const FamilyDashboard = () => {
  const statusStats = [
    { title: "Patient Status", value: "Stable", icon: UserCheck, color: "text-secondary" },
    { title: "Care Updates", value: "3 Today", icon: Heart, color: "text-primary" },
    { title: "Next Appointment", value: "Tomorrow", icon: Calendar, color: "text-medical-healing" },
    { title: "Alerts", value: "1 New", icon: AlertTriangle, color: "text-orange-500" },
  ];

  const careUpdates = [
    { 
      update: "Morning vitals taken - all normal", 
      provider: "Nurse Jennifer", 
      time: "8:30 AM", 
      type: "routine",
      details: "Blood pressure: 120/80, Temperature: 98.6°F"
    },
    { 
      update: "Medication administered successfully", 
      provider: "Nurse Michael", 
      time: "12:00 PM", 
      type: "medication",
      details: "Afternoon dose of prescribed medication completed"
    },
    { 
      update: "Doctor visit completed", 
      provider: "Dr. Sarah Johnson", 
      time: "2:30 PM", 
      type: "visit",
      details: "Routine check-up, patient responding well to treatment"
    },
  ];

  const upcomingEvents = [
    { event: "Cardiology Consultation", doctor: "Dr. Sarah Johnson", date: "Tomorrow", time: "2:00 PM" },
    { event: "Physical Therapy", provider: "PT Lisa Chen", date: "Thursday", time: "10:00 AM" },
    { event: "Follow-up Blood Work", provider: "Lab Team", date: "Friday", time: "9:00 AM" },
  ];

  const emergencyContacts = [
    { role: "Primary Doctor", name: "Dr. Sarah Johnson", phone: "(555) 123-4567" },
    { role: "Nurse Station", name: "ICU Desk", phone: "(555) 123-4568" },
    { role: "Hospital Main", name: "General Hospital", phone: "(555) 123-4500" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Family Care Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitoring care for your loved one - {localStorage.getItem('userName') || 'Family Member'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="btn-medical">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Care Team
          </Button>
          <Button variant="outline" className="border-primary/20">
            Emergency Call
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusStats.map((stat, index) => (
          <Card key={stat.title} className="medical-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Care Updates */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Today's Care Updates
            </CardTitle>
            <CardDescription>Real-time updates from the care team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careUpdates.map((update, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/20 border-l-4 border-l-primary/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{update.update}</p>
                    <p className="text-sm text-muted-foreground mt-1">{update.details}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">{update.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">by {update.provider}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    update.type === 'routine' ? 'bg-secondary/20 text-secondary' :
                    update.type === 'medication' ? 'bg-primary/20 text-primary' :
                    'bg-medical-healing/20 text-medical-healing'
                  }`}>
                    {update.type}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-healing" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Scheduled care activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{event.event}</p>
                  <p className="text-sm text-muted-foreground">{event.provider || event.doctor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{event.date}</p>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>Quick access to care team contacts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-destructive/5 transition-colors group">
                <div>
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary">{contact.phone}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 transition-opacity border-primary/20 hover:bg-primary hover:text-primary-foreground"
                  >
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground">Family Care Tools</CardTitle>
            <CardDescription>Quick access to family support features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Visit Schedule", color: "bg-primary" },
                { label: "Care Notes", color: "bg-secondary" },
                { label: "Photo Updates", color: "bg-medical-healing" },
                { label: "Questions", color: "bg-accent" },
              ].map((action, index) => (
                <Button 
                  key={action.label}
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-border hover:bg-muted/50"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} mb-2`} />
                  <span className="text-sm text-foreground">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};