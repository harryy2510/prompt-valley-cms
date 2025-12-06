import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerClient } from '@/libs/supabase'

// ============================================
// Types
// ============================================

type CreateBucketInput = {
	allowedMimeTypes?: Array<string>
	fileSizeLimit?: number
	name: string
	public: boolean
}

type DeleteFilesInput = {
	bucketId: string
	paths: Array<string>
}

type DownloadFileInput = {
	bucketId: string
	path: string
}

type ListFilesInput = {
	bucketId: string
	limit?: number
	offset?: number
	path?: string
	search?: string
	sortBy?: { column: string; order: string }
}

type MoveFileInput = {
	bucketId: string
	fromPath: string
	toPath: string
}

type UpdateBucketInput = {
	allowedMimeTypes?: Array<string>
	fileSizeLimit?: number
	id: string
	public: boolean
}

type UploadFileInput = {
	bucketId: string
	contentType: string
	fileBase64: string
	filePath: string
	upsert?: boolean
}

// ============================================
// Bucket Operations
// ============================================

export const listBucketsServer = createServerFn({ method: 'GET' }).handler(async () => {
	const supabase = getSupabaseServerClient()
	const { data, error } = await supabase.storage.listBuckets()

	if (error) {
		throw new Error(error.message)
	}

	return { data: data || [] }
})

export const createBucketServer = createServerFn({ method: 'POST' })
	.inputValidator((data: CreateBucketInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { data: bucket, error } = await supabase.storage.createBucket(data.name, {
			allowedMimeTypes: data.allowedMimeTypes,
			fileSizeLimit: data.fileSizeLimit,
			public: data.public
		})

		if (error) {
			throw new Error(error.message)
		}

		return { data: bucket }
	})

export const updateBucketServer = createServerFn({ method: 'POST' })
	.inputValidator((data: UpdateBucketInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { error } = await supabase.storage.updateBucket(data.id, {
			allowedMimeTypes: data.allowedMimeTypes,
			fileSizeLimit: data.fileSizeLimit,
			public: data.public
		})

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const deleteBucketServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { error } = await supabase.storage.deleteBucket(data.id)

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const emptyBucketServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { bucketId: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()

		// Recursive function to delete all files in a path
		const deleteAllInPath = async (path: string): Promise<void> => {
			const { data: items } = await supabase.storage
				.from(data.bucketId)
				.list(path, { limit: 10000 })

			if (!items?.length) return

			const folders = items.filter((item) => !item.id)
			const files = items.filter((item) => item.id)

			// Delete files first
			if (files.length > 0) {
				const filesToDelete = files.map((file) => (path ? `${path}/${file.name}` : file.name))
				await supabase.storage.from(data.bucketId).remove(filesToDelete)
			}

			// Then recursively delete folder contents
			for (const folder of folders) {
				const folderPath = path ? `${path}/${folder.name}` : folder.name
				await deleteAllInPath(folderPath)
			}
		}

		await deleteAllInPath('')
		return { success: true }
	})

// ============================================
// File Operations
// ============================================

export const listFilesServer = createServerFn({ method: 'POST' })
	.inputValidator((data: ListFilesInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { data: files, error } = await supabase.storage
			.from(data.bucketId)
			.list(data.path || '', {
				limit: data.limit || 100,
				offset: data.offset || 0,
				search: data.search,
				sortBy: data.sortBy as {
					column: 'created_at' | 'name' | 'updated_at'
					order: 'asc' | 'desc'
				}
			})

		if (error) {
			throw new Error(error.message)
		}

		return { data: files || [] }
	})

export const uploadFileServer = createServerFn({ method: 'POST' })
	.inputValidator((data: UploadFileInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()

		// Convert base64 to Uint8Array
		const binaryString = atob(data.fileBase64)
		const bytes = new Uint8Array(binaryString.length)
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i)
		}

		const { data: result, error } = await supabase.storage
			.from(data.bucketId)
			.upload(data.filePath, bytes, {
				contentType: data.contentType,
				upsert: data.upsert ?? false
			})

		if (error) {
			throw new Error(error.message)
		}

		return { data: result }
	})

export const deleteFilesServer = createServerFn({ method: 'POST' })
	.inputValidator((data: DeleteFilesInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { error } = await supabase.storage.from(data.bucketId).remove(data.paths)

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const deleteFolderServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { bucketId: string; path: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()

		// Get all files in folder
		const { data: folderContents } = await supabase.storage
			.from(data.bucketId)
			.list(data.path, { limit: 10000 })

		if (folderContents?.length) {
			const filesToDelete = folderContents.map((file) => `${data.path}/${file.name}`)
			const { error } = await supabase.storage.from(data.bucketId).remove(filesToDelete)

			if (error) {
				throw new Error(error.message)
			}
		}

		return { success: true }
	})

export const moveFileServer = createServerFn({ method: 'POST' })
	.inputValidator((data: MoveFileInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { error } = await supabase.storage.from(data.bucketId).move(data.fromPath, data.toPath)

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const downloadFileServer = createServerFn({ method: 'POST' })
	.inputValidator((data: DownloadFileInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { data: blob, error } = await supabase.storage.from(data.bucketId).download(data.path)

		if (error) {
			throw new Error(error.message)
		}

		// Convert blob to base64
		const arrayBuffer = await blob.arrayBuffer()
		const bytes = new Uint8Array(arrayBuffer)
		let binary = ''
		for (const byte of bytes) {
			binary += String.fromCharCode(byte)
		}
		const base64 = btoa(binary)

		return {
			contentType: blob.type,
			data: base64,
			size: blob.size
		}
	})

export const getPublicUrlServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { bucketId: string; path: string }) => data)
	.handler(({ data }) => {
		const supabase = getSupabaseServerClient()
		const { data: urlData } = supabase.storage.from(data.bucketId).getPublicUrl(data.path)

		return { publicUrl: urlData.publicUrl }
	})

export const createSignedUrlServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { bucketId: string; expiresIn?: number; path: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { data: signedUrl, error } = await supabase.storage
			.from(data.bucketId)
			.createSignedUrl(data.path, data.expiresIn || 3600)

		if (error) {
			throw new Error(error.message)
		}

		return { signedUrl: signedUrl.signedUrl }
	})
