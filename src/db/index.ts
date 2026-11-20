import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDbConfigured = (): boolean => {
  const url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL;
  const host = process.env.SUPABASE_DB_HOST || process.env.SQL_HOST;
  return Boolean((url && url.trim().length > 0) || (host && host.trim().length > 0));
};

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.POSTGRES_URL;

    let poolConfig: PoolConfig;

    if (connectionString && connectionString.trim().length > 0) {
      const isSupabase =
        connectionString.includes('supabase.co') ||
        connectionString.includes('pooler.supabase.com') ||
        connectionString.includes('sslmode=require');
      const enableSsl =
        isSupabase ||
        process.env.DB_SSL === 'true' ||
        process.env.NODE_ENV === 'production';

      poolConfig = {
        connectionString,
        ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    } else {
      const host = process.env.SUPABASE_DB_HOST || process.env.SQL_HOST;
      const user = process.env.SUPABASE_DB_USER || process.env.SQL_USER;
      const password = process.env.SUPABASE_DB_PASSWORD || process.env.SQL_PASSWORD;
      const database = process.env.SUPABASE_DB_NAME || process.env.SQL_DB_NAME || 'postgres';
      const port = Number(process.env.SUPABASE_DB_PORT || process.env.SQL_PORT || 5432);

      const isSupabaseHost = host?.includes('supabase.co') || host?.includes('supabase.com');
      const enableSsl =
        isSupabaseHost ||
        process.env.DB_SSL === 'true' ||
        process.env.NODE_ENV === 'production';

      poolConfig = {
        host: host || 'localhost',
        port,
        user,
        password,
        database,
        ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL idle client notice:', err.message);
    });
  }

  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Diagnostic helper to verify database connectivity
 */
export async function testDbConnection(): Promise<{ ok: boolean; message: string; timestamp?: string }> {
  if (!isDbConfigured()) {
    return {
      ok: false,
      message: 'DATABASE_URL is not configured in .env. Please add your Supabase connection string.',
    };
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time');
    return {
      ok: true,
      message: 'Successfully connected to PostgreSQL database',
      timestamp: res.rows[0]?.current_time?.toISOString(),
    };
  } catch (error: unknown) {
    let message = 'Database connection failed';
    if (error instanceof Error) {
      const aggErrors = (error as { errors?: Error[] }).errors;
      if (aggErrors && aggErrors.length > 0) {
        message = aggErrors.map((e) => e.message || e.name).join('; ');
      } else {
        message = error.message || error.name || 'Database connection error';
      }
    }
    return {
      ok: false,
      message,
    };
  }
}
