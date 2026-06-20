// =====================================================================
// Fleet Hub — Supabase connection
//
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your "Project URL" and "anon public" key below
// =====================================================================

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
