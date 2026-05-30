import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { envValue } from '@/server/env';
import type { Database } from '@/types/supabase';

type ServerSupabaseClient = ReturnType<typeof createClient<Database, 'public'>>;

const adminClients = new Map<string, ServerSupabaseClient>();

export function isSupabaseServerConfigured(c?: Context): boolean {
  return Boolean(envValue('VITE_SUPABASE_URL', c) && envValue('SUPABASE_SERVICE_ROLE_KEY', c));
}

export function getSupabaseAdminClient(c?: Context): ServerSupabaseClient {
  const supabaseUrl = envValue('VITE_SUPABASE_URL', c);
  const serviceRoleKey = envValue('SUPABASE_SERVICE_ROLE_KEY', c);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server config is missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const cacheKey = `${supabaseUrl}:${serviceRoleKey.slice(0, 10)}`;
  const cached = adminClients.get(cacheKey);
  if (cached) {
    return cached;
  }

  const adminClient = createClient<Database, 'public'>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  adminClients.set(cacheKey, adminClient);

  return adminClient;
}
