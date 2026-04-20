import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://habwmiaiahevujwmfxoh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYndtaWFpYWhldnVqd21meG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDUyNzYsImV4cCI6MjA2ODMyMTI3Nn0.jeJhITobvRdgMOzgakHLAX_qaFkzTFXQyT9_y22eJ2Y';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
