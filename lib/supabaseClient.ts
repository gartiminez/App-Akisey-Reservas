import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhmybxuscpdfcxmipwti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobXlieHVzY3BkZmN4bWlwd3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTgwNzYsImV4cCI6MjA3MzM3NDA3Nn0.7yl2hQZDtnAr2xe44tfwJvuHmOg1kaKklV4e1DgYBl0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
