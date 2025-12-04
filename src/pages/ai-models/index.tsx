import { useList, useNavigation, useCreate, useUpdate, useOne, useDelete } from "@refinedev/core"
import { useParams } from "react-router"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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

export function AiModelsList() {
  const { query } = useList({
    resource: "ai_models",
  })
  const { data, isLoading, refetch } = query
  const { create, edit } = useNavigation()
  const { mutate: deleteModel } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteModel(
      {
        resource: "ai_models",
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
          <h2 className="text-3xl font-bold tracking-tight">AI Models</h2>
          <p className="text-muted-foreground">Manage AI model configurations</p>
        </div>
        <Button onClick={() => create("ai_models")}>
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
                <TableHead>Provider</TableHead>
                <TableHead>Context Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No models found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((model: any) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.provider_id}</TableCell>
                    <TableCell>{model.context_window?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => edit("ai_models", model.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, id: model.id, name: model.name })}
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
            <DialogTitle>Delete Model</DialogTitle>
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

export function AiModelsCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const { data: providersData } = useList({ resource: "ai_providers" })

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    provider_id: "",
    description: "",
    capabilities: [] as string[],
    context_window: 0,
    is_active: true,
  })
  const [capabilityInput, setCapabilityInput] = useState("")
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
        resource: "ai_models",
        values: formData,
      },
      {
        onSuccess: () => {
          list("ai_models")
        },
      }
    )
  }

  const addCapability = () => {
    if (capabilityInput.trim() && !formData.capabilities.includes(capabilityInput.trim())) {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, capabilityInput.trim()],
      })
      setCapabilityInput("")
    }
  }

  const removeCapability = (capability: string) => {
    setFormData({
      ...formData,
      capabilities: formData.capabilities.filter((c) => c !== capability),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create AI Model</h2>
        <p className="text-muted-foreground">Add a new AI model configuration</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Model Details</CardTitle>
          <CardDescription>Enter the information for the new AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="GPT-4 Turbo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">ID (slug) *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="gpt-4-turbo"
                required
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. You can edit it manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_id">Provider *</Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providersData?.data?.map((provider: any) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of the model"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context_window">Context Window</Label>
              <Input
                id="context_window"
                type="number"
                value={formData.context_window || ""}
                onChange={(e) => setFormData({ ...formData, context_window: parseInt(e.target.value) || 0 })}
                placeholder="128000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities</Label>
              <div className="flex gap-2">
                <Input
                  id="capabilities"
                  value={capabilityInput}
                  onChange={(e) => setCapabilityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCapability()
                    }
                  }}
                  placeholder="Add capability (e.g., text, image, code)"
                />
                <Button type="button" onClick={addCapability} variant="outline">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                      <button
                        type="button"
                        onClick={() => removeCapability(capability)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Create Model</Button>
              <Button type="button" variant="outline" onClick={() => list("ai_models")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function AiModelsEdit() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: "ai_models", id: id || "" })
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const { data: providersData } = useList({ resource: "ai_providers" })

  const [formData, setFormData] = useState({
    name: "",
    provider_id: "",
    description: "",
    capabilities: [] as string[],
    context_window: 0,
    is_active: true,
  })
  const [capabilityInput, setCapabilityInput] = useState("")

  useEffect(() => {
    if (data?.data) {
      setFormData({
        name: data.data.name || "",
        provider_id: data.data.provider_id || "",
        description: data.data.description || "",
        capabilities: data.data.capabilities || [],
        context_window: data.data.context_window || 0,
        is_active: data.data.is_active ?? true,
      })
    }
  }, [data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    update(
      {
        resource: "ai_models",
        id: id || "",
        values: formData,
      },
      {
        onSuccess: () => {
          list("ai_models")
        },
      }
    )
  }

  const addCapability = () => {
    if (capabilityInput.trim() && !formData.capabilities.includes(capabilityInput.trim())) {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, capabilityInput.trim()],
      })
      setCapabilityInput("")
    }
  }

  const removeCapability = (capability: string) => {
    setFormData({
      ...formData,
      capabilities: formData.capabilities.filter((c) => c !== capability),
    })
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
        <h2 className="text-3xl font-bold tracking-tight">Edit AI Model</h2>
        <p className="text-muted-foreground">Update model configuration</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Model Details</CardTitle>
          <CardDescription>Update the information for this AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="GPT-4 Turbo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_id">Provider *</Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providersData?.data?.map((provider: any) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of the model"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context_window">Context Window</Label>
              <Input
                id="context_window"
                type="number"
                value={formData.context_window || ""}
                onChange={(e) => setFormData({ ...formData, context_window: parseInt(e.target.value) || 0 })}
                placeholder="128000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities</Label>
              <div className="flex gap-2">
                <Input
                  id="capabilities"
                  value={capabilityInput}
                  onChange={(e) => setCapabilityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCapability()
                    }
                  }}
                  placeholder="Add capability (e.g., text, image, code)"
                />
                <Button type="button" onClick={addCapability} variant="outline">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                      <button
                        type="button"
                        onClick={() => removeCapability(capability)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Update Model</Button>
              <Button type="button" variant="outline" onClick={() => list("ai_models")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
