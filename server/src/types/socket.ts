import { Socket } from 'socket.io';

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'patient' | 'family' | 'volunteer';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: UserRole;
    name: string;
  };
}

// Event payloads
export interface SocketEventMap {
  // Connection events
  'user:connected': { userId: string; role: UserRole };
  'user:disconnected': { userId: string; role: UserRole };
  
  // Patient events
  'patient:updated': {
    patientId: string;
    updatedBy: string;
    updatedByRole: UserRole;
    changes: Record<string, any>;
    timestamp: Date;
  };
  
  // Vital signs events
  'vital:recorded': {
    patientId: string;
    vitalId: string;
    recordedBy: string;
    recordedByRole: UserRole;
    timestamp: Date;
  };
  'vital:acknowledged': {
    vitalId: string;
    acknowledgedBy: string;
    acknowledgedByRole: UserRole;
    timestamp: Date;
    notes?: string;
  };
  
  // Medication events
  'medication:added': {
    medication: any; // Replace 'any' with your Medication type
    patientId: string;
    addedBy: string;
    addedByRole: UserRole;
    timestamp: Date;
  };
  'medication:updated': {
    medication: any; // Replace 'any' with your Medication type
    patientId: string;
    updatedBy: string;
    updatedByRole: UserRole;
    changes: Record<string, any>;
    timestamp: Date;
  };
  'medication:deleted': {
    medicationId: string;
    patientId: string;
    deletedBy: string;
    deletedByRole: UserRole;
    timestamp: Date;
  };
  'medication:administered': {
    medicationId: string;
    patientId: string;
    administeredBy: string;
    administeredByRole: UserRole;
    notes?: string;
    timestamp: Date;
  };
  'medication:missed': {
    medicationId: string;
    patientId: string;
    reason?: string;
    timestamp: Date;
  };
  'medication:schedule_updated': {
    patientId: string;
    updatedBy: string;
    updatedByRole: UserRole;
    changes: {
      added: any[];
      updated: any[];
      removed: string[];
    };
    timestamp: Date;
  };

  // Notes events
  'note:created': {
    patientId: string;
    noteId: string;
    createdBy: string;
    createdByRole: UserRole;
    category: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
  };
  'note:updated': {
    noteId: string;
    updatedBy: string;
    updatedByRole: UserRole;
    changes: Record<string, any>;
    timestamp: Date;
  };
  'note:acknowledged': {
    noteId: string;
    acknowledgedBy: string;
    acknowledgedByRole: UserRole;
    timestamp: Date;
    notes?: string;
  };
  
  // Alert events
  'alert:created': {
    alertId: string;
    patientId: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    title: string;
    createdBy: string;
    createdByRole: UserRole;
    timestamp: Date;
  };
  'alert:acknowledged': {
    alertId: string;
    acknowledgedBy: string;
    acknowledgedByRole: UserRole;
    timestamp: Date;
    notes?: string;
  };
  'alert:resolved': {
    alertId: string;
    resolvedBy: string;
    resolvedByRole: UserRole;
    timestamp: Date;
    resolutionNotes?: string;
  };
  
  // Message events
  'message:new': {
    messageId: string;
    fromUserId: string;
    fromUserRole: UserRole;
    toUserId?: string;
    toRole?: UserRole;
    content: string;
    timestamp: Date;
  };
  
  // Error events
  'error:unauthorized': { message: string };
  'error:validation': { message: string; errors: Record<string, string> };
  'error:server': { message: string; code?: string };
}

// Room names
export const getPatientRoom = (patientId: string) => `patient:${patientId}`;
export const getUserRoom = (userId: string) => `user:${userId}`;
export const getRoleRoom = (role: UserRole) => `role:${role}`;

// Helper types for type-safe event handling
export type EventHandler<T extends keyof SocketEventMap> = (
  payload: SocketEventMap[T],
  socket: AuthenticatedSocket
) => void | Promise<void>;

export interface SocketEventHandlers {
  [event: string]: EventHandler<keyof SocketEventMap>;
}
