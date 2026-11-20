# Supabase Integration Guide for EduTrack AI

EduTrack AI is integrated with **Supabase** for PostgreSQL database persistence and backend authentication/management.

---

## 1. Quick Setup (3 Steps)

### Step 1: Get Credentials from Supabase Dashboard

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **API**:
   - Copy **Project URL** -> `SUPABASE_URL` & `VITE_SUPABASE_URL`
   - Copy **anon public** key -> `SUPABASE_ANON_KEY` & `VITE_SUPABASE_ANON_KEY`
   - Copy **service_role secret** key -> `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Project Settings** -> **Database**:
   - Scroll to **Connection string** -> Select **URI** (or **Session Pooler**).
   - Copy the URI -> `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your actual database password.

---

### Step 2: Configure Environment Variables

Update your `.env` file in the project root:

```env
# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"

# Supabase API & Auth
SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional Vite variables for direct client access
VITE_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

> **Note on Connection Pooling**: If using Supabase Connection Pooler (PgBouncer/Supavisor), use port `6543` or `5432`:
> `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

### Step 3: Initialize Database Tables

You can initialize the database using either of two methods:

#### Method A: Direct SQL in Supabase Dashboard (Fastest)
1. In your Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Open `supabase-schema.sql` from this project, copy all contents.
3. Paste into the SQL Editor and click **Run**.
   All 7 core tables (`users`, `assignments`, `calendar_events`, `documents`, `announcements`, `study_blocks`, `chat_messages`) will be created with proper types, indexes, and cascades.

#### Method B: Run Migration via CLI
Run the built-in migration script:
```bash
npm run db:migrate
```
Or push schema directly via Drizzle Kit:
```bash
npm run db:push
```

#### Optional: Seed Demo Workspace Data
To seed a default student workspace with assignments, study blocks, documents, and calendar events:
```bash
npm run db:seed
```

---

## 2. Verifying the Connection

Start the EduTrack AI server:
```bash
npm run dev
```

Visit the Supabase health & status check endpoint:
```
http://localhost:3000/api/supabase/status
```

Expected JSON response:
```json
{
  "supabaseClientConfigured": true,
  "supabaseUrl": "set",
  "supabaseAnonKey": "set",
  "supabaseServiceKey": "set",
  "databaseUrl": "set",
  "database": {
    "ok": true,
    "message": "Successfully connected to PostgreSQL database",
    "timestamp": "2026-11-19T05:30:00.000Z"
  }
}
```

---

## 3. Architecture & Features

### Backend Integration
- **`src/db/index.ts`**: PostgreSQL connection pool using `pg` and Drizzle ORM. Automatically detects Supabase and enforces secure SSL encryption (`ssl: { rejectUnauthorized: false }`).
- **`src/lib/supabase.ts`**: Initialized `@supabase/supabase-js` clients:
  - `supabase`: Public / anon client.
  - `supabaseAdmin`: Privileged server-side client using `SUPABASE_SERVICE_ROLE_KEY`.
  - `verifySupabaseToken(token)`: Helper that validates Supabase JWT tokens.
- **`src/middleware/auth.ts`**: Universal auth middleware. Accepts both Supabase Auth tokens and Firebase tokens seamlessly, extracting user identity and syncing with the database.
- **`src/db/repository.ts`**: Fully typed Drizzle ORM queries for assignments, rubrics, study blocks, announcements, calendar, and AI tutor messages.
