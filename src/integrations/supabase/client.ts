// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xqdojffekpgqoteemjwc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZG9qZmZla3BncW90ZWVtandjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDY2ODYsImV4cCI6MjA2MzkyMjY4Nn0.5JgLRn-lETfDi2lPK_O1Bn9Xbh63B__SyTAZroEoYXc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);