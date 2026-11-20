# Deploying EduTrack AI to Vercel

This repository is fully configured for deployment on **[Vercel](https://vercel.com)**:
- **Vite React Frontend**: Automatically compiled to `dist/` and served over Vercel's global CDN with edge caching.
- **Express Backend API**: Deployed as a high-performance Vercel Serverless Function via [`api/index.ts`](api/index.ts).

---

## Method 1: Deploy via GitHub (Recommended - 2 Minutes)

Because this repository is already connected to GitHub:
1. Push the latest changes to your repository:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment with serverless API"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New...** -> **Project**.
4. Import your **`EduTrack-AI`** GitHub repository.
5. In the **Environment Variables** section, add your production keys (see below).
6. Click **Deploy**. Vercel will build the frontend and serverless API automatically.

---

## Method 2: Deploy via Vercel CLI

Run in your terminal:
```bash
npx vercel
```
- When asked `Set up and deploy?`, type `y`.
- Link to your Vercel account / team.
- Keep the default settings (they will automatically detect `vercel.json`).

To deploy directly to production:
```bash
npx vercel --prod
```

---

## Required Environment Variables in Vercel

In your Vercel Project Settings -> **Environment Variables**, add:

| Variable | Description | Example / Location |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini AI Key | Google AI Studio |
| `APP_URL` | Your live deployment URL | `https://your-app.vercel.app` |
| `DATABASE_URL` | Supabase PostgreSQL URI | Supabase -> Settings -> Database -> Connection string |
| `SUPABASE_URL` | Supabase Project URL | Supabase -> Settings -> API -> Project URL |
| `SUPABASE_ANON_KEY` | Supabase Public Anon Key | Supabase -> Settings -> API -> anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret Service Role Key | Supabase -> Settings -> API -> service_role key |
| `VITE_SUPABASE_URL` | Frontend Supabase URL | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Frontend Anon Key | Same as `SUPABASE_ANON_KEY` |

---

## Verification After Deployment

Once deployed, you can verify your live app:
- Frontend: `https://<your-project>.vercel.app`
- API Health Check: `https://<your-project>.vercel.app/api/health`
- Supabase Status Check: `https://<your-project>.vercel.app/api/supabase/status`
