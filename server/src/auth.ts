import jwt from 'jsonwebtoken';
import type { JwtPayload, UserRole } from './types';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}




