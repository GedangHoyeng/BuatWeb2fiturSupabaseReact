import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingVars = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

if (missingVars.length > 0) {
  console.error(
    `[SupaFlow] Missing environment variables: ${missingVars.join(', ')}.\n` +
    'Create a .env file in the project root with:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'For Vercel deployment, add these in Project Settings > Environment Variables.'
  );
}

if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn(
    '[SupaFlow] VITE_SUPABASE_ANON_KEY does not look like a standard Supabase anon key.\n' +
    'Expected format: JWT token starting with "eyJ".\n' +
    'Find your correct anon key at: Supabase Dashboard > Settings > API > Project API keys > anon public'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
