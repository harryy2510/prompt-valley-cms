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

export function AiModelsList() {
  const { query } = useList({
    resource: "ai_models",
    queryOptions: {
      retry: 1,
    },
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

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="AI Models"
        description="Manage AI model configurations"
        action={{
          label: "Add Model",
          onClick: () => create("ai_models")
        }}
      />

      <DataTableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Context Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No models yet</p>
                      <p className="text-xs">Get started by adding your first AI model</p>
                    </div>
                  </div>
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => edit("ai_models", model.id)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteDialog({ open: true, id: model.id, name: model.name })}
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
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
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
    <FormPageLayout
      title="Create AI Model"
      description="Add a new AI model configuration"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard
          title="Model Information"
          description="Enter the basic information for the AI model"
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Model Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. GPT-4 Turbo, Claude 3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">
                Model ID *
                <span className="ml-2 text-xs font-normal text-muted-foreground">(auto-generated)</span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="e.g. gpt-4-turbo, claude-3"
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system. Auto-generated from name but can be customized.
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
          </div>
        </FormCard>

        <FormCard
          title="Model Details"
          description="Configure the model specifications and capabilities"
        >
          <div className="space-y-4">
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
          </div>
        </FormCard>

        <div className="flex items-center gap-2">
          <Button type="submit">Create Model</Button>
          <Button type="button" variant="outline" onClick={() => list("ai_models")}>
            Cancel
          </Button>
        </div>
      </form>
    </FormPageLayout>
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

  return (
    <FormPageLayout
      title="Edit AI Model"
      description="Update model configuration"
      isLoading={isLoading}
    >
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Model Information"
            description="Update the basic information for the AI model"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Model Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. GPT-4 Turbo, Claude 3"
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
          </FormCard>

          <FormCard
            title="Model Details"
            description="Update the model specifications and capabilities"
          >
            <div className="space-y-4">
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
            </div>
          </FormCard>

          <div className="flex items-center gap-2">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => list("ai_models")}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </FormPageLayout>
  )
}
