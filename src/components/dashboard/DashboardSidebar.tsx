import { useEffect, useState } from "react";
import { 
  Activity,
  Calendar,
  FileText,
  Heart,
  Home,
  MessageSquare,
  Settings,
  Stethoscope,
  Users,
  Pill,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Clock,
  LogOut,
  ClipboardList
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  userRole: string;
}

export const DashboardSidebar = ({ userRole }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('dashboardSidebarState') === 'collapsed');

  useEffect(() => {
    localStorage.setItem('dashboardSidebarState', collapsed ? 'collapsed' : 'open');
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const getMenuItems = (role: string) => {
    const baseItems = [
      { title: "Dashboard", url: `/dashboard/${role}`, icon: Home },
      { title: "Messages", url: `/dashboard/${role}/messages`, icon: MessageSquare },
      { title: "Calendar", url: `/dashboard/${role}/calendar`, icon: Calendar },
      { title: "Settings", url: `/dashboard/${role}/settings`, icon: Settings },
    ];

    const roleSpecificItems = {
      admin: [
        { title: "User Management", url: `/dashboard/${role}/users`, icon: Users },
        { title: "Analytics", url: `/dashboard/${role}/analytics`, icon: BarChart3 },
        { title: "System Health", url: `/dashboard/${role}/system`, icon: Activity },
      ],
      doctor: [
        { title: "Patients", url: `/dashboard/${role}/patients`, icon: Users },
        { title: "Appointments", url: `/dashboard/${role}/appointments`, icon: Calendar },
        { title: "Medical Records", url: `/dashboard/${role}/records`, icon: FileText },
        { title: "Prescriptions", url: `/dashboard/${role}/prescriptions`, icon: Pill },
      ],
      nurse: [
        { title: "Patient Care", url: `/dashboard/${role}/patient-care`, icon: Heart },
        { title: "Medications", url: `/dashboard/${role}/medications`, icon: Pill },
        { title: "Rounds", url: `/dashboard/${role}/rounds`, icon: Clock },
        { title: "Alerts", url: `/dashboard/${role}/alerts`, icon: AlertTriangle },
      ],
      patient: [
        { title: "My Health", url: `/dashboard/${role}/health`, icon: Heart },
        { title: "Appointments", url: `/dashboard/${role}/appointments`, icon: Calendar },
        { title: "Medications", url: `/dashboard/${role}/medications`, icon: Pill },
        { title: "Test Results", url: `/dashboard/${role}/results`, icon: FileText },
      ],
      family: [
        { title: "Patient Status", url: `/dashboard/${role}/patient-status`, icon: UserCheck },
        { title: "Care Updates", url: `/dashboard/${role}/care-updates`, icon: Heart },
        { title: "Appointments", url: `/dashboard/${role}/appointments`, icon: Calendar },
        { title: "Emergency", url: `/dashboard/${role}/emergency`, icon: AlertTriangle },
      ],
      volunteer: [
        { title: "Assigned Tasks", url: `/dashboard/${role}/tasks`, icon: ClipboardList },
        { title: "Patient Support", url: `/dashboard/${role}/patient-support`, icon: Heart },
        { title: "Schedule", url: `/dashboard/${role}/schedule`, icon: Calendar },
        { title: "Reports", url: `/dashboard/${role}/reports`, icon: FileText },
      ],
    };

    return [
      ...baseItems.slice(0, 1), // Dashboard first
      ...(roleSpecificItems[role as keyof typeof roleSpecificItems] || []),
      ...baseItems.slice(1), // Rest of base items
    ];
  };

  const menuItems = getMenuItems(userRole);
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavClassName = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary shadow-sm" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "text-medical-trust",
      doctor: "text-primary",
      nurse: "text-secondary", 
      patient: "text-medical-healing",
      family: "text-accent",
      volunteer: "text-orange-500"
    };
    return colors[role as keyof typeof colors] || "text-primary";
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Settings,
      doctor: Stethoscope,
      nurse: Heart,
      patient: Users,
      family: Users,
      volunteer: Heart
    };
    const IconComponent = icons[role as keyof typeof icons] || Users;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-card`}>
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-primary/10 ${getRoleColor(userRole)}`}>
          {getRoleIcon(userRole)}
        </div>
        {!collapsed && (
          <div>
            <h3 className="font-semibold text-foreground capitalize">{userRole} Portal</h3>
            <p className="text-xs text-muted-foreground">Care Connect</p>
          </div>
        )}
        <SidebarTrigger className="ml-auto" onClick={() => setCollapsed(!collapsed)} />
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClassName(isActive)} `
                      }
                    >
                      <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                      {collapsed && (
                        <span className={`ml-auto h-1.5 w-1.5 rounded-full ${isActive(item.url) ? 'bg-primary' : 'bg-transparent'}`} />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="font-medium">Logout</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};