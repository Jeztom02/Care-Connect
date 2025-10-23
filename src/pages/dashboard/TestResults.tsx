import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar } from "lucide-react";

export const TestResults = () => {
  const results = [
    { id: 1, test: "Blood Work Panel", date: "2024-01-10", status: "Normal", doctor: "Dr. Johnson" },
    { id: 2, test: "Chest X-Ray", date: "2024-01-08", status: "Normal", doctor: "Dr. Smith" },
    { id: 3, test: "ECG", date: "2024-01-05", status: "Abnormal", doctor: "Dr. Brown" }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Results</h1>
          <p className="text-muted-foreground">View your laboratory and diagnostic results</p>
        </div>
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{result.test}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{result.date}</span>
                      <span>• {result.doctor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={result.status === "Normal" ? "default" : "destructive"}>
                    {result.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};