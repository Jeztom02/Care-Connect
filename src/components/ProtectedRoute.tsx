import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowRoles?: string[];
  role?: string;
}

export const ProtectedRoute = ({ children, allowRoles, role }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const currentPath = location.pathname;

  // Debug logs
  useEffect(() => {
    console.log('[ProtectedRoute] Current path:', currentPath);
    console.log('[ProtectedRoute] User role:', userRole);
    console.log('[ProtectedRoute] Allowed roles:', allowRoles);
  }, [currentPath, userRole, allowRoles]);

  // If no token, redirect to login
  if (!token) {
    console.log('[ProtectedRoute] No auth token found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user role is not set, try to get it from the URL or redirect to dashboard
  if (!userRole) {
    console.log('[ProtectedRoute] No user role found, trying to determine from URL');
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 1 && pathParts[0] === 'dashboard') {
      const roleFromPath = pathParts[1];
      if (['admin', 'doctor', 'nurse', 'patient', 'family'].includes(roleFromPath)) {
        console.log(`[ProtectedRoute] Setting user role from URL: ${roleFromPath}`);
        localStorage.setItem('userRole', roleFromPath);
        // Force a re-render with the new role
        return <Navigate to={currentPath} replace />;
      }
    }
    // If we can't determine the role, redirect to a default dashboard
    console.log('[ProtectedRoute] Could not determine role, redirecting to default dashboard');
    return <Navigate to="/dashboard/patient" replace />;
  }

  // If role is required but doesn't match, show access denied
  if (allowRoles && userRole && !allowRoles.includes(userRole)) {
    console.log(`[ProtectedRoute] Access denied: User role ${userRole} not in allowed roles`, allowRoles);
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access this page.',
      variant: 'destructive',
    });
    
    // Redirect to the appropriate dashboard based on user role
    const redirectPath = `/dashboard/${userRole}`;
    if (currentPath !== redirectPath) {
      console.log(`[ProtectedRoute] Redirecting to ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // If we're at the dashboard root, redirect to the role-specific dashboard
  if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
    const redirectPath = `/dashboard/${userRole}`;
    console.log(`[ProtectedRoute] Redirecting dashboard root to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // If role prop is provided, pass it down to children
  if (role && React.isValidElement(children)) {
    return React.cloneElement(children, { role: userRole || role });
  }

  // Add role prop to children if it's a valid element
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { role: userRole });
  }

  return <>{children}</>;
};

















