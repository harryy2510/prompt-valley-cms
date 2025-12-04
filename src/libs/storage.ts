import { supabase } from './supabase'

/**
 * Get the full public URL for an image in the content-bucket
 * @param path - The path/filename within the content-bucket
 * @returns The full public URL or null if path is empty
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null

  const { data } = supabase.storage.from('content-bucket').getPublicUrl(path)

  return data.publicUrl
}
