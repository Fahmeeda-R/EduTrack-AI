import { Request, Response, NextFunction } from 'express';
import { isSupabaseConfigured, verifySupabaseToken } from '../lib/supabase.ts';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Universal token resolver that supports both Supabase Auth and Firebase Auth
 */
export async function resolveAuthUser(authHeader?: string): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return null;
  }

  // 1. Try Supabase Auth verification if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      const supabaseUser = await verifySupabaseToken(token);
      if (supabaseUser) {
        return {
          uid: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.name,
          picture: supabaseUser.avatarUrl,
          role: supabaseUser.role,
        };
      }
    } catch (err) {
      console.warn('Supabase token verification error, trying fallback:', err);
    }
  }

  // 2. Fallback to Firebase Auth verification if configured
  try {
    const { adminAuth } = await import('../lib/firebase-admin.ts');
    const decodedFirebase = await adminAuth.verifyIdToken(token);
    return {
      ...decodedFirebase,
      uid: decodedFirebase.uid,
      email: decodedFirebase.email,
      name: decodedFirebase.name,
      picture: decodedFirebase.picture,
    };
  } catch (_firebaseErr) {
    // Neither provider verified the token
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const user = await resolveAuthUser(authHeader);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = user;
  next();
};
