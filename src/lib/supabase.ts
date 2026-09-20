import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqdetetmhuznlpkibuyj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZGV0ZXRtaHV6bmxwa2lidXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg2NjUsImV4cCI6MjEwNTQ4NDY2NX0.fyckH7Aw2Paljj4W5ST-ZxBkCRKmBYHvjD_vsTFg4lI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
