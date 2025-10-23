import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, CheckCircle } from "lucide-react";

export const Rounds = () => {
  // No backend endpoint exists yet for rounds; display empty state with future hook placeholder
  const rounds: Array<{ id: string; patient?: string; room?: string; time?: string; status?: string; notes?: string }> = [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nursing Rounds</h1>
          <p className="text-muted-foreground">Track patient rounds and checkups</p>
        </div>
      </div>

      <div className="grid gap-4">
        {rounds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No rounds scheduled yet.</p>
              <p className="text-sm text-muted-foreground mt-1">This section will update automatically when rounds data is available from the backend.</p>
              <div className="mt-4">
                <Button size="sm" variant="outline">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};