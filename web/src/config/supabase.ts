

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://fqpgexmkbucocyzpjqdk.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcGdleG1rYnVjb2N5enBqcWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzM5NjUsImV4cCI6MjEwNDgwOTk2NX0.yGsSf-9_fR9f1f8IBbNLWMtrbdgv9R78dOglCokFFJA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});