import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import {
  Database,
  Plus,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  Lock,
  Globe,
  AlertTriangle,
} from 'lucide-react'

import { supabase } from '@/libs/supabase'
import { cn } from '@/libs/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useNotification } from '@refinedev/core'

type Bucket = {
  id: string
  name: string
  owner: string
  created_at: string
  updated_at: string
  public: boolean
  file_size_limit?: number | null
  allowed_mime_types?: string[] | null
}

type BucketFormData = {
  name: string
  public: boolean
}

export function BucketList() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)
  const [formData, setFormData] = useState<BucketFormData>({
    name: '',
    public: true,
  })
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { open: notify } = useNotification()

  const loadBuckets = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.storage.listBuckets()

      if (error) throw error

      setBuckets(data || [])
    } catch (error) {
      console.error('Error loading buckets:', error)
      notify?.({
        type: 'error',
        message: 'Failed to load buckets',
      })
    } finally {
      setIsLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadBuckets()
  }, [loadBuckets])

  const handleCreateBucket = async () => {
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.storage.createBucket(formData.name, {
        public: formData.public,
      })

      if (error) throw error

      notify?.({
        type: 'success',
        message: 'Bucket created successfully',
      })
      setCreateDialogOpen(false)
      setFormData({ name: '', public: true })
      loadBuckets()
    } catch (error: any) {
      notify?.({
        type: 'error',
        message: error.message || 'Failed to create bucket',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditBucket = async () => {
    if (!selectedBucket) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.storage.updateBucket(selectedBucket.id, {
        public: formData.public,
      })

      if (error) throw error

      notify?.({
        type: 'success',
        message: 'Bucket updated successfully',
      })
      setEditDialogOpen(false)
      setSelectedBucket(null)
      loadBuckets()
    } catch (error: any) {
      notify?.({
        type: 'error',
        message: error.message || 'Failed to update bucket',
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
      const { data: files } = await supabase.storage
        .from(selectedBucket.id)
        .list('', { limit: 10000 })

      if (files && files.length > 0) {
        // Recursively delete all files and folders
        await deleteAllFiles(selectedBucket.id, '')
      }

      // Then delete the bucket
      const { error } = await supabase.storage.deleteBucket(selectedBucket.id)

      if (error) throw error

      notify?.({
        type: 'success',
        message: 'Bucket deleted successfully',
      })
      setDeleteDialogOpen(false)
      setSelectedBucket(null)
      setDeleteConfirmText('')
      loadBuckets()
    } catch (error: any) {
      notify?.({
        type: 'error',
        message: error.message || 'Failed to delete bucket',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Recursively delete all files in a bucket
  const deleteAllFiles = async (bucketId: string, path: string) => {
    const { data: items } = await supabase.storage
      .from(bucketId)
      .list(path, { limit: 10000 })

    if (!items || items.length === 0) return

    const filesToDelete: string[] = []
    const foldersToProcess: string[] = []

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
      await supabase.storage.from(bucketId).remove(filesToDelete)
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
    navigate(`/media-library/${bucketId}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage your storage buckets and files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBuckets}>
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Bucket
          </Button>
        </div>
      </div>

      {/* Buckets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : buckets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Database className="size-16 mb-4" />
          <p className="text-lg font-medium">No buckets yet</p>
          <p className="text-sm mb-4">
            Create a bucket to start storing your files
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Bucket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <Card
              key={bucket.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group"
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
                        Created{' '}
                        {new Date(bucket.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(bucket)
                        }}
                        className="text-destructive focus:text-destructive"
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
            <DialogDescription>
              Create a new storage bucket for your files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bucket-name">Bucket Name</Label>
              <Input
                id="bucket-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="my-bucket"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bucket-visibility">Visibility</Label>
              <Select
                value={formData.public ? 'public' : 'private'}
                onValueChange={(value) =>
                  setFormData({ ...formData, public: value === 'public' })
                }
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
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Bucket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bucket Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bucket Settings</DialogTitle>
            <DialogDescription>
              Update settings for "{selectedBucket?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input value={selectedBucket?.name || ''} disabled />
              <p className="text-xs text-muted-foreground">
                Bucket names cannot be changed after creation
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bucket-visibility">Visibility</Label>
              <Select
                value={formData.public ? 'public' : 'private'}
                onValueChange={(value) =>
                  setFormData({ ...formData, public: value === 'public' })
                }
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
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditBucket} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bucket Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  <p className="text-sm">
                    Deleting the bucket "{selectedBucket?.name}" will:
                  </p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                    <li>
                      Permanently delete ALL files and folders in this bucket
                    </li>
                    <li>Break any existing links to files in this bucket</li>
                    <li>Remove all access permissions</li>
                    <li>This cannot be recovered</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type{' '}
                    <span className="font-mono font-bold">
                      {selectedBucket?.name}
                    </span>{' '}
                    to confirm:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={selectedBucket?.name}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmText('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBucket}
              disabled={
                isSubmitting || deleteConfirmText !== selectedBucket?.name
              }
            >
              {isSubmitting ? 'Deleting...' : 'Delete Bucket Permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
