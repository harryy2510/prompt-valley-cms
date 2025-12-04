import { useList, useNavigation, useCreate, useUpdate, useOne, useDelete } from "@refinedev/core"
import { useParams } from "react-router"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export function CategoriesList() {
  const { query } = useList({
    resource: "categories",
    queryOptions: {
      retry: 1,
    },
  })

  const { data, isLoading, refetch } = query
  const { create, edit } = useNavigation()
  const { mutate: deleteCategory } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteCategory(
      {
        resource: "categories",
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
        title="Categories"
        description="Manage content categories"
        action={{
          label: "Create New",
          onClick: () => create("categories")
        }}
      />

      <DataTableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No categories yet</p>
                      <p className="text-xs">Get started by adding your first category</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((category: any) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{category.description}</TableCell>
                  <TableCell className="text-muted-foreground">{category.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => edit("categories", category.id)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteDialog({ open: true, id: category.id, name: category.name })}
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
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

export function CategoriesCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    icon: "",
    sort_order: 0,
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
        resource: "categories",
        values: formData,
      },
      {
        onSuccess: () => {
          list("categories")
        },
      }
    )
  }

  return (
    <FormPageLayout
      title="Create Category"
      description="Add a new content category"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard
          title="Category Details"
          description="Enter the information for the new category"
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Marketing, Social Media"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">
                Category ID *
                <span className="ml-2 text-xs font-normal text-muted-foreground">(auto-generated)</span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="e.g. marketing, social-media"
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system. Auto-generated from name but can be customized.
              </p>
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Category Settings"
          description="Additional category configuration"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Marketing and advertising prompts"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                A brief description of what this category contains
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="lucide icon name (e.g., Megaphone, Mail)"
              />
              <p className="text-xs text-muted-foreground">
                Lucide icon name for visual representation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order || ""}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Display order in category lists (lower numbers appear first)
              </p>
            </div>
          </div>
        </FormCard>

        <div className="flex items-center gap-2">
          <Button type="submit">Create Category</Button>
          <Button type="button" variant="outline" onClick={() => list("categories")}>
            Cancel
          </Button>
        </div>
      </form>
    </FormPageLayout>
  )
}

export function CategoriesEdit() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: "categories", id: id || "" })
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    sort_order: 0,
  })

  useEffect(() => {
    if (data?.data) {
      setFormData({
        name: data.data.name || "",
        description: data.data.description || "",
        icon: data.data.icon || "",
        sort_order: data.data.sort_order || 0,
      })
    }
  }, [data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    update(
      {
        resource: "categories",
        id: id || "",
        values: formData,
      },
      {
        onSuccess: () => {
          list("categories")
        },
      }
    )
  }

  return (
    <FormPageLayout
      title="Edit Category"
      description="Update category information"
      isLoading={isLoading}
    >
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Category Details"
            description="Update the information for this category"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Marketing, Social Media"
                required
              />
            </div>
          </FormCard>

          <FormCard
            title="Category Settings"
            description="Additional category configuration"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Marketing and advertising prompts"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  A brief description of what this category contains
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="lucide icon name (e.g., Megaphone, Mail)"
                />
                <p className="text-xs text-muted-foreground">
                  Lucide icon name for visual representation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || ""}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Display order in category lists (lower numbers appear first)
                </p>
              </div>
            </div>
          </FormCard>

          <div className="flex items-center gap-2">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => list("categories")}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </FormPageLayout>
  )
}
