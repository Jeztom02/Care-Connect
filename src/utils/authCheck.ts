import authService from '@/services/authService';
import { Role } from '@/types';

/**
 * Checks if the current user is authenticated and has the required role
 * @param requiredRoles Optional array of roles that are allowed to access the resource
 * @returns Object with authentication status and user info
 */
export const checkAuth = (requiredRoles?: Role[]) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  
  if (!isAuthenticated || !user) {
    return {
      isAuthenticated: false,
      hasAccess: false,
      user: null,
      error: 'Not authenticated',
      redirectTo: '/login',
    };
  }

  // If no specific roles required, just check authentication
  if (!requiredRoles || requiredRoles.length === 0) {
    return {
      isAuthenticated: true,
      hasAccess: true,
      user,
      error: null,
    };
  }

  // Check if user has one of the required roles
  const hasAccess = requiredRoles.includes(user.role as Role);
  
  return {
    isAuthenticated: true,
    hasAccess,
    user,
    error: hasAccess ? null : 'Insufficient permissions',
    redirectTo: hasAccess ? null : '/unauthorized',
  };
};

/**
 * Higher-order function to protect routes based on authentication and roles
 */
export const withAuth = (requiredRoles?: Role[]) => {
  return (WrappedComponent: React.ComponentType) => {
    return (props: any) => {
      const auth = checkAuth(requiredRoles);
      
      if (!auth.isAuthenticated) {
        // Redirect to login if not authenticated
        window.location.href = auth.redirectTo || '/login';
        return null;
      }
      
      if (!auth.hasAccess) {
        // Redirect to unauthorized page or show access denied
        window.location.href = auth.redirectTo || '/unauthorized';
        return null;
      }
      
      return <WrappedComponent {...props} user={auth.user} />;
    };
  };
};

export default {
  checkAuth,
  withAuth,
};
