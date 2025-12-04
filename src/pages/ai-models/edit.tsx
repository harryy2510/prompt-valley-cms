import { useState } from 'react'
import { useParams } from 'react-router'
import { useForm } from '@refinedev/react-hook-form'
import { useSelect } from '@refinedev/core'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X } from 'lucide-react'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'

const modelSchema = z.object({
  id: z.string().min(1, 'Model ID is required'),
  name: z.string().min(1, 'Model name is required'),
  provider_id: z.string().min(1, 'Provider is required'),
  capabilities: z.array(z.string()).default([]),
  context_window: z.coerce.number().positive().optional().nullable(),
  cost_input_per_million: z.coerce.number().positive().optional().nullable(),
  cost_output_per_million: z.coerce.number().positive().optional().nullable(),
  max_output_tokens: z.coerce.number().positive().optional().nullable(),
})

type ModelFormData = z.infer<typeof modelSchema>

const CAPABILITY_OPTIONS = ['text', 'image', 'video', 'code']

export function AiModelsEdit() {
  const { id } = useParams()
  const [capabilityInput, setCapabilityInput] = useState('')

  const { options: providerOptions } = useSelect({
    resource: 'ai_providers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema) as any,
    refineCoreProps: {
      resource: 'ai_models',
      action: 'edit',
      id: id || '',
      redirect: 'list',
    },
  })

  const addCapability = (cap: string) => {
    const current = form.getValues('capabilities')
    if (!current.includes(cap)) {
      form.setValue('capabilities', [...current, cap])
    }
  }

  const removeCapability = (cap: string) => {
    const current = form.getValues('capabilities')
    form.setValue(
      'capabilities',
      current.filter((c: string) => c !== cap),
    )
  }

  return (
    <EditView>
      <EditViewHeader title="Edit AI Model" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFinish)}
          className="space-y-6 max-w-2xl"
        >
          <LoadingOverlay loading={query?.isLoading || formLoading}>
            {!query?.isLoading && (
              <>
                <Card>
              <CardHeader>
                <CardTitle>Model Information</CardTitle>
                <CardDescription>
                  Update the basic information for the AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. GPT-4, Claude 3.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. gpt-4, claude-3-5"
                          className="font-mono text-sm"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        The ID cannot be changed after creation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providerOptions?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capabilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capabilities</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Select
                            value={capabilityInput}
                            onValueChange={(value) => {
                              addCapability(value)
                              setCapabilityInput('')
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add capability" />
                            </SelectTrigger>
                            <SelectContent>
                              {CAPABILITY_OPTIONS.map((cap) => (
                                <SelectItem key={cap} value={cap}>
                                  {cap}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {field.value?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value?.map((cap: string) => (
                              <Badge key={cap} variant="secondary">
                                {cap}
                                <button
                                  type="button"
                                  onClick={() => removeCapability(cap)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
                <CardDescription>Optional model parameters</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="context_window"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context Window</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 128000"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Number of tokens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_output_tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Output Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 4096"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_input_per_million"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input Cost (per 1M tokens)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 3.00"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">USD</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_output_per_million"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output Cost (per 1M tokens)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 15.00"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">USD</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={formLoading}>
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </LoadingOverlay>
        </form>
      </Form>
    </EditView>
  )
}
