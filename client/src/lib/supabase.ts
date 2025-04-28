import { createClient } from '@supabase/supabase-js';

// Menggunakan variabel lingkungan yang telah disediakan dengan fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImZha2Vfa2V5X2lkIiwidHlwIjoiSldUIn0.e30.fake-jwt-token';

console.log('Client Supabase Configuration:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseAnonKey 
});

// Create a Supabase client dengan opsi konfigurasi tambahan
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
