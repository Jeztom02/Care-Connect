import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient' | 'volunteer' | string;

interface WithAuthProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * Higher-Order Component for role-based access control
 * @param requiredRoles - Single role or array of roles that are allowed to access the route
 * @param redirectTo - Path to redirect if user is not authorized (default: '/unauthorized')
 */
const withAuth = ({
  requiredRoles = [],
  redirectTo = '/unauthorized',
}: Omit<WithAuthProps, 'children'> = {}) => {
  return function WithAuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If roles are specified, check if user has any of the required roles
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (rolesArray.length > 0 && !hasAnyRole(...rolesArray)) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // If we have a user and they have the required role (if any), render the children
    return <>{children}</>;
  };
};

export default withAuth;
