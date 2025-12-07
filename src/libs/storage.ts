import { deleteFilesServer, uploadFileServer } from '@/actions/storage'
import { getSupabaseBrowserClient } from '@/libs/supabase/client'

/**
 * Delete an image from the content-bucket
 * @param path - The path to the file to delete
 * @returns True if successful, false otherwise
 */
export async function deleteImage(path: string): Promise<boolean> {
	try {
		await deleteFilesServer({
			data: { bucketId: 'content-bucket', paths: [path] }
		})
		return true
	} catch (error) {
		console.error('Delete exception:', error)
		return false
	}
}

/**
 * Get the display URL for an image - handles both full URLs and bucket paths
 * @param value - Either a full URL or a path within the content-bucket
 * @returns The full public URL or null if value is empty
 */
export function getImageUrl(value: null | string | undefined): null | string {
	if (!value) return null

	// If it's already a full URL, return as-is
	if (isFullUrl(value)) {
		return value
	}

	// Use Supabase browser client to get public URL
	const supabase = getSupabaseBrowserClient()
	const { data } = supabase.storage.from('content-bucket').getPublicUrl(value)
	return data.publicUrl
}

/**
 * Check if a string is a bucket path (not a full URL)
 */
export function isBucketPath(value: null | string | undefined): boolean {
	if (!value) return false
	return !isFullUrl(value)
}

/**
 * Check if a string is a full URL (http/https)
 */
export function isFullUrl(value: null | string | undefined): boolean {
	if (!value) return false
	return value.startsWith('http://') || value.startsWith('https://')
}

/**
 * Upload an image to the content-bucket
 * @param file - The file to upload
 * @param folder - The folder path (e.g., 'logos', 'images/prompts')
 * @returns The path to the uploaded file or null if failed
 */
export async function uploadImage(file: File, folder: string): Promise<null | string> {
	try {
		const fileExt = file.name.split('.').pop()
		const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
		const filePath = `${folder}/${fileName}`

		// Convert file to base64
		const arrayBuffer = await file.arrayBuffer()
		const bytes = new Uint8Array(arrayBuffer)
		let binary = ''
		for (const byte of bytes) {
			binary += String.fromCharCode(byte)
		}
		const base64 = btoa(binary)

		await uploadFileServer({
			data: {
				bucketId: 'content-bucket',
				contentType: file.type,
				fileBase64: base64,
				filePath
			}
		})

		return filePath
	} catch (error) {
		console.error('Upload exception:', error)
		return null
	}
}
