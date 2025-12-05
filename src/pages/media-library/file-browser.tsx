import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import Selecto from 'react-selecto'
import {
  ChevronRight,
  ChevronLeft,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Folder,
  FolderOpen,
  Upload,
  Trash2,
  Download,
  Grid,
  List,
  Home,
  RefreshCw,
  Plus,
  MoreVertical,
  Copy,
  Eye,
  Link,
  X,
  CheckSquare,
  Square,
  CheckCheck,
} from 'lucide-react'

import { supabase } from '@/libs/supabase'
import { cn } from '@/libs/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useNotification } from '@refinedev/core'
import dayjs from 'dayjs'
import { fData } from '@/utils/format'

type FileObject = {
  name: string
  id: string | null
  updated_at: string | null
  created_at: string | null
  last_accessed_at: string | null
  metadata: Record<string, unknown> | null
}

type ViewMode = 'grid' | 'list'

type SelectableItem = {
  name: string
  isFolder: boolean
}

function getFileIcon(name: string, isFolder: boolean) {
  if (isFolder) return Folder

  const ext = name.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp']
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv']
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'md']

  if (imageExts.includes(ext || '')) return FileImage
  if (videoExts.includes(ext || '')) return FileVideo
  if (audioExts.includes(ext || '')) return FileAudio
  if (docExts.includes(ext || '')) return FileText

  return File
}

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')
}

interface FileBrowserProps {
  bucketId?: string
}

