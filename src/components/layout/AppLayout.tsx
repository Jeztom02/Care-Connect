import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Pill, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Stethoscope,
  HeartPulse,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Role } from '@/types';

const navItems = [
  { 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/dashboard',
    roles: [Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.PATIENT, Role.FAMILY]
  },
  { 
    name: 'Patients', 
    icon: Users, 
    path: '/patients',
    roles: [Role.DOCTOR, Role.NURSE, Role.ADMIN]
  },
  { 
    name: 'Medications', 
    icon: Pill, 
    path: '/medications',
    roles: [Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.PATIENT, Role.FAMILY]
  },
  { 
    name: 'Appointments', 
    icon: HeartPulse, 
    path: '/appointments',
    roles: [Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.PATIENT]
  },
  { 
    name: 'Reports', 
    icon: FileText, 
    path: '/reports',
    roles: [Role.DOCTOR, Role.ADMIN]
  },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  // Close sidebar on desktop when it becomes mobile
  useEffect(() => {
    if (isDesktop && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isDesktop, sidebarOpen]);

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role as Role)
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white/80 backdrop-blur-sm shadow-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex items-center">
            <HeartPulse className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Compassion Care</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start mb-1',
                    isActive 
                      ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50',
                    'transition-colors duration-200'
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </div>

          {/* User profile section */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  {user?.role === 'doctor' ? (
                    <Stethoscope className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  ) : user?.role === 'nurse' ? (
                    <User className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  ) : (
                    <User className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role?.toLowerCase() || 'User'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
