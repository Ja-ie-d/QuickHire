import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jbgroqozrlptdfkilpuk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ3JvcW96cmxwdGRma2lscHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MTM2MDQsImV4cCI6MjA2MTE4OTYwNH0.irAl8t1KPlKABw7ow7FT-ebMUznSSeu9hEoEj1t0p-8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});