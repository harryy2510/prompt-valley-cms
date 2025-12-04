import { useList, useNavigation, useCreate, useUpdate, useOne, useDelete } from "@refinedev/core"
import { useParams } from "react-router"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
          <p className="text-muted-foreground">Manage prompt tags</p>
        </div>
        <Button onClick={() => create("tags")}>
          <Plus className="mr-2 size-4" />
          Create New
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No tags found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((tag: any) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => edit("tags", tag.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, id: tag.id, name: tag.name })}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Tag</h2>
        <p className="text-muted-foreground">Add a new tag for organizing prompts</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tag Details</CardTitle>
          <CardDescription>Enter the name for the new tag</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="id">ID (slug) *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="seo"
                required
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. You can edit it manually.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Create Tag</Button>
              <Button type="button" variant="outline" onClick={() => list("tags")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 max-w-2xl animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Tag</h2>
        <p className="text-muted-foreground">Update tag information</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tag Details</CardTitle>
          <CardDescription>Update the name for this tag</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex gap-2 pt-4">
              <Button type="submit">Update Tag</Button>
              <Button type="button" variant="outline" onClick={() => list("tags")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
