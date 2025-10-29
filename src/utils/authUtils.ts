/**
 * Utility functions for handling authentication tokens and user sessions
 */

export interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  email?: string;
  name?: string;
}

export const parseJwt = (token: string | null): TokenPayload | null => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

export const getCurrentUserRole = (): string | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  const payload = parseJwt(token);
  return payload?.role || null;
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const isAuthorized = (requiredRoles: string[]): boolean => {
  const userRole = getCurrentUserRole();
  return userRole ? requiredRoles.includes(userRole) : false;
};
