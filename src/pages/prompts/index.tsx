import { useList, useNavigation, useOne, useCreate, useUpdate, useDelete } from "@refinedev/core"
import { useParams } from "react-router"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus, Eye, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { supabaseClient } from "../../utility/supabaseClient"

export function PromptsList() {
  const { query } = useList({
    resource: "prompts",
  })
  const { data, isLoading, refetch } = query
  const { create, edit, show } = useNavigation()
  const { mutate: deletePrompt } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; title: string } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deletePrompt(
      {
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
          <h2 className="text-3xl font-bold tracking-tight">Prompts</h2>
          <p className="text-muted-foreground">Manage your prompt library</p>
        </div>
        <Button onClick={() => create("prompts")}>
          <Plus className="mr-2 size-4" />
          Create New
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No prompts found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((prompt: any) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">{prompt.title}</TableCell>
                    <TableCell>{prompt.category_id}</TableCell>
                    <TableCell>
                      <Badge variant={prompt.tier === "pro" ? "default" : "secondary"}>
                        {prompt.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prompt.is_published ? "default" : "secondary"}>
                        {prompt.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{prompt.views_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => show("prompts", prompt.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => edit("prompts", prompt.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, id: prompt.id, title: prompt.title })}
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
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;? This action cannot be undone.
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

export function PromptsCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const { data: categoriesData } = useList({ resource: "categories" })
  const { data: tagsData } = useList({ resource: "tags" })
  const { data: modelsData } = useList({ resource: "ai_models" })

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    content: "",
    category_id: "",
    tier: "free" as "free" | "pro",
    is_published: false,
    is_featured: false,
    images: [] as string[],
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [imageInput, setImageInput] = useState("")
  const [autoSlug, setAutoSlug] = useState(true)

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title })
    if (autoSlug) {
      setFormData({ ...formData, title, id: generateSlug(title) })
    }
  }

  const handleIdChange = (id: string) => {
    setFormData({ ...formData, id })
    setAutoSlug(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Create prompt first
    const { data: promptData, error: promptError} = await supabaseClient
      .from("prompts")
      .insert(formData)
      .select()
      .single()

    if (promptError) {
      console.error("Error creating prompt:", promptError)
      return
    }

    // Insert tag relations
    if (selectedTags.length > 0) {
      const tagRelations = selectedTags.map((tagId) => ({
        prompt_id: formData.id,
        tag_id: tagId,
      }))
      await supabaseClient.from("prompt_tags").insert(tagRelations)
    }

    // Insert model relations
    if (selectedModels.length > 0) {
      const modelRelations = selectedModels.map((modelId) => ({
        prompt_id: formData.id,
        model_id: modelId,
      }))
      await supabaseClient.from("prompt_models").insert(modelRelations)
    }

    list("prompts")
  }

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      })
      setImageInput("")
    }
  }

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== image),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Prompt</h2>
        <p className="text-muted-foreground">Add a new prompt to your library</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Prompt Details</CardTitle>
          <CardDescription>Enter the information for the new prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Write a compelling product description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">ID (slug) *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="write-compelling-product-description"
                required
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from title. You can edit it manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this prompt does"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the full prompt content here..."
                rows={8}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.data?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier">Tier *</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: "free" | "pro") => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="rounded-md border p-4 space-y-2">
                {tagsData?.data?.map((tag: any) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag.id])
                        } else {
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                        }
                      }}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Compatible Models</Label>
              <div className="rounded-md border p-4 space-y-2 max-h-60 overflow-y-auto">
                {modelsData?.data?.map((model: any) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModels([...selectedModels, model.id])
                        } else {
                          setSelectedModels(selectedModels.filter((id) => id !== model.id))
                        }
                      }}
                    />
                    <Label htmlFor={`model-${model.id}`} className="font-normal cursor-pointer">
                      {model.name} <span className="text-muted-foreground">({model.provider_id})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <div className="flex gap-2">
                <Input
                  id="images"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                  placeholder="Image URL"
                />
                <Button type="button" onClick={addImage} variant="outline">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((image) => (
                    <Badge key={image} variant="secondary" className="max-w-xs truncate">
                      {image}
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Create Prompt</Button>
              <Button type="button" variant="outline" onClick={() => list("prompts")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function PromptsEdit() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: "prompts", id: id || "" })
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const { data: categoriesData } = useList({ resource: "categories" })
  const { data: tagsData } = useList({ resource: "tags" })
  const { data: modelsData } = useList({ resource: "ai_models" })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category_id: "",
    tier: "free" as "free" | "pro",
    is_published: false,
    is_featured: false,
    images: [] as string[],
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [imageInput, setImageInput] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (data?.data && id) {
        setFormData({
          title: data.data.title || "",
          description: data.data.description || "",
          content: data.data.content || "",
          category_id: data.data.category_id || "",
          tier: data.data.tier || "free",
          is_published: data.data.is_published ?? false,
          is_featured: data.data.is_featured ?? false,
          images: data.data.images || [],
        })

        // Load existing tags
        const { data: tagsData } = await supabaseClient
          .from("prompt_tags")
          .select("tag_id")
          .eq("prompt_id", id)

        if (tagsData) {
          setSelectedTags(tagsData.map((t: any) => t.tag_id))
        }

        // Load existing models
        const { data: modelsDataResult } = await supabaseClient
          .from("prompt_models")
          .select("model_id")
          .eq("prompt_id", id)

        if (modelsDataResult) {
          setSelectedModels(modelsDataResult.map((m: any) => m.model_id))
        }
      }
    }

    loadData()
  }, [data, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Update prompt
    await supabaseClient
      .from("prompts")
      .update(formData)
      .eq("id", id || "")

    // Update tags: delete old ones and insert new ones
    await supabaseClient.from("prompt_tags").delete().eq("prompt_id", id || "")
    if (selectedTags.length > 0) {
      const tagRelations = selectedTags.map((tagId) => ({
        prompt_id: id || "",
        tag_id: tagId,
      }))
      await supabaseClient.from("prompt_tags").insert(tagRelations)
    }

    // Update models: delete old ones and insert new ones
    await supabaseClient.from("prompt_models").delete().eq("prompt_id", id || "")
    if (selectedModels.length > 0) {
      const modelRelations = selectedModels.map((modelId) => ({
        prompt_id: id || "",
        model_id: modelId,
      }))
      await supabaseClient.from("prompt_models").insert(modelRelations)
    }

    list("prompts")
  }

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      })
      setImageInput("")
    }
  }

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== image),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 max-w-4xl animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Prompt</h2>
        <p className="text-muted-foreground">Update prompt information</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Prompt Details</CardTitle>
          <CardDescription>Update the information for this prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Write a compelling product description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this prompt does"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the full prompt content here..."
                rows={8}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.data?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier">Tier *</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: "free" | "pro") => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="rounded-md border p-4 space-y-2">
                {tagsData?.data?.map((tag: any) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag.id])
                        } else {
                          setSelectedTags(selectedTags.filter((tagId) => tagId !== tag.id))
                        }
                      }}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Compatible Models</Label>
              <div className="rounded-md border p-4 space-y-2 max-h-60 overflow-y-auto">
                {modelsData?.data?.map((model: any) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModels([...selectedModels, model.id])
                        } else {
                          setSelectedModels(selectedModels.filter((modelId) => modelId !== model.id))
                        }
                      }}
                    />
                    <Label htmlFor={`model-${model.id}`} className="font-normal cursor-pointer">
                      {model.name} <span className="text-muted-foreground">({model.provider_id})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <div className="flex gap-2">
                <Input
                  id="images"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                  placeholder="Image URL"
                />
                <Button type="button" onClick={addImage} variant="outline">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((image) => (
                    <Badge key={image} variant="secondary" className="max-w-xs truncate">
                      {image}
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Update Prompt</Button>
              <Button type="button" variant="outline" onClick={() => list("prompts")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function PromptsShow() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: "prompts", id: id || "" })
  const { list, edit } = useNavigation()
  const [tags, setTags] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const loadRelations = async () => {
      if (id) {
        // Load tags
        const { data: promptTags } = await supabaseClient
          .from("prompt_tags")
          .select("tags(*)")
          .eq("prompt_id", id)

        if (promptTags) {
          setTags(promptTags.map((pt: any) => pt.tags))
        }

        // Load models
        const { data: promptModels } = await supabaseClient
          .from("prompt_models")
          .select("ai_models(*)")
          .eq("prompt_id", id)

        if (promptModels) {
          setModels(promptModels.map((pm: any) => pm.ai_models))
        }
      }
    }

    loadRelations()
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 max-w-4xl animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const prompt = data?.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{prompt?.title}</h2>
          <p className="text-muted-foreground">View prompt details</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => edit("prompts", id || "")}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => list("prompts")}>
            Back to List
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prompt Content</CardTitle>
              <div className="flex gap-2">
                <Badge variant={prompt?.tier === "pro" ? "default" : "secondary"}>
                  {prompt?.tier}
                </Badge>
                <Badge variant={prompt?.is_published ? "default" : "secondary"}>
                  {prompt?.is_published ? "Published" : "Draft"}
                </Badge>
                {prompt?.is_featured && <Badge>Featured</Badge>}
              </div>
            </div>
            {prompt?.description && (
              <CardDescription>{prompt.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base">Content</Label>
              <div className="mt-2 whitespace-pre-wrap rounded-md border p-4 bg-muted/30">
                {prompt?.content}
              </div>
            </div>

            {prompt?.images && prompt.images.length > 0 && (
              <div>
                <Label className="text-base">Images</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {prompt.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Prompt image ${index + 1}`}
                      className="h-24 w-24 rounded-md border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="text-sm font-medium">{prompt?.category_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Views</Label>
                <p className="text-sm font-medium">{prompt?.views_count || 0}</p>
              </div>
            </CardContent>
          </Card>

          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: any) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {models.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compatible Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {models.map((model: any) => (
                    <div key={model.id} className="text-sm">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-muted-foreground"> ({model.provider_id})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
