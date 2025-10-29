import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
const { verify } = jwt;
import { JWT_SECRET } from './config';
import { User, Patient } from './models';
import { 
  AuthenticatedSocket, 
  SocketEventMap, 
  getPatientRoom, 
  getUserRoom, 
  getRoleRoom,
  UserRole,
  SocketEventHandlers
} from './types/socket';
import { Types } from 'mongoose';

let ioInstance: Server | null = null;

// Track connected users and their socket IDs
interface ConnectedUser {
  socketId: string;
  role: UserRole;
  name: string;
  patientIds: string[];
  lastSeen: Date;
}

const connectedUsers = new Map<string, ConnectedUser>();

// Track which rooms each socket is in
const socketRooms = new Map<string, Set<string>>();

// Track pending authentication timeouts
const pendingAuthTimeouts = new Map<string, NodeJS.Timeout>();

// Initialize socket.io with authentication and event handlers
export function initializeSocket(io: Server) {
  ioInstance = io;

  // Authentication middleware with timeout
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Set authentication timeout (10 seconds)
    const authTimeout = setTimeout(() => {
      if (!socket.user) {
        socket.emit('error:timeout', { message: 'Authentication timeout' });
        socket.disconnect(true);
      }
    }, 10000);

    try {
      // Verify JWT token
      const decoded = verify(token, JWT_SECRET) as { userId: string };
      
      // Fetch user from database with patient assignments
      const user = await User.findById(decoded.userId)
        .select('name role assignedPatients')
        .populate<{ assignedPatients: Array<{ _id: Types.ObjectId }> }>('assignedPatients', '_id');
      
      if (!user) {
        clearTimeout(authTimeout);
        return next(new Error('User not found'));
      }

      // Clear the timeout on successful authentication
      clearTimeout(authTimeout);
      
      // Store user data on the socket
      const now = new Date();
      socket.user = {
        id: user._id.toString(),
        role: user.role as UserRole,
        name: user.name
      };

      // Update connected users map
      connectedUsers.set(user._id.toString(), {
        socketId: socket.id,
        role: user.role as UserRole,
        name: user.name,
        patientIds: user.assignedPatients?.map((p: { _id: { toString: () => string } }) => p._id.toString()) || [],
        lastSeen: now
      });

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    if (!socket.user) {
      console.error('Socket connected without user');
      return socket.disconnect(true);
    }

    const { id: userId, role, name } = socket.user;
    console.log(`User connected: ${name} (${role})`);

    try {
      // Fetch patient assignments for this user
      const user = await User.findById(userId).populate('assignedPatients');
      const patientIds = user?.assignedPatients?.map((p: { _id: Types.ObjectId }) => p._id.toString()) || [];

      // Store connection info
      const now = new Date();
      connectedUsers.set(userId, {
        socketId: socket.id,
        role,
        name,
        patientIds,
        lastSeen: now
      });

      // Join user to their personal room
      const userRoom = getUserRoom(userId);
      socket.join(userRoom);
      trackRoom(socket.id, userRoom);

      // Join role-based room
      const roleRoom = getRoleRoom(role);
      socket.join(roleRoom);
      trackRoom(socket.id, roleRoom);

      // Join patient rooms for assigned patients
      patientIds.forEach((patientId: string) => {
        const patientRoom = getPatientRoom(patientId);
        socket.join(patientRoom);
        trackRoom(socket.id, patientRoom);
      });

      // Notify others in the same role that a user is online
      socket.to(roleRoom).emit('user:online', { userId, role, name });

      // Send connection confirmation
      socket.emit('connection:established', { 
        message: 'Successfully connected to WebSocket server',
        userId,
        role,
        patientIds
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${name} (${role})`);
        connectedUsers.delete(userId);
        
        // Clean up room tracking
        const rooms = socketRooms.get(socket.id) || new Set();
        rooms.forEach(room => {
          socket.leave(room);
        });
        socketRooms.delete(socket.id);

        // Notify others that user went offline
        socket.to(roleRoom).emit('user:offline', { userId, role, name });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

    } catch (error) {
      console.error('Error initializing socket connection:', error);
      socket.emit('error:server', { 
        message: 'Error initializing connection',
        code: 'INIT_ERROR'
      });
      socket.disconnect(true);
    }
  });
}

/**
 * Tracks which rooms a socket has joined
 * @param socketId The ID of the socket
 * @param room The room name to track
 */
function trackRoom(socketId: string, room: string): void {
  if (!socketId || !room) return;
  
  if (!socketRooms.has(socketId)) {
    socketRooms.set(socketId, new Set());
  }
  
  const rooms = socketRooms.get(socketId);
  if (rooms) {
    rooms.add(room);
  }
}

/**
 * Removes a socket from room tracking
 * @param socketId The ID of the socket
 * @param room The room name to remove
 */
function untrackRoom(socketId: string, room: string): void {
  if (!socketId || !room) return;
  
  const rooms = socketRooms.get(socketId);
  if (rooms) {
    rooms.delete(room);
    if (rooms.size === 0) {
      socketRooms.delete(socketId);
    }
  }
}

/**
 * Gets the Socket.IO server instance
 * @returns The Socket.IO server instance
 * @throws {Error} If the server is not initialized
 */
export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO server not initialized. Call initializeSocket() first.');
  }
  return ioInstance;
}

/**
 * Gets all rooms a socket is currently in
 * @param socketId The ID of the socket
 * @returns Array of room names
 */
export function getSocketRooms(socketId: string): string[] {
  return Array.from(socketRooms.get(socketId) || []);
}

/**
 * Gets all connected users
 * @returns Array of connected user information
 */
export function getConnectedUsers(): Array<{
  userId: string;
  name: string;
  role: UserRole;
  lastSeen: Date;
  patientIds: string[];
}> {
  return Array.from(connectedUsers.entries()).map(([userId, user]) => ({
    userId,
    name: user.name,
    role: user.role,
    lastSeen: user.lastSeen,
    patientIds: user.patientIds
  }));
}

// Helper function to emit events to specific users/roles/patients
export const emitToUser = <K extends keyof SocketEventMap>(
  userId: string,
  event: K,
  payload: SocketEventMap[K]
) => {
  const io = getIO();
  io.to(getUserRoom(userId)).emit(event as string, payload);
};

export const emitToRole = <K extends keyof SocketEventMap>(
  role: UserRole,
  event: K,
  payload: SocketEventMap[K]
) => {
  const io = getIO();
  io.to(getRoleRoom(role)).emit(event as string, payload);
};

export const emitToPatient = <K extends keyof SocketEventMap>(
  patientId: string,
  event: K,
  payload: SocketEventMap[K]
) => {
  const io = getIO();
  io.to(getPatientRoom(patientId)).emit(event as string, payload);
};

export const broadcast = <K extends keyof SocketEventMap>(
  event: K,
  payload: SocketEventMap[K],
  { includeSelf = false, room, skipUser }: 
  { includeSelf?: boolean; room?: string; skipUser?: string } = {}
) => {
  const io = getIO();
  const target = room ? io.to(room) : io;
  
  if (skipUser) {
    target.except(getUserRoom(skipUser)).emit(event as string, payload);
  } else if (!includeSelf) {
    target.emit(event as string, payload);
  } else {
    target.emit(event as string, payload);
  }
};

// Helper to get all connected users of a specific role
export const getConnectedUsersByRole = (role: UserRole) => {
  return Array.from(connectedUsers.entries())
    .filter(([_, user]) => user.role === role)
    .map(([userId, user]) => ({
      userId,
      name: user.name,
      socketId: user.socketId,
      patientIds: user.patientIds
    }));
};
