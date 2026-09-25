/* ==========================================================================
   SUPABASE CLIENT
   Paste your own project's values below (Dashboard → Project Settings → API).
   The "anon" key is meant to be public — it's safe to ship in frontend code
   as long as your Row Level Security policies (see supabase/schema.sql) are
   in place. NEVER put your "service_role" key in frontend code.
   ========================================================================== */

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LISTINGS_BUCKET = "listing-images";
