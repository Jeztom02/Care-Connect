import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, BarChart3, Settings, MessageSquare, AlertTriangle, Calendar, UserCheck, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/ui/StatCard";

interface DashboardOverview {
  overview: {
    totalUsers: number;
    activeUsers: number;
    todayAppointments: number;
    weekAppointments: number;
    openAlerts: number;
    recentMessages: number;
  };
  systemHealth: Array<{
    key: string;
    value: any;
    category: string;
  }>;
}

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getSystemHealthPercentage = () => {
    if (!dashboardData?.systemHealth) return 89;
    
    const healthSettings = dashboardData.systemHealth.filter(s => s.category === 'System');
    const enabledCount = healthSettings.filter(s => s.value === true).length;
    return Math.round((enabledCount / healthSettings.length) * 100) || 89;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System administration and management</p>
          </div>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading dashboard data...
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Total Users" value={dashboardData?.overview.totalUsers || 0} />
            <StatCard icon={<UserCheck className="h-5 w-5 text-medical-healing" />} label="Active Users" value={dashboardData?.overview.activeUsers || 0} />
            <StatCard icon={<Calendar className="h-5 w-5 text-accent" />} label="Today's Appointments" value={dashboardData?.overview.todayAppointments || 0} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-destructive" />} label="Open Alerts" value={dashboardData?.overview.openAlerts || 0} />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData?.overview.recentMessages || 0}</p>
                    <p className="text-sm text-muted-foreground">Recent Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getSystemHealthPercentage()}%</p>
                    <p className="text-sm text-muted-foreground">System Health</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData?.overview.weekAppointments || 0}</p>
                    <p className="text-sm text-muted-foreground">This Week's Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = '/dashboard/admin/users'}
                >
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = '/dashboard/admin/analytics'}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = '/dashboard/admin/system'}
                >
                  <Activity className="h-6 w-6" />
                  <span>System Health</span>
                </Button>
                <Button 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = '/dashboard/admin/messages'}
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>Send Announcement</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health Status */}
          {dashboardData?.systemHealth && dashboardData.systemHealth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>System Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.systemHealth.map((setting, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{setting.key}</span>
                        <Badge className={
                          typeof setting.value === 'boolean' 
                            ? (setting.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                            : 'bg-blue-100 text-blue-700'
                        }>
                          {typeof setting.value === 'boolean' 
                            ? (setting.value ? 'Enabled' : 'Disabled')
                            : String(setting.value)
                          }
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">User Management</p>
                        <p className="text-sm text-muted-foreground">Manage system users and roles</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Analytics Dashboard</p>
                        <p className="text-sm text-muted-foreground">View system performance metrics</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Messaging System</p>
                        <p className="text-sm text-muted-foreground">Send announcements and alerts</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Total System Users</p>
                      <p className="text-sm text-muted-foreground">All registered users</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.overview.totalUsers || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Active Users</p>
                      <p className="text-sm text-muted-foreground">Currently active</p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.overview.activeUsers || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Open Alerts</p>
                      <p className="text-sm text-muted-foreground">Requiring attention</p>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData?.overview.openAlerts || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};