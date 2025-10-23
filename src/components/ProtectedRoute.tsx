import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowRoles?: string[];
}

export const ProtectedRoute = ({ children, allowRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && role && !allowRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

















