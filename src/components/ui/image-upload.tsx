import { AlertCircle, FolderOpen, ImageIcon, Upload, X } from 'lucide-react'
import pLimit from 'p-limit'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Image } from '@/components/ui/image'
import { cn } from '@/libs/cn'
import { deleteImage, getImageUrl, isBucketPath, isFullUrl, uploadImage } from '@/libs/storage'

import { Button } from './button'
import { MediaPickerDialog } from './media-picker-dialog'
import { Textarea } from './textarea'

type ImageItem = {
	/** The bucket path (available after upload completes) */
	bucketPath: null | string
	/** The display URL (either preview blob URL or final supabase URL) */
	displayUrl: string
	/** Error message if failed */
	error?: string
	id: string
	/** Original preview blob URL to revoke later */
	previewBlobUrl?: string
	/** Upload progress 0-100 */
	progress: number
	/** Upload status */
	status: UploadStatus
}

type ImageUploadProps = {
	accept?: string
	allowBrowseBucket?: boolean
	allowLinkInput?: boolean
	folder: string
	label?: string
	linkPlaceholder?: string
	mode?: 'create' | 'edit'
	onChange: (value: null | string) => void
	value?: null | string
}

type UploadStatus = 'error' | 'success' | 'uploading'

export function ImageUpload({
	accept = 'image/*',
	allowBrowseBucket = true,
	allowLinkInput = true,
	folder,
	label = 'Upload Image',
	linkPlaceholder = 'https://example.com/image.png or bucket/path.png',
	mode = 'create',
	onChange,
	value
}: ImageUploadProps) {
	const [imageItem, setImageItem] = useState<ImageItem | null>(null)
	const [isDragOver, setIsDragOver] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [linkInput, setLinkInput] = useState('')
	const [showLinkInput, setShowLinkInput] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Sync external value to internal state
	useEffect(() => {
		if (value && !imageItem) {
			// External value exists but no internal state - create completed item
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setImageItem({
				bucketPath: value,
				displayUrl: getImageUrl(value) || value,
				id: 'external',
				progress: 100,
				status: 'success'
			})
		} else if (!value && imageItem?.status === 'success') {
			// External value cleared - clear internal state
			setImageItem(null)
		}
	}, [imageItem, value])

	// Track visibility with IntersectionObserver
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
			threshold: 0.1
		})

		observer.observe(container)
		return () => observer.disconnect()
	}, [])

	const handleFileChange = useCallback(
		async (file: File) => {
			if (!file) return

			const uploadId = Math.random().toString(36).substring(2)
			const previewBlobUrl = URL.createObjectURL(file)

			// Create item immediately with preview
			setImageItem({
				bucketPath: null,
				displayUrl: previewBlobUrl,
				id: uploadId,
				previewBlobUrl,
				progress: 0,
				status: 'uploading'
			})

			// Simulate progress
			const progressInterval = setInterval(() => {
				setImageItem((prev) => {
					if (!prev || prev.status !== 'uploading') return prev
					return { ...prev, progress: Math.min(prev.progress + 10, 90) }
				})
			}, 100)

			const filePath = await uploadImage(file, folder)
			clearInterval(progressInterval)

			if (filePath) {
				const finalUrl = getImageUrl(filePath) || filePath
				setImageItem((prev) =>
					prev
						? {
								...prev,
								bucketPath: filePath,
								displayUrl: finalUrl,
								progress: 100,
								status: 'success'
							}
						: null
				)
				onChange(filePath)
				// Revoke blob URL after transition
				setTimeout(() => URL.revokeObjectURL(previewBlobUrl), 500)
			} else {
				setImageItem((prev) =>
					prev ? { ...prev, error: 'Upload failed', progress: 0, status: 'error' } : null
				)
			}
		},
		[folder, onChange]
	)

	const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) await handleFileChange(file)
		e.target.value = ''
	}

	const handleDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragOver(false)

			const file = e.dataTransfer.files?.[0]
			if (file?.type.startsWith('image/')) {
				await handleFileChange(file)
			}
		},
		[handleFileChange]
	)

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
	}, [])

	// Handle paste when visible and no input focused
	useEffect(() => {
		const handlePaste = async (e: ClipboardEvent) => {
			if (!isVisible) return
			const active = document.activeElement
			if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return
			if (value || imageItem) return

			const items = e.clipboardData?.items
			if (!items) return

			for (const item of Array.from(items)) {
				if (item.type.startsWith('image/')) {
					e.preventDefault()
					const file = item.getAsFile()
					if (file) await handleFileChange(file)
					return
				}
			}
		}

		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [isVisible, value, imageItem, handleFileChange])

	const handleRemove = () => {
		if (!imageItem) return

		const pathToDelete = imageItem.bucketPath
		if (imageItem.previewBlobUrl) {
			URL.revokeObjectURL(imageItem.previewBlobUrl)
		}

		setImageItem(null)
		onChange(null)

		if (mode === 'create' && pathToDelete && isBucketPath(pathToDelete)) {
			void deleteImage(pathToDelete)
		}
	}

	const handleLinkSubmit = () => {
		const trimmed = linkInput.trim()
		if (trimmed) {
			setImageItem({
				bucketPath: trimmed,
				displayUrl: getImageUrl(trimmed) || trimmed,
				id: 'link',
				progress: 100,
				status: 'success'
			})
			onChange(trimmed)
			setLinkInput('')
			setShowLinkInput(false)
		}
	}

	const handleRetry = () => {
		if (imageItem?.previewBlobUrl) {
			URL.revokeObjectURL(imageItem.previewBlobUrl)
		}
		setImageItem(null)
	}

	const getSourceLabel = () => {
		if (!imageItem?.bucketPath) return null
		return isFullUrl(imageItem.bucketPath) ? 'External URL' : 'Bucket Path'
	}

	const itemClassName = 'flex items-center gap-3 rounded-md border p-3'

	return (
		<div className="space-y-2" ref={containerRef}>
			{/* Image item - shows during upload and after completion */}
			{imageItem && (
				<div className={itemClassName}>
					<div className="relative size-12 rounded border overflow-hidden shrink-0 bg-muted">
						<Image alt="Preview" className="size-full object-contain" src={imageItem.displayUrl} />
						{/* Upload overlay */}
						{imageItem.status === 'uploading' && (
							<div className="absolute inset-0 bg-background/60 flex items-center justify-center">
								<div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
							</div>
						)}
						{/* Error overlay */}
						{imageItem.status === 'error' && (
							<div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
								<AlertCircle className="size-5 text-destructive" />
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0">
						{imageItem.status === 'uploading' && (
							<>
								<div className="flex items-center gap-2">
									<p className="text-xs text-muted-foreground">Uploading...</p>
									<span className="text-xs text-muted-foreground">{imageItem.progress}%</span>
								</div>
								<div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
									<div
										className="h-full bg-primary transition-all duration-200"
										style={{ width: `${imageItem.progress}%` }}
									/>
								</div>
							</>
						)}
						{imageItem.status === 'success' && (
							<>
								<p className="text-xs text-muted-foreground truncate">{imageItem.bucketPath}</p>
								<p className="text-xs font-medium text-primary">{getSourceLabel()}</p>
							</>
						)}
						{imageItem.status === 'error' && (
							<>
								<p className="text-xs text-destructive">{imageItem.error}</p>
								<button
									className="text-xs text-primary hover:underline"
									onClick={handleRetry}
									type="button"
								>
									Try again
								</button>
							</>
						)}
					</div>
					{/* Only show delete button when not uploading */}
					{imageItem.status !== 'uploading' && (
						<Button
							className="shrink-0 size-8"
							onClick={handleRemove}
							size="icon"
							type="button"
							variant="ghost"
						>
							<X className="size-4" />
						</Button>
					)}
				</div>
			)}

			{/* Drop zone - only show when no image */}
			{!imageItem && (
				<div
					className={cn(
						'relative border-2 border-dashed rounded-lg p-4 transition-colors',
						'flex items-center gap-4',
						'hover:border-primary/50 hover:bg-muted/50',
						isDragOver && 'border-primary bg-primary/5'
					)}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					<div className="rounded-full bg-muted p-2 shrink-0">
						<ImageIcon className="size-5 text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium">{label}</p>
						<p className="text-xs text-muted-foreground">
							Drop or paste image, or{' '}
							<button
								className="text-primary hover:underline"
								onClick={(e) => {
									e.stopPropagation()
									fileInputRef.current?.click()
								}}
								type="button"
							>
								browse files
							</button>
						</p>
					</div>
					{allowBrowseBucket && (
						<MediaPickerDialog
							onSelect={(paths) => {
								if (paths.length > 0) {
									const path = paths[0]
									setImageItem({
										bucketPath: path,
										displayUrl: getImageUrl(path) || path,
										id: 'media-picker',
										progress: 100,
										status: 'success'
									})
									onChange(path)
								}
							}}
						>
							<Button size="sm" type="button" variant="outline">
								<FolderOpen className="size-4 mr-2" />
								Browse from Bucket
							</Button>
						</MediaPickerDialog>
					)}
					<input
						accept={accept}
						className="hidden"
						onChange={handleInputChange}
						ref={fileInputRef}
						type="file"
					/>
				</div>
			)}

			{/* Link input toggle */}
			{allowLinkInput && !imageItem && (
				<>
					{!showLinkInput ? (
						<button
							className="text-xs text-muted-foreground hover:text-primary transition-colors"
							onClick={() => setShowLinkInput(true)}
							type="button"
						>
							Or enter URL / bucket path
						</button>
					) : (
						<div className="space-y-2">
							<div className="flex gap-2">
								<input
									className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									onChange={(e) => setLinkInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleLinkSubmit()
										}
										if (e.key === 'Escape') {
											setShowLinkInput(false)
											setLinkInput('')
										}
									}}
									placeholder={linkPlaceholder}
									type="text"
									value={linkInput}
								/>
								<Button
									disabled={!linkInput.trim()}
									onClick={handleLinkSubmit}
									size="sm"
									type="button"
								>
									Add
								</Button>
							</div>
							<button
								className="text-xs text-muted-foreground hover:text-primary transition-colors"
								onClick={() => {
									setShowLinkInput(false)
									setLinkInput('')
								}}
								type="button"
							>
								Cancel
							</button>
						</div>
					)}
				</>
			)}
		</div>
	)
}

