import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Clock, Users, Loader2 } from "lucide-react";
import { useVolunteerReports } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

interface VolunteerReportsProps {
  userRole: string;
}

export const VolunteerReports = ({ userRole }: VolunteerReportsProps) => {
  const { data: reports, loading, error, refetch } = useVolunteerReports();
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    try {
      // TODO: Implement actual report generation API call
      toast({
        title: "Report Generated",
        description: "Your volunteer report has been generated successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      // TODO: Implement actual report download API call
      toast({
        title: "Download Started",
        description: "Your report download has started.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load reports</h2>
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
          <h1 className="text-3xl font-bold text-foreground">Volunteer Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track your volunteer activities and generate reports
          </p>
        </div>
        <Button className="btn-medical" onClick={handleGenerateReport}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours
            </CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reports?.reduce((total: number, report: any) => total + report.hoursVolunteered, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasks Completed
            </CardTitle>
            <FileText className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reports?.reduce((total: number, report: any) => total + report.tasksCompleted, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patients Helped
            </CardTitle>
            <Users className="h-5 w-5 text-medical-healing" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reports?.reduce((total: number, report: any) => total + report.patientsHelped, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports Generated
            </CardTitle>
            <Calendar className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{reports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total reports</p>
          </CardContent>
        </Card>
      </div>

      {reports && reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first volunteer report to track your activities.
            </p>
            <Button onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports?.map((report: any) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Volunteer Report</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadReport(report.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Hours:</span>
                    <span className="font-medium text-foreground">{report.hoursVolunteered}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tasks:</span>
                    <span className="font-medium text-foreground">{report.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Patients:</span>
                    <span className="font-medium text-foreground">{report.patientsHelped}</span>
                  </div>
                </div>
                {report.notes && (
                  <div className="p-3 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">{report.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};















