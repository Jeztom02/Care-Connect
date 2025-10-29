import { ReactNode, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, Bell, Search } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useApi";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: string;
}

export const DashboardLayout = ({ children, userRole }: DashboardLayoutProps) => {
  const { isDarkMode, toggleDarkMode, accent, setAccent } = useTheme();
  const { data: me } = useUserProfile();
  const [sidebarState, setSidebarState] = useState<'open' | 'collapsed' | 'closed'>(() => {
    const saved = localStorage.getItem('dashboardSidebarState');
    return (saved as any) || 'open';
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('dashboardSidebarState', sidebarState);
  }, [sidebarState]);

  const crumbs = useMemo(() => {
    const path = location.pathname || '';
    const parts = path.split('/').filter(Boolean);
    const startIdx = parts.findIndex(p => p === 'dashboard');
    const segs = startIdx >= 0 ? parts.slice(startIdx) : parts;
    const acc: Array<{ label: string; href: string }> = [];
    let build = '';
    segs.forEach((p) => {
      build += `/${p}`;
      const label = p.replace(/-/g, ' ');
      acc.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: build });
    });
    return acc;
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {sidebarState !== 'closed' && (
          <div className={sidebarState === 'collapsed' ? 'w-16' : 'w-64'}>
            <DashboardSidebar userRole={userRole} />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarState(prev => prev === 'closed' ? 'open' : (prev === 'open' ? 'closed' : 'open'))}
                aria-label={sidebarState === 'open' ? 'Collapse sidebar' : 'Expand sidebar'}
                title={sidebarState === 'open' ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{sidebarState === 'open' ? 'Collapse sidebar' : 'Expand sidebar'}</span>
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                Care Connect Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 w-[260px]" />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="flex items-center gap-2"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </Button>
              <select
                className="border bg-background text-foreground rounded-md px-2 py-1 hidden sm:block"
                value={accent}
                onChange={(e) => setAccent(e.target.value as any)}
                aria-label="Accent color"
              >
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
                <option value="indigo">Indigo</option>
              </select>
              <Avatar className="h-8 w-8">
                <AvatarImage src={(me as any)?.avatar} />
                <AvatarFallback>
                  {String((me as any)?.name || localStorage.getItem('userName') || 'U')
                    .split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="px-6 py-2 border-b border-border bg-background/60">
            <nav className="text-sm text-muted-foreground flex gap-2 items-center">
              {crumbs.map((c, idx) => (
                <div key={c.href} className="flex items-center gap-2">
                  {idx > 0 && <span>/</span>}
                  {idx < crumbs.length - 1 ? (
                    <Link to={c.href} className="hover:text-foreground">{c.label}</Link>
                  ) : (
                    <span className="text-foreground">{c.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};