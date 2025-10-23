import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Plus, Loader2 } from "lucide-react";
import { useVolunteerPatientSupport } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface VolunteerPatientSupportProps {
  userRole: string;
}

export const VolunteerPatientSupport = ({ userRole }: VolunteerPatientSupportProps) => {
  const { data: updates, loading, error, refetch } = useVolunteerPatientSupport();
  const { toast } = useToast();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "companionship": return "bg-blue-100 text-blue-700";
      case "nutrition": return "bg-green-100 text-green-700";
      case "transport": return "bg-purple-100 text-purple-700";
      case "medical": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleAddUpdate = async () => {
    try {
      // TODO: Implement actual add update API call
      toast({
        title: "Update Added",
        description: "Patient support update has been recorded.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add update. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patient support updates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load updates</h2>
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
          <h1 className="text-3xl font-bold text-foreground">Patient Support Updates</h1>
          <p className="text-muted-foreground mt-1">
            Track your interactions and support provided to patients
          </p>
        </div>
        <Button className="btn-medical" onClick={handleAddUpdate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Update
        </Button>
      </div>

      {updates && updates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No updates yet</h3>
            <p className="text-muted-foreground mb-4">
              Start providing patient support to see your updates here.
            </p>
            <Button onClick={handleAddUpdate}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Update
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {updates?.map((update: any) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{update.patient}</h3>
                      <Badge variant="outline" className={getTypeColor(update.type)}>
                        {update.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{update.update}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">{update.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Support interaction</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Companionship", color: "bg-blue-500", type: "companionship" },
              { label: "Meal Assistance", color: "bg-green-500", type: "nutrition" },
              { label: "Transport Help", color: "bg-purple-500", type: "transport" },
              { label: "Medical Support", color: "bg-red-500", type: "medical" },
            ].map((action) => (
              <Button 
                key={action.label}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center border-border hover:bg-muted/50"
                onClick={() => handleAddUpdate()}
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















