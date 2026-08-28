import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqfbjtcuabqgfotqtfea.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZmJqdGN1YWJxZ2ZvdHF0ZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjA5NjYsImV4cCI6MjEwMzQ5Njk2Nn0.iEsWCXJIsolcnv5TAXTP3J4rHq4LTGIaJDiAzoJrpJg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
