export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient' | 'family' | 'volunteer';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  email: string;
  name: string; // user's full name
}

declare global {
  // Augment Express Request for TypeScript
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}



