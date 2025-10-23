import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useVolunteerTasks } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface VolunteerTasksProps {
  userRole: string;
}

export const VolunteerTasks = ({ userRole }: VolunteerTasksProps) => {
  const { data: tasks, loading, error, refetch } = useVolunteerTasks();
  const { toast } = useToast();

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

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      // TODO: Implement actual task action API call
      toast({
        title: "Task Updated",
        description: `Task ${action} successfully.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load tasks</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assigned Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Your volunteer tasks and assignments
          </p>
        </div>
        <Button className="btn-medical">
          <ClipboardList className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {tasks && tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any tasks assigned at the moment.
            </p>
            <Button>
              <ClipboardList className="h-4 w-4 mr-2" />
              Request Tasks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tasks?.map((task: any) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{task.patient}</p>
                    <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
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
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-primary">{task.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTaskAction(task.id, 'started')}
                      >
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleTaskAction(task.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};















