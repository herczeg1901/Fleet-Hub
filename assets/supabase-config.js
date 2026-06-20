// =====================================================================
// Fleet Hub — Supabase connection
//
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your "Project URL" and "anon public" key below
// =====================================================================

const SUPABASE_URL = "https://ekqiksvlrsevzhajwkqf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QzvYM9Ssjjco9U2-qTaeJQ_BfCSWeJT";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
