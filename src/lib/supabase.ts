import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('Supabase credentials not found or using placeholders. Authentication will not work until .env is configured.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
