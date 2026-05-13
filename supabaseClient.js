import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://shqkxaqzbngobvmyifyi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oQ5Wo3UEZBhgcyp_DrMUgg_CCTKZO2j';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
