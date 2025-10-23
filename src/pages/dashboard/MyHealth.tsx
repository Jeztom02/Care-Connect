import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Activity, Thermometer, TrendingUp } from "lucide-react";

export const MyHealth = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Health</h1>
          <p className="text-muted-foreground">Track your health metrics and progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">72 bpm</p>
            <p className="text-sm text-muted-foreground">Normal range</p>
            <Button size="sm" variant="outline" className="mt-2">Log Reading</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Blood Pressure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">120/80</p>
            <p className="text-sm text-muted-foreground">Optimal</p>
            <Button size="sm" variant="outline" className="mt-2">Log Reading</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">98.6°F</p>
            <p className="text-sm text-muted-foreground">Normal</p>
            <Button size="sm" variant="outline" className="mt-2">Log Reading</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};