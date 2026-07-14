# SupaFlow - Premium Kanban & Project Management SaaS

SupaFlow is a modern, commercial-grade project management application designed for visual excellence and high performance. It features a complete task management workflow with projects list, real-time board updates, user auth, storage bucket attachments, and database Row Level Security (RLS).

---

## Technical Stack

- **Frontend Framework**: React 19 (latest) & Vite 8
- **Styling**: TailwindCSS v4 & Custom Glassmorphic Theme
- **Database & Auth**: Supabase (PostgreSQL, Storage, Realtime, RLS policies)
- **Routing**: React Router DOM v7
- **Forms & Validation**: React Hook Form, Zod & `@hookform/resolvers`
- **State & Sync**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Icons**: Lucide Icons

---

## Folder Structure

```text
src/
├── assets/          # Static assets
├── components/      # Common & protective routes
│   └── ui/          # Dialog modals, skeleton loaders
├── contexts/        # Auth, Theme, and custom Toasts providers
├── hooks/           # useAuth, useTasks (Query/Mutation hooks)
├── layouts/         # Main workspace shell & Auth layouts
├── lib/             # Supabase client instance
├── pages/           # Auth, Dashboard, Details, Profile, Settings, 404
├── services/        # taskService database API layer
├── utils/           # Helper utility scripts
├── App.jsx          # Route mapping & Providers
├── index.css        # Tailwind v4 import & Custom Theme styling
└── main.jsx         # App mounting entrypoint
```

---

## Database Configuration (SQL)

The Postgres tables and storage buckets are configured with RLS policies, triggered syncs, and automated timestamps. The schema file `supabase_schema.sql` contains the complete SQL script.

### Key Tables
1. `profiles`: Synchronized with `auth.users` on signups.
2. `projects`: Workspaces owned by users.
3. `tasks`: Issues mapped to status (`backlog`, `todo`, `in_progress`, `done`) and priority (`low`, `medium`, `high`).
4. `comments`: Comment threads.
5. `attachments`: Files mapped to task and uploaded to `attachments` storage bucket.

---

## Installation & Local Startup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 3. Install Dependencies
Run the command below in your project folder:
```bash
npm install
```

### 4. Execute Server
Launch the local dev environment:
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## Production Deployment Guide

### Vercel / Netlify Deployment
1. Import your repository into Vercel or Netlify.
2. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Configure build command:
   ```bash
   npm run build
   ```
4. Output directory:
   `dist`
5. Click **Deploy**.

### Supabase Storage Bucket & CORS Check
If you encounter issues viewing or uploading task attachments, verify that:
1. The `attachments` storage bucket is set to **Public**.
2. The storage RLS policies in `supabase_schema.sql` are active.
