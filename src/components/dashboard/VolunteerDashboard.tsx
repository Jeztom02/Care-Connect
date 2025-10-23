import { Heart, ClipboardList, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const VolunteerDashboard = () => {
  const volunteerStats = [
    { title: "Assigned Tasks", value: "8", icon: ClipboardList, color: "text-primary" },
    { title: "Completed Today", value: "5", icon: CheckCircle, color: "text-secondary" },
    { title: "Patients Helped", value: "12", icon: Heart, color: "text-medical-healing" },
    { title: "Hours Volunteered", value: "24", icon: Clock, color: "text-accent" },
  ];

  const assignedTasks = [
    { 
      task: "Companion visit with Mrs. Johnson", 
      patient: "Room 201 - Mrs. Johnson", 
      time: "10:00 AM", 
      status: "completed",
      priority: "medium",
      description: "Provide companionship and assist with reading"
    },
    { 
      task: "Meal assistance for Mr. Davis", 
      patient: "Room 203 - Mr. Davis", 
      time: "12:00 PM", 
      status: "in-progress",
      priority: "high",
      description: "Help with lunch and ensure proper nutrition"
    },
    { 
      task: "Wheelchair transport to therapy", 
      patient: "Room 205 - Ms. Chen", 
      time: "2:00 PM", 
      status: "pending",
      priority: "medium",
      description: "Transport patient to physical therapy session"
    },
    { 
      task: "Reading session with children's ward", 
      patient: "Pediatric Ward", 
      time: "3:30 PM", 
      status: "pending",
      priority: "low",
      description: "Read stories to pediatric patients"
    },
  ];

  const patientUpdates = [
    { 
      patient: "Mrs. Johnson", 
      update: "Had a wonderful conversation about her grandchildren", 
      time: "10:30 AM",
      type: "companionship"
    },
    { 
      patient: "Mr. Davis", 
      update: "Ate 80% of his lunch with assistance", 
      time: "12:45 PM",
      type: "nutrition"
    },
    { 
      patient: "Ms. Chen", 
      update: "Expressed gratitude for the transport assistance", 
      time: "2:15 PM",
      type: "transport"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-orange-100 text-orange-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Volunteer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {localStorage.getItem('userName') || 'Volunteer'} - Making a difference in patient care
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="btn-medical">
            <Heart className="h-4 w-4 mr-2" />
            Start New Task
          </Button>
          <Button variant="outline" className="border-primary/20">
            View Schedule
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {volunteerStats.map((stat, index) => (
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
        {/* Assigned Tasks */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Today's Tasks
            </CardTitle>
            <CardDescription>Your assigned volunteer tasks for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedTasks.map((task, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/20 border-l-4 border-l-primary/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{task.task}</h4>
                    <p className="text-sm text-muted-foreground">{task.patient}</p>
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority} priority
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{task.time}</span>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Patient Support Updates */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-secondary" />
              Patient Support Updates
            </CardTitle>
            <CardDescription>Recent interactions and patient feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientUpdates.map((update, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{update.patient}</h4>
                    <p className="text-sm text-muted-foreground">{update.update}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">{update.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {update.type}
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="text-foreground">Volunteer Tools</CardTitle>
          <CardDescription>Quick access to volunteer resources and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Patient Visits", color: "bg-primary", icon: Users },
              { label: "Meal Assistance", color: "bg-secondary", icon: Heart },
              { label: "Transport Help", color: "bg-medical-healing", icon: Clock },
              { label: "Emergency Support", color: "bg-destructive", icon: AlertCircle },
            ].map((action, index) => (
              <Button 
                key={action.label}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-border hover:bg-muted/50"
              >
                <action.icon className={`h-6 w-6 mb-2 ${action.color.replace('bg-', 'text-')}`} />
                <span className="text-sm text-foreground">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};















