import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import api from '@/utils/api';
import authService from '@/services/authService';
import { Role } from '@/types';

export const AuthTest: React.FC = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null as { id: string; role: Role; name: string } | null,
    token: '',
    error: '',
    apiResponse: null as any,
    loading: false,
  });

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getUser();
      const token = authService.getToken();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: Boolean(isAuthenticated && user && token),
        user: user ? {
          id: user.id || '',
          role: (user.role || '') as Role,
          name: user.name || 'Unknown',
        } : null,
        token: token || '',
      }));
    };

    checkAuth();
  }, []);

  const testApi = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: '', apiResponse: null }));
    
    try {
      const response = await api.get('/patients');
      setAuthState(prev => ({
        ...prev,
        apiResponse: response.data,
        error: '',
      }));
    } catch (error: any) {
      console.error('API Test Error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message || 'Unknown error',
        apiResponse: error.response?.data || null,
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const loginAsTestUser = async (role: Role) => {
    try {
      // This is just for testing - in a real app, you would use your actual login flow
      const testUsers = {
        admin: { email: 'admin@example.com', password: 'admin123' },
        doctor: { email: 'doctor@example.com', password: 'doctor123' },
        nurse: { email: 'nurse@example.com', password: 'nurse123' },
        patient: { email: 'patient@example.com', password: 'patient123' },
      };

      const credentials = testUsers[role.toLowerCase() as keyof typeof testUsers];
      if (!credentials) throw new Error(`No test user for role: ${role}`);

      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data.token) {
        authService.setToken(response.data.token);
        authService.setUser({
          id: response.data.user.id,
          role: response.data.user.role,
          name: response.data.user.name || 'Test User',
        });

        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          token: response.data.token,
          user: {
            id: response.data.user.id,
            role: response.data.user.role,
            name: response.data.user.name || 'Test User',
          },
        }));
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message || 'Login failed',
      }));
    }
  };

  const logout = () => {
    authService.clearAuth();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: '',
      error: '',
      apiResponse: null,
      loading: false,
    });
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
        <CardDescription>
          Test authentication and API access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Current Auth State:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify({
              isAuthenticated: authState.isAuthenticated,
              user: authState.user,
              token: authState.token ? '***' : 'None',
            }, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Test Login:</h3>
          <div className="flex flex-wrap gap-2">
            {['admin', 'doctor', 'nurse', 'patient'].map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => loginAsTestUser(role as Role)}
                disabled={authState.loading}
              >
                Login as {role}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              disabled={!authState.isAuthenticated || authState.loading}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Test API Endpoint:</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={testApi}
              disabled={!authState.isAuthenticated || authState.loading}
            >
              {authState.loading ? 'Testing...' : 'Test /api/patients'}
            </Button>
            <span className="text-sm text-gray-500">
              Requires: doctor, nurse, admin, or volunteer role
            </span>
          </div>
        </div>

        {authState.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-medium text-red-800">Error:</h4>
            <pre className="text-red-600 text-sm mt-1 overflow-x-auto">
              {typeof authState.error === 'string' 
                ? authState.error 
                : JSON.stringify(authState.error, null, 2)}
            </pre>
          </div>
        )}

        {authState.apiResponse && (
          <div className="space-y-2">
            <h3 className="font-medium">API Response:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto max-h-60 overflow-y-auto">
              {JSON.stringify(authState.apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthTest;
