import { useAuth } from './useAuth';
import { Role } from '@/types';

type Resource = 
  | 'patients' 
  | 'medications' 
  | 'appointments' 
  | 'reports' 
  | 'settings' 
  | 'profile';

type Action = 'view' | 'create' | 'edit' | 'delete' | 'manage';

// Define permissions for each role
const rolePermissions: Record<Role, Record<Resource, Action[]>> = {
  [Role.ADMIN]: {
    patients: ['view', 'create', 'edit', 'delete', 'manage'],
    medications: ['view', 'create', 'edit', 'delete', 'manage'],
    appointments: ['view', 'create', 'edit', 'delete', 'manage'],
    reports: ['view', 'create', 'edit', 'delete', 'manage'],
    settings: ['view', 'edit'],
    profile: ['view', 'edit']
  },
  [Role.DOCTOR]: {
    patients: ['view', 'create', 'edit', 'manage'],
    medications: ['view', 'create', 'edit'],
    appointments: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create'],
    settings: ['view'],
    profile: ['view', 'edit']
  },
  [Role.NURSE]: {
    patients: ['view', 'edit'],
    medications: ['view', 'edit'],
    appointments: ['view', 'edit'],
    reports: ['view'],
    settings: ['view'],
    profile: ['view', 'edit']
  },
  [Role.PATIENT]: {
    patients: ['view'],
    medications: ['view'],
    appointments: ['view'],
    reports: [],
    settings: ['view'],
    profile: ['view', 'edit']
  },
  [Role.FAMILY]: {
    patients: ['view'],
    medications: ['view'],
    appointments: ['view'],
    reports: [],
    settings: [],
    profile: ['view']
  }
};

export function useRoleAccess() {
  const { user } = useAuth();
  const role = user?.role || Role.PATIENT;

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!role) return false;
    return rolePermissions[role]?.[resource]?.includes(action) || false;
  };

  // Check if user has any of the specified roles
  const hasRole = (...roles: Role[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  // Get all resources the user can access with specific action
  const getAccessibleResources = (action: Action): Resource[] => {
    if (!role) return [];
    return (Object.keys(rolePermissions[role]) as Resource[]).filter(
      resource => rolePermissions[role][resource].includes(action)
    );
  };

  return {
    hasPermission,
    hasRole,
    getAccessibleResources,
    role,
    isAdmin: role === Role.ADMIN,
    isDoctor: role === Role.DOCTOR,
    isNurse: role === Role.NURSE,
    isPatient: role === Role.PATIENT,
    isFamily: role === Role.FAMILY,
  };
}
