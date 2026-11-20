import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;

const sqlHost = process.env.SUPABASE_DB_HOST || process.env.SQL_HOST;
const sqlDbName = process.env.SUPABASE_DB_NAME || process.env.SQL_DB_NAME || 'postgres';
const user = process.env.SUPABASE_DB_USER || process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres';
const password = process.env.SUPABASE_DB_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '';
const port = Number(process.env.SUPABASE_DB_PORT || process.env.SQL_PORT || 5432);

const isSupabase =
  (databaseUrl && (databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com'))) ||
  (sqlHost && (sqlHost.includes('supabase.co') || sqlHost.includes('supabase.com')));

const enableSsl = isSupabase || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: databaseUrl
    ? {
        url: databaseUrl,
        ssl: enableSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: sqlHost || 'localhost',
        port: port,
        user: user,
        password: password,
        database: sqlDbName,
        ssl: enableSsl ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});
