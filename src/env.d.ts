/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Extend Astro.locals with our custom types
declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
    supabase: import('@supabase/supabase-js').SupabaseClient;
  }
}