/**
 * Parse multiple URLs/paths from a string (separated by newlines or commas)
 */
function parseMultiplePaths(input: string): Array<string> {
	return input
		.split(/[\n,]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
}

// Concurrency limit for parallel uploads
const uploadLimit = pLimit(5)

/**
 * Multi-image upload component - seamless upload experience with parallel uploads
 */
type ImagesUploadProps = {
	accept?: string
	allowBrowseBucket?: boolean
	allowLinkInput?: boolean
	folder: string
	label?: string
	linkPlaceholder?: string
	mode?: 'create' | 'edit'
	onChange: (value: Array<string>) => void
	value?: Array<string>
}

export function ImagesUpload({
	accept = 'image/*',
	allowBrowseBucket = true,
	allowLinkInput = true,
	folder,
	label = 'Add Images',
	linkPlaceholder = 'Paste URLs or paths (one per line)',
	mode = 'create',
	onChange,
	value = []
}: ImagesUploadProps) {
	// Track all images (both uploading and completed) in a single list
	const [images, setImages] = useState<Array<ImageItem>>([])
	const [isDragOver, setIsDragOver] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [linkInput, setLinkInput] = useState('')
	const [showLinkInput, setShowLinkInput] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Use ref to always have current value for async operations
	const valueRef = useRef(value)

	useEffect(() => {
		valueRef.current = value
	}, [value])

	// Sync external value to internal state on mount and when value changes externally
	useEffect(() => {
		// Get current successful bucket paths from internal state
		const internalPaths = new Set(
			images
				.filter((img) => img.status === 'success' && img.bucketPath)
				.map((img) => img.bucketPath)
		)

		// Get paths from external value
		const externalPaths = new Set(value)

		// Check if external value has items not in internal state
		const newExternalPaths = value.filter((path) => !internalPaths.has(path))

		// Check if internal state has items removed from external value
		const removedPaths = [...internalPaths].filter((path) => path && !externalPaths.has(path))

		if (newExternalPaths.length > 0 || removedPaths.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setImages((prev) => {
				// Keep uploading items and items still in external value
				const kept = prev.filter(
					(img) =>
						img.status === 'uploading' || (img.bucketPath && externalPaths.has(img.bucketPath))
				)

				// Add new external items
				const newItems: Array<ImageItem> = newExternalPaths.map((path) => ({
					bucketPath: path,
					displayUrl: getImageUrl(path) || path,
					id: `external-${path}`,
					progress: 100,
					status: 'success' as const
				}))

				return [...kept, ...newItems]
			})
		}
	}, [images, value])

	// Track visibility with IntersectionObserver
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
			threshold: 0.1
		})

		observer.observe(container)
		return () => observer.disconnect()
	}, [])

	const handleFilesChange = useCallback(
		async (files: Array<File> | FileList) => {
			if (!files || files.length === 0) return

			const fileArray = Array.from(files)

			// Create items for all files immediately with previews
			const newItems: Array<ImageItem> = fileArray.map((file) => {
				const previewBlobUrl = URL.createObjectURL(file)
				return {
					bucketPath: null,
					displayUrl: previewBlobUrl,
					id: Math.random().toString(36).substring(2),
					previewBlobUrl,
					progress: 0,
					status: 'uploading' as const
				}
			})

			// Add all items to state immediately
			setImages((prev) => [...prev, ...newItems])

			// Upload all files in parallel with concurrency limit
			const uploadPromises = fileArray.map((file, index) => {
				const itemId = newItems[index].id
				const previewBlobUrl = newItems[index].previewBlobUrl!

				return uploadLimit(async () => {
					// Simulate progress
					const progressInterval = setInterval(() => {
						setImages((prev) =>
							prev.map((img) =>
								img.id === itemId && img.status === 'uploading'
									? { ...img, progress: Math.min(img.progress + 15, 90) }
									: img
							)
						)
					}, 100)

					const filePath = await uploadImage(file, folder)
					clearInterval(progressInterval)

					if (filePath) {
						const finalUrl = getImageUrl(filePath) || filePath

						// Update this item to success
						setImages((prev) =>
							prev.map((img) =>
								img.id === itemId
									? {
											...img,
											bucketPath: filePath,
											displayUrl: finalUrl,
											progress: 100,
											status: 'success' as const
										}
									: img
							)
						)

						// Revoke blob URL after a short delay
						setTimeout(() => URL.revokeObjectURL(previewBlobUrl), 500)

						return filePath
					} else {
						setImages((prev) =>
							prev.map((img) =>
								img.id === itemId
									? {
											...img,
											error: 'Upload failed',
											progress: 0,
											status: 'error' as const
										}
									: img
							)
						)
						return null
					}
				})
			})

			// Wait for all uploads to complete
			const results = await Promise.all(uploadPromises)

			// Filter successful uploads and update parent value once
			const successfulPaths = results.filter((path): path is string => path !== null)

			if (successfulPaths.length > 0) {
				// Use ref to get current value to avoid stale closure
				onChange([...valueRef.current, ...successfulPaths])
			}
		},
		[folder, onChange]
	)

	const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (files && files.length > 0) {
			await handleFilesChange(files)
		}
		e.target.value = ''
	}

	const handleDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragOver(false)

			const files = e.dataTransfer.files
			const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
			if (imageFiles.length > 0) {
				await handleFilesChange(imageFiles)
			}
		},
		[handleFilesChange]
	)

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
	}, [])

	// Handle paste when visible and no input focused
	useEffect(() => {
		const handlePaste = async (e: ClipboardEvent) => {
			if (!isVisible) return
			const active = document.activeElement
			if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return

			const items = e.clipboardData?.items
			if (!items) return

			const imageFiles: Array<File> = []
			for (const item of Array.from(items)) {
				if (item.type.startsWith('image/')) {
					const file = item.getAsFile()
					if (file) imageFiles.push(file)
				}
			}

			if (imageFiles.length > 0) {
				e.preventDefault()
				await handleFilesChange(imageFiles)
			}
		}

		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [isVisible, handleFilesChange])

	const handleRemove = (itemId: string) => {
		const item = images.find((img) => img.id === itemId)
		if (!item) return

		// Revoke blob URL if exists
		if (item.previewBlobUrl) {
			URL.revokeObjectURL(item.previewBlobUrl)
		}

		// Remove from internal state
		setImages((prev) => prev.filter((img) => img.id !== itemId))

		// Update parent value
		if (item.bucketPath) {
			onChange(valueRef.current.filter((path) => path !== item.bucketPath))

			// Delete from bucket in create mode
			if (mode === 'create' && isBucketPath(item.bucketPath)) {
				void deleteImage(item.bucketPath)
			}
		}
	}

	const handleRetry = (itemId: string) => {
		const item = images.find((img) => img.id === itemId)
		if (item?.previewBlobUrl) {
			URL.revokeObjectURL(item.previewBlobUrl)
		}
		setImages((prev) => prev.filter((img) => img.id !== itemId))
	}

	const handleLinksSubmit = () => {
		const paths = parseMultiplePaths(linkInput)
		if (paths.length > 0) {
			const newItems: Array<ImageItem> = paths.map((path) => ({
				bucketPath: path,
				displayUrl: getImageUrl(path) || path,
				id: `link-${Math.random().toString(36).substring(2)}`,
				progress: 100,
				status: 'success' as const
			}))

			setImages((prev) => [...prev, ...newItems])
			onChange([...valueRef.current, ...paths])
			setLinkInput('')
			setShowLinkInput(false)
		}
	}

	const parsedLinks = parseMultiplePaths(linkInput)
	const itemClassName = 'flex items-center gap-3 rounded-md border p-3'

	return (
		<div className="space-y-3" ref={containerRef}>
			{/* Drop zone */}
			<div
				className={cn(
					'relative border-2 border-dashed rounded-lg p-4 transition-colors',
					'flex items-center gap-4',
					'hover:border-primary/50 hover:bg-muted/50',
					isDragOver && 'border-primary bg-primary/5'
				)}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div className="rounded-full bg-muted p-2 shrink-0">
					<Upload className="size-5 text-muted-foreground" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium">{label}</p>
					<p className="text-xs text-muted-foreground">
						Drop or paste images, or{' '}
						<button
							className="text-primary hover:underline"
							onClick={(e) => {
								e.stopPropagation()
								fileInputRef.current?.click()
							}}
							type="button"
						>
							browse files
						</button>
					</p>
				</div>
				{allowBrowseBucket && (
					<MediaPickerDialog
						multiple
						onSelect={(paths) => {
							if (paths.length > 0) {
								const newItems: Array<ImageItem> = paths.map((path) => ({
									bucketPath: path,
									displayUrl: getImageUrl(path) || path,
									id: `media-picker-${Math.random().toString(36).substring(2)}`,
									progress: 100,
									status: 'success' as const
								}))
								setImages((prev) => [...prev, ...newItems])
								onChange([...valueRef.current, ...paths])
							}
						}}
					>
						<Button size="sm" type="button" variant="outline">
							<FolderOpen className="size-4 mr-2" />
							Browse from Bucket
						</Button>
					</MediaPickerDialog>
				)}
				<input
					accept={accept}
					className="hidden"
					multiple
					onChange={handleInputChange}
					ref={fileInputRef}
					type="file"
				/>
			</div>

			{/* Link input */}
			{allowLinkInput && (
				<>
					{!showLinkInput ? (
						<button
							className="text-xs text-muted-foreground hover:text-primary transition-colors"
							onClick={() => setShowLinkInput(true)}
							type="button"
						>
							Or add URLs / bucket paths
						</button>
					) : (
						<div className="space-y-2 rounded-md border p-3">
							<p className="text-xs text-muted-foreground">
								Enter URLs or bucket paths (one per line or comma-separated)
							</p>
							<Textarea
								className="font-mono text-sm"
								onChange={(e) => setLinkInput(e.target.value)}
								placeholder={linkPlaceholder}
								rows={3}
								value={linkInput}
							/>
							{parsedLinks.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{parsedLinks.map((link, idx) => {
										const imgUrl = getImageUrl(link) || link
										return (
											<Image
												alt={`Preview ${idx + 1}`}
												className="size-10 rounded border object-contain bg-muted"
												key={idx}
												onError={(e) => {
													;(e.target as HTMLImageElement).style.opacity = '0.3'
												}}
												src={imgUrl}
											/>
										)
									})}
								</div>
							)}
							<div className="flex items-center gap-2">
								<Button
									disabled={parsedLinks.length === 0}
									onClick={handleLinksSubmit}
									size="sm"
									type="button"
								>
									Add {parsedLinks.length > 1 ? `${parsedLinks.length} Links` : 'Link'}
								</Button>
								<Button
									onClick={() => {
										setShowLinkInput(false)
										setLinkInput('')
									}}
									size="sm"
									type="button"
									variant="ghost"
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			{/* All images - unified list for uploading and completed */}
			{images.length > 0 && (
				<div className="space-y-2">
					{images.map((item) => (
						<div className={itemClassName} key={item.id}>
							<div className="relative size-12 rounded border overflow-hidden shrink-0 bg-muted">
								<Image alt="Preview" className="size-full object-contain" src={item.displayUrl} />
								{/* Upload overlay */}
								{item.status === 'uploading' && (
									<div className="absolute inset-0 bg-background/60 flex items-center justify-center">
										<div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
									</div>
								)}
								{/* Error overlay */}
								{item.status === 'error' && (
									<div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
										<AlertCircle className="size-5 text-destructive" />
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								{item.status === 'uploading' && (
									<>
										<div className="flex items-center gap-2">
											<p className="text-xs text-muted-foreground">Uploading...</p>
											<span className="text-xs text-muted-foreground">{item.progress}%</span>
										</div>
										<div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
											<div
												className="h-full bg-primary transition-all duration-200"
												style={{ width: `${item.progress}%` }}
											/>
										</div>
									</>
								)}
								{item.status === 'success' && (
									<>
										<p className="text-xs text-muted-foreground truncate">{item.bucketPath}</p>
										<p className="text-xs font-medium text-primary">
											{item.bucketPath && isFullUrl(item.bucketPath)
												? 'External URL'
												: 'Bucket Path'}
										</p>
									</>
								)}
								{item.status === 'error' && (
									<>
										<p className="text-xs text-destructive">{item.error}</p>
										<button
											className="text-xs text-primary hover:underline"
											onClick={() => handleRetry(item.id)}
											type="button"
										>
											Try again
										</button>
									</>
								)}
							</div>
							{/* Only show delete button when not uploading */}
							{item.status !== 'uploading' && (
								<Button
									className="shrink-0 size-8"
									onClick={() => handleRemove(item.id)}
									size="icon"
									type="button"
									variant="ghost"
								>
									<X className="size-4" />
								</Button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
