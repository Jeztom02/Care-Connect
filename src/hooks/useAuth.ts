import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import authService, { getAuthHeader } from '@/services/authService';
import { parseJwt, isTokenExpired } from '@/utils/authUtils';

type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient' | 'volunteer' | string;

interface AuthUser {
  id: string;
  role: UserRole;
  name?: string;
  email?: string;
  [key: string]: any;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Check if user is authenticated
  const { data: isAuthenticated, isLoading, refetch } = useQuery<boolean>({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        return await authService.checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
        return false;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check token on mount and set up token validation interval
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email || '',
          role: payload.role,
          name: payload.name,
          ...payload
        });
      }
    }

    // Set up token validation interval (every minute)
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (token && isTokenExpired(token)) {
        // Token expired, clear auth state
        queryClient.setQueryData(['auth'], null);
        setUser(null);
        localStorage.removeItem('authToken');
        navigate('/login', { 
          state: { from: window.location.pathname },
          replace: true 
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate, queryClient]);

  // Update user when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      const currentUser = authService.getUser();
      setUser({
        id: currentUser.id || '',
        role: currentUser.role as UserRole,
        name: currentUser.name || '',
        ...currentUser
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  // Check if user has any of the required roles
  const hasAnyRole = useCallback((...roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user]);

  // Check if user has all required roles
  const hasAllRoles = useCallback((...roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.every(role => user.role === role);
  }, [user]);

  // For backward compatibility (deprecated, use hasAnyRole instead)
  const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
    if (!user?.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  }, [user]);

  // Enhanced logout with cleanup
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      queryClient.clear();
      setUser(null);
      navigate('/login');
    }
  }, [navigate, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated === true,
    hasRole, // For backward compatibility
    hasAnyRole,
    hasAllRoles,
    logout,
    refreshAuth: refetch,
    getAuthHeader,
  };
};
