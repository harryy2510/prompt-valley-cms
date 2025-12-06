import { useGo, useNotification } from '@refinedev/core'
import dayjs from 'dayjs'
import {
	AlertTriangle,
	Database,
	FolderOpen,
	Globe,
	Lock,
	MoreVertical,
	Pencil,
	Plus,
	RefreshCw,
	Trash2
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
	createBucketServer,
	deleteBucketServer,
	deleteFilesServer,
	listBucketsServer,
	listFilesServer,
	updateBucketServer
} from '@/actions/storage'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/cn'

type Bucket = {
	allowed_mime_types?: Array<string> | null
	created_at: string
	file_size_limit?: null | number
	id: string
	name: string
	owner: string
	public: boolean
	updated_at: string
}

type BucketFormData = {
	name: string
	public: boolean
}

export function BucketList() {
	const [buckets, setBuckets] = useState<Array<Bucket>>([])
	const [isLoading, setIsLoading] = useState(true)
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)
	const [formData, setFormData] = useState<BucketFormData>({
		name: '',
		public: true
	})
	const [deleteConfirmText, setDeleteConfirmText] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const go = useGo()
	const { open: notify } = useNotification()

	const loadBuckets = useCallback(async () => {
		setIsLoading(true)
		try {
			const { data } = await listBucketsServer()
			setBuckets((data as Array<Bucket>) || [])
		} catch (error) {
			console.error('Error loading buckets:', error)
			notify?.({
				message: 'Failed to load buckets',
				type: 'error'
			})
		} finally {
			setIsLoading(false)
		}
	}, [notify])

	useEffect(() => {
		void loadBuckets()
	}, [loadBuckets])

	const handleCreateBucket = async () => {
		if (!formData.name.trim()) return

		setIsSubmitting(true)
		try {
			await createBucketServer({
				data: { name: formData.name, public: formData.public }
			})
			notify?.({
				message: 'Bucket created successfully',
				type: 'success'
			})
			setCreateDialogOpen(false)
			setFormData({ name: '', public: true })
			await loadBuckets()
		} catch (error: unknown) {
			notify?.({
				message: (error as Error).message || 'Failed to create bucket',
				type: 'error'
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleEditBucket = async () => {
		if (!selectedBucket) return

		setIsSubmitting(true)
		try {
			await updateBucketServer({
				data: { id: selectedBucket.id, public: formData.public }
			})
			notify?.({
				message: 'Bucket updated successfully',
				type: 'success'
			})
			setEditDialogOpen(false)
			setSelectedBucket(null)
			await loadBuckets()
		} catch (error: unknown) {
			notify?.({
				message: (error as Error).message || 'Failed to update bucket',
				type: 'error'
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDeleteBucket = async () => {
		if (!selectedBucket || deleteConfirmText !== selectedBucket.name) return

		setIsSubmitting(true)
		try {
			// First, empty the bucket by listing and deleting all files
			const { data: files } = await listFilesServer({
				data: { bucketId: selectedBucket.id, limit: 10000, path: '' }
			})

			if (files && files.length > 0) {
				// Recursively delete all files and folders
				await deleteAllFiles(selectedBucket.id, '')
			}

			// Then delete the bucket
			await deleteBucketServer({ data: { id: selectedBucket.id } })

			notify?.({
				message: 'Bucket deleted successfully',
				type: 'success'
			})
			setDeleteDialogOpen(false)
			setSelectedBucket(null)
			setDeleteConfirmText('')
			await loadBuckets()
		} catch (error: unknown) {
			notify?.({
				message: (error as Error).message || 'Failed to delete bucket',
				type: 'error'
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	// Recursively delete all files in a bucket
	const deleteAllFiles = async (bucketId: string, path: string) => {
		const { data: items } = await listFilesServer({
			data: { bucketId, limit: 10000, path }
		})

		if (!items || items.length === 0) return

		const filesToDelete: Array<string> = []
		const foldersToProcess: Array<string> = []

		for (const item of items) {
			const fullPath = path ? `${path}/${item.name}` : item.name
			if (item.id === null) {
				// It's a folder
				foldersToProcess.push(fullPath)
			} else {
				filesToDelete.push(fullPath)
			}
		}

		// Delete files in this level
		if (filesToDelete.length > 0) {
			await deleteFilesServer({ data: { bucketId, paths: filesToDelete } })
		}

		// Recursively delete folder contents
		for (const folder of foldersToProcess) {
			await deleteAllFiles(bucketId, folder)
		}
	}

	const openEditDialog = (bucket: Bucket) => {
		setSelectedBucket(bucket)
		setFormData({ name: bucket.name, public: bucket.public })
		setEditDialogOpen(true)
	}

	const openDeleteDialog = (bucket: Bucket) => {
		setSelectedBucket(bucket)
		setDeleteConfirmText('')
		setDeleteDialogOpen(true)
	}

	const navigateToBucket = (bucketId: string) => {
		go({ to: `/media-library/${bucketId}` })
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 pb-6">
				<div>
					<h1 className="text-2xl font-bold">Media Library</h1>
					<p className="text-sm text-muted-foreground">Manage your storage buckets and files</p>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={loadBuckets} size="sm" variant="outline">
						<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
					</Button>
					<Button onClick={() => setCreateDialogOpen(true)} size="sm">
						<Plus className="size-4 mr-2" />
						Create Bucket
					</Button>
				</div>
			</div>

			{/* Buckets Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton className="h-40" key={i} />
					))}
				</div>
			) : buckets.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<Database className="size-16 mb-4" />
					<p className="text-lg font-medium">No buckets yet</p>
					<p className="text-sm mb-4">Create a bucket to start storing your files</p>
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="size-4 mr-2" />
						Create Bucket
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{buckets.map((bucket) => (
						<Card
							className="cursor-pointer hover:border-primary/50 transition-colors group"
							key={bucket.id}
							onClick={() => navigateToBucket(bucket.id)}
						>
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<FolderOpen className="size-6 text-primary" />
										</div>
										<div>
											<CardTitle className="text-base">{bucket.name}</CardTitle>
											<CardDescription className="text-xs">
												Created {dayjs(bucket.created_at).format('DD MMM, YYYY')}
											</CardDescription>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
												onClick={(e) => e.stopPropagation()}
												size="icon"
												variant="ghost"
											>
												<MoreVertical className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation()
													openEditDialog(bucket)
												}}
											>
												<Pencil className="size-4 mr-2" />
												Edit Settings
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onClick={(e) => {
													e.stopPropagation()
													openDeleteDialog(bucket)
												}}
											>
												<Trash2 className="size-4 mr-2" />
												Delete Bucket
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Badge variant={bucket.public ? 'default' : 'secondary'}>
										{bucket.public ? (
											<>
												<Globe className="size-3 mr-1" />
												Public
											</>
										) : (
											<>
												<Lock className="size-3 mr-1" />
												Private
											</>
										)}
									</Badge>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create Bucket Dialog */}
			<Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Bucket</DialogTitle>
						<DialogDescription>Create a new storage bucket for your files</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="bucket-name">Bucket Name</Label>
							<Input
								id="bucket-name"
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="my-bucket"
								value={formData.name}
							/>
							<p className="text-xs text-muted-foreground">
								Use lowercase letters, numbers, and hyphens only
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bucket-visibility">Visibility</Label>
							<Select
								onValueChange={(value) => setFormData({ ...formData, public: value === 'public' })}
								value={formData.public ? 'public' : 'private'}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="public">
										<div className="flex items-center gap-2">
											<Globe className="size-4" />
											Public - Files accessible via URL
										</div>
									</SelectItem>
									<SelectItem value="private">
										<div className="flex items-center gap-2">
											<Lock className="size-4" />
											Private - Requires authentication
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							disabled={isSubmitting}
							onClick={() => setCreateDialogOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={isSubmitting} onClick={handleCreateBucket}>
							{isSubmitting ? 'Creating...' : 'Create Bucket'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Bucket Dialog */}
			<Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Bucket Settings</DialogTitle>
						<DialogDescription>Update settings for "{selectedBucket?.name}"</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Bucket Name</Label>
							<Input disabled value={selectedBucket?.name || ''} />
							<p className="text-xs text-muted-foreground">
								Bucket names cannot be changed after creation
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-bucket-visibility">Visibility</Label>
							<Select
								onValueChange={(value) => setFormData({ ...formData, public: value === 'public' })}
								value={formData.public ? 'public' : 'private'}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="public">
										<div className="flex items-center gap-2">
											<Globe className="size-4" />
											Public - Files accessible via URL
										</div>
									</SelectItem>
									<SelectItem value="private">
										<div className="flex items-center gap-2">
											<Lock className="size-4" />
											Private - Requires authentication
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							disabled={isSubmitting}
							onClick={() => setEditDialogOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={isSubmitting} onClick={handleEditBucket}>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Bucket Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-destructive">
							<AlertTriangle className="size-5" />
							Delete Bucket
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-4">
								<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
									<p className="font-semibold text-destructive mb-2">
										This action is permanent and cannot be undone!
									</p>
									<p className="text-sm">Deleting the bucket "{selectedBucket?.name}" will:</p>
									<ul className="text-sm list-disc list-inside mt-2 space-y-1">
										<li>Permanently delete ALL files and folders in this bucket</li>
										<li>Break any existing links to files in this bucket</li>
										<li>Remove all access permissions</li>
										<li>This cannot be recovered</li>
									</ul>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-delete">
										Type <span className="font-mono font-bold">{selectedBucket?.name}</span> to
										confirm:
									</Label>
									<Input
										id="confirm-delete"
										onChange={(e) => setDeleteConfirmText(e.target.value)}
										placeholder={selectedBucket?.name}
										value={deleteConfirmText}
									/>
								</div>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Button
							disabled={isSubmitting}
							onClick={() => {
								setDeleteDialogOpen(false)
								setDeleteConfirmText('')
							}}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={isSubmitting || deleteConfirmText !== selectedBucket?.name}
							onClick={handleDeleteBucket}
							variant="destructive"
						>
							{isSubmitting ? 'Deleting...' : 'Delete Bucket Permanently'}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
