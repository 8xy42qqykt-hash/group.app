import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load credentials from environment or localStorage
const envUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
const envKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let storedUrl: string | null = null;
let storedKey: string | null = null;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    storedUrl = localStorage.getItem('trip_supabase_url');
    storedKey = localStorage.getItem('trip_supabase_anon_key');
  }
} catch {
  // localStorage may be disabled
}

export const supabaseUrl = storedUrl || envUrl || '';
export const supabaseAnonKey = storedKey || envKey || '';

export const isCloudSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export function saveSupabaseCredentials(url: string, key: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('trip_supabase_url', url.trim());
      localStorage.setItem('trip_supabase_anon_key', key.trim());
      window.location.reload();
    }
  } catch {
    // Ignore
  }
}

export function clearSupabaseCredentials() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('trip_supabase_url');
      localStorage.removeItem('trip_supabase_anon_key');
      window.location.reload();
    }
  } catch {
    // Ignore
  }
}

// Create real client if configured
let realClient: SupabaseClient | null = null;
if (isCloudSupabaseConfigured) {
  try {
    realClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = realClient;
export const isCloudActive = Boolean(realClient);

// Storage helper for uploading images (avatars, chat attachments)
export async function uploadAsset(file: File | Blob, folder = 'chat'): Promise<string> {
  if (realClient) {
    const ext = ('name' in file ? (file as File).name.split('.').pop() : 'jpg') || 'jpg';
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const { error: uploadError } = await realClient.storage
      .from('trip-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.warn('Storage upload error, falling back to base64 preview:', uploadError);
    } else {
      const { data } = realClient.storage.from('trip-assets').getPublicUrl(filePath);
      return data.publicUrl;
    }
  }

  // Fallback: convert to base64 Data URL for instant preview
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
