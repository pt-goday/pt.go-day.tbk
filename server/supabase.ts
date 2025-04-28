import { createClient } from '@supabase/supabase-js';

// Menggunakan variabel lingkungan yang telah disediakan dengan fallback
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImZha2Vfa2V5X2lkIiwidHlwIjoiSldUIn0.e30.fake-jwt-token';

console.log('Server Supabase Configuration:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseKey 
});

// Create a Supabase client dengan konfigurasi tambahan
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Export for use in storage.ts with Drizzle
export default supabase;
