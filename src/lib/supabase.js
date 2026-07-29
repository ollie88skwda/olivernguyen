import { createClient } from '@supabase/supabase-js';

// One client for the whole app. /major and /apply keep separate stores on purpose,
// but two createClient calls against the same storage key make GoTrue warn about
// concurrent instances with undefined behaviour, so the client itself is shared.
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default supabase;
