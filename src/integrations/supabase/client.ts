import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtnhoyrlvnotwypctrsp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bmhveXJsdm5vdHd5cGN0cnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODEyMDgsImV4cCI6MjA3ODQ1NzIwOH0.iNCaOqkkbUt3Io5S0Kcayi8uml8J8uwd2XSpnax-Ba8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);