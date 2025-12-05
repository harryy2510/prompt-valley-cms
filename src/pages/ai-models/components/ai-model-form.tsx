import * as z from 'zod'
import { startCase } from 'lodash-es'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Enums, Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack, useSelect } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { nullableNonNegativeNumber, slug } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'

type ModelCapability = Enums<'model_capability'>
type AIModel = Tables<'ai_models'>
type AIProvider = Tables<'ai_providers'>

export const CAPABILITY_OPTIONS: ModelCapability[] = [
  'text',
  'image',
  'video',
  'code',
]

export const modelFormSchema = z.object({
  id: slug,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider_id: z.string().min(1, 'Provider is required'),
  capabilities: z.array(z.enum(CAPABILITY_OPTIONS)),
  context_window: nullableNonNegativeNumber,
  cost_input_per_million: nullableNonNegativeNumber,
  cost_output_per_million: nullableNonNegativeNumber,
  max_output_tokens: nullableNonNegativeNumber,
})

export type ModelFormValues = z.infer<typeof modelFormSchema>

interface AIModelFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function AIModelForm({ mode }: AIModelFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation },
    ...form
  } = useForm<AIModel, HttpError, ModelFormValues>({
    defaultValues: getDefaultsForSchema(modelFormSchema),
    resolver: zodResolver(modelFormSchema),
    refineCoreProps: {
      resource: 'ai_models',
      action: mode,
      redirect: 'list',
    },
  })

  const { options: providerOptions } = useSelect<AIProvider>({
    resource: 'ai_providers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  useUnsavedChangesWarning({
    formState: form.formState,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFinish)}
        className="space-y-6 w-full max-w-4xl mx-auto"
      >
        <LoadingOverlay containerClassName="space-y-6" loading={formLoading}>
          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the basic information for the AI model'
                  : 'Update the basic information for the AI model'}
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
                      <Input placeholder="e.g. GPT-4, Claude 3.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SlugField
                name="id"
                sourceValue={form.watch('name')}
                resource="ai_models"
                label="Model ID *"
                description={
                  isCreate
                    ? 'Unique identifier for the model'
                    : 'The ID cannot be changed after creation'
                }
                placeholder="e.g. gpt-4, claude-3-5"
                disabled={!isCreate}
              />

              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full max-w-[400px]">
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
                    <MultiSelect
                      values={field.value}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full max-w-[400px]">
                        <MultiSelectValue
                          overflowBehavior="cutoff"
                          placeholder="Select capabilities..."
                        />
                      </MultiSelectTrigger>
                      <MultiSelectContent search={false}>
                        <MultiSelectGroup>
                          {CAPABILITY_OPTIONS.map((cap) => (
                            <MultiSelectItem key={cap} value={cap}>
                              {startCase(cap)}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={back}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isCreate
                  ? 'Creating...'
                  : 'Saving...'
                : isCreate
                  ? 'Create Model'
                  : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