export function FileBrowser({ bucketId: propBucketId }: FileBrowserProps = {}) {
  const { bucketId: paramBucketId, '*': splat } = useParams<{
    bucketId: string
    '*': string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const bucketId = propBucketId || paramBucketId || ''

  // Derive current path from URL
  const currentPath = useMemo(() => {
    if (!splat) return []
    return splat.split('/').filter(Boolean)
  }, [splat])
  const [files, setFiles] = useState<FileObject[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isUploading, setIsUploading] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    name: string
    isFolder: boolean
  } | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const selectoRef = useRef<Selecto>(null)

  const { open: notify } = useNotification()

  const pathString = currentPath.join('/')

  // Build a map of all items for quick lookup
  const allItems: SelectableItem[] = [
    ...folders.map((f) => ({ name: f, isFolder: true })),
    ...files.map((f) => ({ name: f.name, isFolder: false })),
  ]

  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .list(pathString, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) throw error

      // Separate folders and files
      const folderSet = new Set<string>()
      const fileList: FileObject[] = []

      data?.forEach((item) => {
        if (item.id === null) {
          // It's a folder placeholder
          folderSet.add(item.name)
        } else {
          fileList.push(item)
        }
      })

      setFolders(Array.from(folderSet).sort())
      setFiles(fileList)
    } catch (error) {
      console.error('Error loading files:', error)
      notify?.({
        type: 'error',
        message: 'Failed to load files',
      })
    } finally {
      setIsLoading(false)
    }
  }, [bucketId, pathString, notify])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Clear selection when changing folders
  useEffect(() => {
    setSelectedItems(new Set())
  }, [currentPath])

  const navigateToFolder = (folderName: string) => {
    const newPath = [...currentPath, folderName].join('/')
    navigate(`/media-library/${bucketId}/${newPath}`)
  }

  const navigateToPath = (index: number) => {
    const newPath = currentPath.slice(0, index).join('/')
    navigate(`/media-library/${bucketId}${newPath ? `/${newPath}` : ''}`)
  }

  const navigateHome = () => {
    navigate(`/media-library/${bucketId}`)
  }

  const getPublicUrl = (fileName: string): string => {
    const fullPath = pathString ? `${pathString}/${fileName}` : fileName
    const { data } = supabase.storage.from(bucketId).getPublicUrl(fullPath)
    return data.publicUrl
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files
    if (!uploadFiles || uploadFiles.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of Array.from(uploadFiles)) {
      const filePath = pathString ? `${pathString}/${file.name}` : file.name

      const { error } = await supabase.storage
        .from(bucketId)
        .upload(filePath, file, { upsert: true })

      if (error) {
        console.error('Upload error:', error)
        errorCount++
      } else {
        successCount++
      }
    }

    setIsUploading(false)
    e.target.value = ''

    if (successCount > 0) {
      notify?.({
        type: 'success',
        message: `Uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
      })
    }
    if (errorCount > 0) {
      notify?.({
        type: 'error',
        message: `Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}`,
      })
    }

    loadFiles()
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    const folderPath = pathString
      ? `${pathString}/${newFolderName}/.keep`
      : `${newFolderName}/.keep`

    const { error } = await supabase.storage
      .from(bucketId)
      .upload(folderPath, new Blob(['']), { upsert: true })

    if (error) {
      notify?.({
        type: 'error',
        message: 'Failed to create folder',
      })
    } else {
      notify?.({
        type: 'success',
        message: 'Folder created',
      })
      loadFiles()
    }

    setNewFolderDialogOpen(false)
    setNewFolderName('')
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    const fullPath = pathString
      ? `${pathString}/${itemToDelete.name}`
      : itemToDelete.name

    if (itemToDelete.isFolder) {
      // For folders, we need to delete all contents recursively
      const { data: folderContents } = await supabase.storage
        .from(bucketId)
        .list(fullPath, { limit: 1000 })

      if (folderContents && folderContents.length > 0) {
        const filesToDelete = folderContents.map((f) => `${fullPath}/${f.name}`)
        await supabase.storage.from(bucketId).remove(filesToDelete)
      }
    } else {
      const { error } = await supabase.storage.from(bucketId).remove([fullPath])

      if (error) {
        notify?.({
          type: 'error',
          message: 'Failed to delete file',
        })
      } else {
        notify?.({
          type: 'success',
          message: 'File deleted',
        })
      }
    }

    setDeleteDialogOpen(false)
    setItemToDelete(null)
    loadFiles()
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    setIsDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const itemName of selectedItems) {
      const item = allItems.find((i) => i.name === itemName)
      if (!item) continue

      const fullPath = pathString ? `${pathString}/${itemName}` : itemName

      if (item.isFolder) {
        // For folders, delete all contents recursively
        const { data: folderContents } = await supabase.storage
          .from(bucketId)
          .list(fullPath, { limit: 1000 })

        if (folderContents && folderContents.length > 0) {
          const filesToDelete = folderContents.map(
            (f) => `${fullPath}/${f.name}`,
          )
          const { error } = await supabase.storage
            .from(bucketId)
            .remove(filesToDelete)
          if (error) errorCount++
          else successCount++
        } else {
          successCount++
        }
      } else {
        const { error } = await supabase.storage
          .from(bucketId)
          .remove([fullPath])
        if (error) errorCount++
        else successCount++
      }
    }

    setIsDeleting(false)
    setBulkDeleteDialogOpen(false)
    setSelectedItems(new Set())

    if (successCount > 0) {
      notify?.({
        type: 'success',
        message: `Deleted ${successCount} item${successCount > 1 ? 's' : ''}`,
      })
    }
    if (errorCount > 0) {
      notify?.({
        type: 'error',
        message: `Failed to delete ${errorCount} item${errorCount > 1 ? 's' : ''}`,
      })
    }

    loadFiles()
  }

  const handleDownload = async (fileName: string) => {
    const fullPath = pathString ? `${pathString}/${fileName}` : fileName
    const { data, error } = await supabase.storage
      .from(bucketId)
      .download(fullPath)

    if (error) {
      notify?.({
        type: 'error',
        message: 'Failed to download file',
      })
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyUrl = (fileName: string) => {
    const url = getPublicUrl(fileName)
    navigator.clipboard.writeText(url)
    notify?.({
      type: 'success',
      message: 'URL copied to clipboard',
    })
  }

  const handleCopyPath = (fileName: string) => {
    const fullPath = pathString ? `${pathString}/${fileName}` : fileName
    navigator.clipboard.writeText(fullPath)
    notify?.({
      type: 'success',
      message: 'Path copied to clipboard',
    })
  }

  const confirmDelete = (name: string, isFolder: boolean) => {
    setItemToDelete({ name, isFolder })
    setDeleteDialogOpen(true)
  }

  const toggleSelection = (name: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelectedItems(newSelected)
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  const selectAll = () => {
    setSelectedItems(new Set(allItems.map((i) => i.name)))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/media-library')}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{bucketId}</h1>
            <p className="text-sm text-muted-foreground">
              Manage files and folders in this bucket
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="size-4" />
            ) : (
              <Grid className="size-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={loadFiles}>
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <Plus className="size-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="size-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Breadcrumb & Selection Toolbar Container */}
      <div className="relative">
        {/* Selection Toolbar - overlays breadcrumb */}
        <div
          className={cn(
            'absolute inset-0 z-10',
            'flex items-center gap-2 px-3 py-2 bg-muted rounded-md',
            'transition-all duration-200 ease-out',
            selectedItems.size > 0
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2 pointer-events-none',
          )}
        >
          <CheckSquare className="size-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedItems.size} selected
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" onClick={selectAll}>
            <CheckCheck className="size-4 mr-1" />
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          <div className="flex-1" />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={clearSelection}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigate('/media-library')}
          >
            <Home className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={navigateHome}
                  className="cursor-pointer hover:text-foreground"
                >
                  {bucketId}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentPath.map((segment, index) => (
                <BreadcrumbItem key={index}>
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbLink
                    onClick={() => navigateToPath(index + 1)}
                    className="cursor-pointer hover:text-foreground"
                  >
                    {segment}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* File Grid/List */}
      <div ref={containerRef} className="relative flex-1">
        {isLoading ? (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                : 'flex flex-col gap-2',
            )}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className={viewMode === 'grid' ? 'h-32' : 'h-12'}
              />
            ))}
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Folder className="size-16 mb-4" />
            <p className="text-lg font-medium">This folder is empty</p>
            <p className="text-sm">
              Upload files or create a folder to get started
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 selecto-container">
            {folders.map((folder) => (
              <FileGridItem
                key={folder}
                name={folder}
                isFolder={true}
                isSelected={selectedItems.has(folder)}
                isSelectionMode={selectedItems.size > 0}
                onDoubleClick={() => navigateToFolder(folder)}
                onToggleSelect={() => toggleSelection(folder)}
                onDelete={() => confirmDelete(folder, true)}
                onCopyUrl={() => {}}
                onCopyPath={() => handleCopyPath(folder)}
              />
            ))}
            {files.map((file) => (
              <FileGridItem
                key={file.name}
                name={file.name}
                isFolder={false}
                isSelected={selectedItems.has(file.name)}
                isSelectionMode={selectedItems.size > 0}
                metadata={file.metadata}
                publicUrl={getPublicUrl(file.name)}
                onDoubleClick={() => {
                  if (isImageFile(file.name)) {
                    setPreviewFile(getPublicUrl(file.name))
                  }
                }}
                onToggleSelect={() => toggleSelection(file.name)}
                onDelete={() => confirmDelete(file.name, false)}
                onDownload={() => handleDownload(file.name)}
                onCopyUrl={() => handleCopyUrl(file.name)}
                onCopyPath={() => handleCopyPath(file.name)}
                onPreview={
                  isImageFile(file.name)
                    ? () => setPreviewFile(getPublicUrl(file.name))
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 selecto-container">
            {folders.map((folder) => (
              <FileListItem
                key={folder}
                name={folder}
                isFolder={true}
                isSelected={selectedItems.has(folder)}
                isSelectionMode={selectedItems.size > 0}
                onDoubleClick={() => navigateToFolder(folder)}
                onToggleSelect={() => toggleSelection(folder)}
                onDelete={() => confirmDelete(folder, true)}
                onCopyUrl={() => {}}
                onCopyPath={() => handleCopyPath(folder)}
              />
            ))}
            {files.map((file) => (
              <FileListItem
                key={file.name}
                name={file.name}
                isFolder={false}
                isSelected={selectedItems.has(file.name)}
                isSelectionMode={selectedItems.size > 0}
                metadata={file.metadata}
                updatedAt={file.updated_at}
                onDoubleClick={() => {
                  if (isImageFile(file.name)) {
                    setPreviewFile(getPublicUrl(file.name))
                  }
                }}
                onToggleSelect={() => toggleSelection(file.name)}
                onDelete={() => confirmDelete(file.name, false)}
                onDownload={() => handleDownload(file.name)}
                onCopyUrl={() => handleCopyUrl(file.name)}
                onCopyPath={() => handleCopyPath(file.name)}
                onPreview={
                  isImageFile(file.name)
                    ? () => setPreviewFile(getPublicUrl(file.name))
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Selecto for drag selection */}
        {!isLoading && (folders.length > 0 || files.length > 0) && (
          <Selecto
            ref={selectoRef}
            container={containerRef.current}
            selectableTargets={['.selectable-item']}
            selectByClick={false}
            selectFromInside={false}
            continueSelect={false}
            toggleContinueSelect="shift"
            hitRate={0}
            onSelect={(e) => {
              const newSelected = new Set(selectedItems)

              e.added.forEach((el) => {
                const name = el.getAttribute('data-name')
                if (name) newSelected.add(name)
              })

              e.removed.forEach((el) => {
                const name = el.getAttribute('data-name')
                if (name) newSelected.delete(name)
              })

              setSelectedItems(newSelected)
            }}
          />
        )}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.isFolder ? 'Folder' : 'File'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.name}"
              {itemToDelete?.isFolder && ' and all its contents'}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedItems.size} items?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected files and folders. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? 'Deleting...'
                : `Delete ${selectedItems.size} items`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <img
              src={previewFile}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type FileGridItemProps = {
  name: string
  isFolder: boolean
  isSelected: boolean
  isSelectionMode: boolean
  metadata?: Record<string, unknown> | null
  publicUrl?: string
  onDoubleClick: () => void
  onToggleSelect: () => void
  onDelete: () => void
  onDownload?: () => void
  onCopyUrl: () => void
  onCopyPath: () => void
  onPreview?: () => void
}

function FileGridItem({
  name,
  isFolder,
  isSelected,
  isSelectionMode,
  metadata,
  publicUrl,
  onDoubleClick,
  onToggleSelect,
  onDelete,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onPreview,
}: FileGridItemProps) {
  const Icon = getFileIcon(name, isFolder)
  const isImage = !isFolder && isImageFile(name)
  const size = metadata?.size as number | undefined

  const handleClick = () => {
    // Only toggle selection on click if we're already in selection mode
    if (isSelectionMode) {
      onToggleSelect()
    }
  }

  const menuContent = (
    <>
      {onPreview && (
        <>
          <ContextMenuItem onClick={onPreview}>
            <Eye className="size-4 mr-2" />
            Preview
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      {!isFolder && (
        <>
          <ContextMenuItem onClick={onDownload}>
            <Download className="size-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem onClick={onCopyUrl}>
            <Link className="size-4 mr-2" />
            Copy URL
          </ContextMenuItem>
        </>
      )}
      <ContextMenuItem onClick={onCopyPath}>
        <Copy className="size-4 mr-2" />
        Copy Path
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="size-4 mr-2" />
        Delete
      </ContextMenuItem>
    </>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-name={name}
          className={cn(
            'selectable-item',
            'group relative flex flex-col items-center justify-center',
            'rounded-lg border bg-card p-4',
            'cursor-pointer transition-colors',
            'hover:bg-accent hover:border-accent-foreground/20',
            isSelected && 'bg-accent border-primary ring-2 ring-primary/20',
          )}
          onDoubleClick={onDoubleClick}
          onClick={handleClick}
        >
          {/* Checkbox - shown on hover or when selected */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-1 left-1 size-7',
              'transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
          >
            {isSelected ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4" />
            )}
          </Button>

          {/* Dropdown Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute top-1 right-1 size-7',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="size-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              {!isFolder && (
                <>
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="size-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCopyUrl}>
                    <Link className="size-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={onCopyPath}>
                <Copy className="size-4 mr-2" />
                Copy Path
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Thumbnail or Icon */}
          <div className="size-16 flex items-center justify-center mb-2">
            {isImage && publicUrl ? (
              <img
                src={publicUrl}
                alt={name}
                className="size-16 object-cover rounded"
              />
            ) : isFolder ? (
              <FolderOpen className="size-12 text-muted-foreground" />
            ) : (
              <Icon className="size-12 text-muted-foreground" />
            )}
          </div>

          {/* Name */}
          <p
            className="text-sm font-medium text-center truncate w-full"
            title={name}
          >
            {name}
          </p>

          {/* Size */}
          {!isFolder && size && (
            <p className="text-xs text-muted-foreground">{fData(size)}</p>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuContent}</ContextMenuContent>
    </ContextMenu>
  )
}

type FileListItemProps = {
  name: string
  isFolder: boolean
  isSelected: boolean
  isSelectionMode: boolean
  metadata?: Record<string, unknown> | null
  updatedAt?: string | null
  onDoubleClick: () => void
  onToggleSelect: () => void
  onDelete: () => void
  onDownload?: () => void
  onCopyUrl: () => void
  onCopyPath: () => void
  onPreview?: () => void
}

function FileListItem({
  name,
  isFolder,
  isSelected,
  isSelectionMode,
  metadata,
  updatedAt,
  onDoubleClick,
  onToggleSelect,
  onDelete,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onPreview,
}: FileListItemProps) {
  const Icon = getFileIcon(name, isFolder)
  const size = metadata?.size as number | undefined

  const handleClick = () => {
    // Only toggle selection on click if we're already in selection mode
    if (isSelectionMode) {
      onToggleSelect()
    }
  }

  const menuContent = (
    <>
      {onPreview && (
        <>
          <ContextMenuItem onClick={onPreview}>
            <Eye className="size-4 mr-2" />
            Preview
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      {!isFolder && (
        <>
          <ContextMenuItem onClick={onDownload}>
            <Download className="size-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem onClick={onCopyUrl}>
            <Link className="size-4 mr-2" />
            Copy URL
          </ContextMenuItem>
        </>
      )}
      <ContextMenuItem onClick={onCopyPath}>
        <Copy className="size-4 mr-2" />
        Copy Path
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="size-4 mr-2" />
        Delete
      </ContextMenuItem>
    </>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-name={name}
          className={cn(
            'selectable-item',
            'group flex items-center gap-3 px-3 py-2',
            'rounded-md cursor-pointer transition-colors',
            'hover:bg-accent',
            isSelected && 'bg-accent ring-2 ring-primary/20',
          )}
          onDoubleClick={onDoubleClick}
          onClick={handleClick}
        >
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 shrink-0',
              'transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
          >
            {isSelected ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4" />
            )}
          </Button>
          <Icon className="size-5 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate text-sm font-medium">{name}</span>
          {!isFolder && (
            <>
              <span className="text-xs text-muted-foreground w-20 text-right">
                {fData(size)}
              </span>
              {updatedAt && (
                <span className="text-xs text-muted-foreground w-32 text-right">
                  {dayjs(updatedAt).format('DD MMM, YYYY')}
                </span>
              )}
            </>
          )}
          {isFolder && <Badge variant="secondary">Folder</Badge>}

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="size-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              {!isFolder && (
                <>
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="size-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCopyUrl}>
                    <Link className="size-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={onCopyPath}>
                <Copy className="size-4 mr-2" />
                Copy Path
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuContent}</ContextMenuContent>
    </ContextMenu>
  )
}
