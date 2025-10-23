import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Wifi } from "lucide-react";

export const SystemHealth = () => {
  const systems = [
    { name: "API Server", status: "Healthy", uptime: "99.9%", icon: Server },
    { name: "Database", status: "Healthy", uptime: "99.8%", icon: Database },
    { name: "Network", status: "Warning", uptime: "98.5%", icon: Wifi }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground">Monitor system components and performance</p>
        </div>
      </div>

      <div className="grid gap-4">
        {systems.map((system, index) => {
          const IconComponent = system.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{system.name}</h3>
                      <p className="text-sm text-muted-foreground">Uptime: {system.uptime}</p>
                    </div>
                  </div>
                  <Badge variant={system.status === "Healthy" ? "default" : "destructive"}>
                    {system.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};