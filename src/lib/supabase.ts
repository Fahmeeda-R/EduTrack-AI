import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable retriever for universal (Node.js & Vite) usage
function getEnv(nodeKey: string, viteKey?: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[nodeKey]) {
    return process.env[nodeKey] || '';
  }
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env;
    if (viteKey && metaEnv[viteKey]) {
      return metaEnv[viteKey];
    }
    if (metaEnv[nodeKey]) {
      return metaEnv[nodeKey];
    }
  }
  return '';
}

const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey));
};

// Client for public operations (works in both backend and frontend)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  }
);

// Admin client using service_role key for backend operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
}

/**
 * Validates a Supabase JWT token and extracts user details
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseAuthUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const client = supabaseServiceRoleKey ? supabaseAdmin : supabase;
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      name: metadata.full_name || metadata.name || metadata.display_name || user.email?.split('@')[0] || 'User',
      avatarUrl: metadata.avatar_url || metadata.picture,
      role: metadata.role || 'student',
    };
  } catch (err) {
    console.error('Error verifying Supabase token:', err);
    return null;
  }
}
