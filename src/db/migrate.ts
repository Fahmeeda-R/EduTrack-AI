import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testDbConnection } from './index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Connecting to database...');
  const health = await testDbConnection();
  if (!health.ok) {
    console.error('Database connection failed:', health.message);
    process.exit(1);
  }
  console.log('Database connected successfully:', health.message);

  const schemaPath = path.resolve(__dirname, '../../supabase-schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Migration SQL file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Applying Supabase schema migrations...');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Schema migration applied successfully to Supabase/PostgreSQL!');
  } catch (error) {
    console.error('Error applying schema migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
