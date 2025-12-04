import { useList, useNavigation, useCreate, useUpdate, useOne, useDelete } from "@refinedev/core"
import { useParams } from "react-router"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader, DataTableWrapper, FormPageLayout, FormCard } from "@/components/page-layout"

export function TagsList() {
  const { query } = useList({
    resource: "tags",
  })

  const { data, isLoading, refetch } = query
  const { create, edit } = useNavigation()
  const { mutate: deleteTag } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteTag(
      {
        resource: "tags",
        id: deleteDialog.id,
      },
      {
        onSuccess: () => {
          refetch()
          setDeleteDialog(null)
        },
      }
    )
  }

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="Tags"
        description="Manage prompt tags"
        action={{
          label: "Create New",
          onClick: () => create("tags")
        }}
      />

      <DataTableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={2} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No tags yet</p>
                      <p className="text-xs">Get started by creating your first tag</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((tag: any) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => edit("tags", tag.id)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteDialog({ open: true, id: tag.id, name: tag.name })}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableWrapper>

      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function TagsCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    id: "",
    name: "",
  })
  const [autoSlug, setAutoSlug] = useState(true)

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
    if (autoSlug) {
      setFormData({ ...formData, name, id: generateSlug(name) })
    }
  }

  const handleIdChange = (id: string) => {
    setFormData({ ...formData, id })
    setAutoSlug(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    create(
      {
        resource: "tags",
        values: formData,
      },
      {
        onSuccess: () => {
          list("tags")
        },
      }
    )
  }

  return (
    <FormPageLayout
      title="Create Tag"
      description="Add a new tag for organizing prompts"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard
          title="Tag Details"
          description="Enter the name for the new tag"
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="SEO"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">
                ID (slug) *
                <span className="ml-2 text-xs font-normal text-muted-foreground">(auto-generated)</span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="seo"
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system. Auto-generated from name but can be customized.
              </p>
            </div>
          </div>
        </FormCard>

        <div className="flex items-center gap-2">
          <Button type="submit">Create Tag</Button>
          <Button type="button" variant="outline" onClick={() => list("tags")}>
            Cancel
          </Button>
        </div>
      </form>
    </FormPageLayout>
  )
}

export function TagsEdit() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: "tags", id: id || "" })
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    name: "",
  })

  useEffect(() => {
    if (data?.data) {
      setFormData({
        name: data.data.name || "",
      })
    }
  }, [data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    update(
      {
        resource: "tags",
        id: id || "",
        values: formData,
      },
      {
        onSuccess: () => {
          list("tags")
        },
      }
    )
  }

  return (
    <FormPageLayout
      title="Edit Tag"
      description="Update tag information"
      isLoading={isLoading}
    >
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Tag Details"
            description="Update the name for this tag"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="SEO"
                required
              />
            </div>
          </FormCard>

          <div className="flex items-center gap-2">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => list("tags")}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </FormPageLayout>
  )
}
