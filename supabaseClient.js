import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con tus credenciales de Supabase
export const supabaseUrl = 'https://ozlqfcdvjwhhmsmtrzhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bHFmY2R2andoaG1zbXRyemh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODU1NjYsImV4cCI6MjA1NTY2MTU2Nn0.xafkWDP8K5m7ZdePmS8BSBZ3vov92MSp_kNcNVqQgJk';

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);