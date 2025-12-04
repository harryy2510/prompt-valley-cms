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

/**
 * Upload an image to the content-bucket
 * @param file - The file to upload
 * @param folder - The folder path (e.g., 'logos', 'images/prompts')
 * @returns The path to the uploaded file or null if failed
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error } = await supabase.storage
      .from('content-bucket')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    return filePath
  } catch (error) {
    console.error('Upload exception:', error)
    return null
  }
}

/**
 * Delete an image from the content-bucket
 * @param path - The path to the file to delete
 * @returns True if successful, false otherwise
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('content-bucket')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}
