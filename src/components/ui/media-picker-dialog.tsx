import {
	CheckSquare,
	ChevronLeft,
	ChevronRight,
	FileImage,
	Folder,
	FolderOpen,
	Home,
	RefreshCw,
	Square
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { listBucketsServer, listFilesServer } from '@/actions/storage'
import { cn } from '@/libs/cn'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator
} from './breadcrumb'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from './dialog'
import { Image } from './image'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'
import { Skeleton } from './skeleton'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

type Bucket = {
	id: string
	name: string
	public: boolean
}

type FileObject = {
	id: null | string
	metadata: null | Record<string, unknown>
	name: string
}

type MediaPickerDialogProps = {
	accept?: Array<string>
	children: React.ReactNode
	multiple?: boolean
	onSelect: (paths: Array<string>) => void
}

export function MediaPickerDialog({
	accept = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'],
	children,
	multiple = false,
	onSelect
}: MediaPickerDialogProps) {
	const [open, setOpen] = useState(false)
	const [buckets, setBuckets] = useState<Array<Bucket>>([])
	const [selectedBucket, setSelectedBucket] = useState<null | string>(null)
	const [currentPath, setCurrentPath] = useState<Array<string>>([])
	const [files, setFiles] = useState<Array<FileObject>>([])
	const [folders, setFolders] = useState<Array<string>>([])
	const [isBucketsLoading, setIsBucketsLoading] = useState(false)
	const [isFilesLoading, setIsFilesLoading] = useState(false)
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(() => new Set())
	const [lastSelectedFile, setLastSelectedFile] = useState<null | string>(null)

	// Use ref to avoid infinite loop from accept array changing on every render
	const acceptRef = useRef(accept)
	acceptRef.current = accept

	const pathString = currentPath.join('/')

	// Load buckets
	useEffect(() => {
		if (!open) return

		async function loadBuckets() {
			setIsBucketsLoading(true)
			try {
				const result = await listBucketsServer()
				setBuckets(result.data as Array<Bucket>)
			} catch (error) {
				console.error('Error loading buckets:', error)
			} finally {
				setIsBucketsLoading(false)
			}
		}

		void loadBuckets()
	}, [open])

	// Load files when bucket/path changes
	const loadFiles = useCallback(async () => {
		if (!selectedBucket) {
			return
		}

		setIsFilesLoading(true)
		try {
			const { data } = await listFilesServer({
				data: {
					bucketId: selectedBucket,
					limit: 1000,
					path: pathString,
					sortBy: { column: 'name', order: 'asc' }
				}
			})

			const folderSet = new Set<string>()
			const fileList: Array<FileObject> = []
			const currentAccept = acceptRef.current

			data?.forEach((item) => {
				if (item.id === null) {
					folderSet.add(item.name)
				} else if (item.name !== '.keep') {
					// Filter by accepted extensions if specified
					const ext = item.name.split('.').pop()?.toLowerCase()
					if (!currentAccept.length || (ext && currentAccept.includes(ext))) {
						fileList.push(item as FileObject)
					}
				}
			})

			setFolders(Array.from(folderSet).sort())
			setFiles(fileList)
		} catch (error) {
			console.error('Error loading files:', error)
		} finally {
			setIsFilesLoading(false)
		}
	}, [selectedBucket, pathString])

	useEffect(() => {
		if (selectedBucket) {
			void loadFiles()
		}
	}, [loadFiles, selectedBucket])

	// Reset when dialog opens/closes
	useEffect(() => {
		if (!open) {
			setSelectedFiles(new Set())
			setLastSelectedFile(null)
		}
	}, [open])

	const navigateToFolder = (folderName: string) => {
		setCurrentPath((prev) => [...prev, folderName])
		setSelectedFiles(new Set())
	}

	const navigateToPath = (index: number) => {
		setCurrentPath((prev) => prev.slice(0, index))
		setSelectedFiles(new Set())
	}

	const navigateHome = () => {
		setCurrentPath([])
		setSelectedFiles(new Set())
	}

	const selectBucket = (bucketId: string) => {
		setSelectedBucket(bucketId)
		setCurrentPath([])
		setSelectedFiles(new Set())
	}

	const getPublicUrl = (fileName: string): string => {
		const fullPath = pathString ? `${pathString}/${fileName}` : fileName
		return `${SUPABASE_URL}/storage/v1/object/public/${selectedBucket}/${fullPath}`
	}

	const getFilePath = (fileName: string): string => {
		// Return only the path within the bucket, not including bucket name
		return pathString ? `${pathString}/${fileName}` : fileName
	}

	const allFileNames = useMemo(() => files.map((f) => f.name), [files])

	const toggleFileSelection = (fileName: string, shiftKey = false) => {
		const newSelected = new Set(selectedFiles)

		if (shiftKey && lastSelectedFile && lastSelectedFile !== fileName && multiple) {
			const lastIndex = allFileNames.indexOf(lastSelectedFile)
			const currentIndex = allFileNames.indexOf(fileName)

			if (lastIndex !== -1 && currentIndex !== -1) {
				const start = Math.min(lastIndex, currentIndex)
				const end = Math.max(lastIndex, currentIndex)

				for (let i = start; i <= end; i++) {
					newSelected.add(allFileNames[i])
				}
			}
		} else if (multiple) {
			if (newSelected.has(fileName)) {
				newSelected.delete(fileName)
			} else {
				newSelected.add(fileName)
			}
		} else {
			// Single select mode
			if (newSelected.has(fileName)) {
				newSelected.clear()
			} else {
				newSelected.clear()
				newSelected.add(fileName)
			}
		}

		setSelectedFiles(newSelected)
		setLastSelectedFile(fileName)
	}

	const handleConfirm = () => {
		const paths = Array.from(selectedFiles).map(getFilePath)
		onSelect(paths)
		setOpen(false)
	}

	const isImageFile = (name: string): boolean => {
		const ext = name.split('.').pop()?.toLowerCase()
		return ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(ext || '')
	}

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="!max-w-[80vw] w-full h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Browse Media Library</DialogTitle>
					<DialogDescription>
						{multiple
							? 'Select files from your media library'
							: 'Select a file from your media library'}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 flex flex-col min-h-0">
					{/* Bucket/Path Navigation */}
					{selectedBucket ? (
						<div className="flex items-center gap-2 pb-3">
							<Button
								className="size-8"
								onClick={() => setSelectedBucket(null)}
								size="icon"
								variant="ghost"
							>
								<ChevronLeft className="size-4" />
							</Button>
							<Button className="size-8" onClick={navigateHome} size="icon" variant="ghost">
								<Home className="size-4" />
							</Button>
							<Separator className="h-6" orientation="vertical" />
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbLink
											className="cursor-pointer hover:text-foreground"
											onClick={navigateHome}
										>
											{selectedBucket}
										</BreadcrumbLink>
									</BreadcrumbItem>
									{currentPath.map((segment, index) => (
										<BreadcrumbItem key={index}>
											<BreadcrumbSeparator>
												<ChevronRight className="size-4" />
											</BreadcrumbSeparator>
											<BreadcrumbLink
												className="cursor-pointer hover:text-foreground"
												onClick={() => navigateToPath(index + 1)}
											>
												{segment}
											</BreadcrumbLink>
										</BreadcrumbItem>
									))}
								</BreadcrumbList>
							</Breadcrumb>
							<div className="flex-1" />
							<Button onClick={loadFiles} size="icon" variant="ghost">
								<RefreshCw className={cn('size-4', isFilesLoading && 'animate-spin')} />
							</Button>
						</div>
					) : (
						<div className="pb-3">
							<p className="text-sm text-muted-foreground">Select a bucket to browse</p>
						</div>
					)}

					<Separator />

					{/* Content */}
					<ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
						{!selectedBucket ? (
							// Bucket list
							isBucketsLoading ? (
								<div className="grid grid-cols-4 gap-3 py-4">
									{Array.from({ length: 6 }).map((_, i) => (
										<Skeleton className="h-20" key={i} />
									))}
								</div>
							) : (
								<div className="grid grid-cols-4 gap-3 py-4">
									{buckets.map((bucket) => (
										<button
											className={cn(
												'flex items-center gap-3 p-3 rounded-lg border',
												'hover:bg-accent transition-colors text-left'
											)}
											key={bucket.id}
											onClick={() => selectBucket(bucket.id)}
											type="button"
										>
											<Folder className="size-8 text-muted-foreground" />
											<div>
												<p className="font-medium">{bucket.name}</p>
												<p className="text-xs text-muted-foreground">
													{bucket.public ? 'Public' : 'Private'}
												</p>
											</div>
										</button>
									))}
								</div>
							)
						) : isFilesLoading ? (
							<div className="grid grid-cols-4 gap-3 py-4">
								{Array.from({ length: 8 }).map((_, i) => (
									<Skeleton className="h-24" key={i} />
								))}
							</div>
						) : folders.length === 0 && files.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<Folder className="size-12 mb-3" />
								<p className="text-sm">No files found</p>
							</div>
						) : (
							<div className="grid grid-cols-4 gap-3 py-4">
								{/* Folders */}
								{folders.map((folder) => (
									<button
										className={cn(
											'flex flex-col items-center justify-center p-4',
											'rounded-lg border hover:bg-accent transition-colors'
										)}
										key={folder}
										onClick={() => navigateToFolder(folder)}
										type="button"
									>
										<FolderOpen className="size-10 text-muted-foreground mb-2" />
										<p className="text-sm font-medium truncate w-full text-center">{folder}</p>
									</button>
								))}
								{/* Files */}
								{files.map((file) => {
									const isSelected = selectedFiles.has(file.name)
									const isImage = isImageFile(file.name)

									return (
										<button
											className={cn(
												'group relative flex flex-col items-center justify-center p-3',
												'rounded-lg border transition-colors',
												'hover:bg-accent',
												isSelected && 'bg-accent border-primary ring-2 ring-primary/20'
											)}
											key={file.name}
											onClick={(e) => toggleFileSelection(file.name, e.shiftKey)}
											type="button"
										>
											{/* Checkbox */}
											<div
												className={cn(
													'absolute top-2 left-2 size-5 rounded flex items-center justify-center',
													'transition-opacity',
													isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
												)}
											>
												{isSelected ? (
													<CheckSquare className="size-4 text-primary" />
												) : (
													<Square className="size-4 text-muted-foreground" />
												)}
											</div>

											{/* Thumbnail */}
											<div className="size-14 flex items-center justify-center mb-2">
												{isImage ? (
													<Image
														alt={file.name}
														className="size-14 object-cover rounded"
														src={getPublicUrl(file.name)}
													/>
												) : (
													<FileImage className="size-10 text-muted-foreground" />
												)}
											</div>
											<p
												className="text-xs font-medium truncate w-full text-center"
												title={file.name}
											>
												{file.name}
											</p>
										</button>
									)
								})}
							</div>
						)}
					</ScrollArea>
				</div>

				<DialogFooter className="border-t pt-4">
					<div className="flex items-center gap-2 w-full">
						{selectedFiles.size > 0 && (
							<span className="text-sm text-muted-foreground">
								{selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
							</span>
						)}
						<div className="flex-1" />
						<Button onClick={() => setOpen(false)} variant="outline">
							Cancel
						</Button>
						<Button disabled={selectedFiles.size === 0} onClick={handleConfirm}>
							{multiple
								? `Select ${selectedFiles.size > 0 ? selectedFiles.size : ''} File${selectedFiles.size !== 1 ? 's' : ''}`
								: 'Select'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
