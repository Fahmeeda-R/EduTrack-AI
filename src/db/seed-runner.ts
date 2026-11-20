import 'dotenv/config';
import { getOrCreateUser } from './repository.ts';
import { pool } from './index.ts';

async function runSeed() {
  console.log('Seeding demo user and academic workspace in Supabase/PostgreSQL...');
  try {
    const user = await getOrCreateUser(
      'demo-student-elena-001',
      'elena.rostova@university.edu',
      'Elena Rostova',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApT8gIAV6A9YzjljdkKano1XTRiF6cj-wcz89Lh8fC0eXb2ugtF5TnCJviw4eBc8u2oTJvD0zEP0OlxUZZjFVTSmkdEwNcrHXE5VnNloQB38g9Tj32slBa5JAKM7ioTBVsRYw23JKOVHDwtyzyeJF9U4djGlrPLol0E3G9zKZfpU-z1NQCmAuZWvJ6XVj67rhN1FGgl9cT1-I0N2wiUskPRAQj2EmuNl1MRhYIBes3'
    );
    console.log('Default user seeded successfully:', user.displayName, `(ID: ${user.id}, UID: ${user.uid})`);
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

runSeed();
