import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { slug } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'

type AIProvider = Tables<'ai_providers'>

export const providerFormSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Provider name is required'),
  logo_url: z.string().optional().nullable(),
  website_url: z.url('Must be a valid URL').optional().or(z.literal('')),
})

export type ProviderFormValues = z.infer<typeof providerFormSchema>

interface AIProviderFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function AIProviderForm({ mode }: AIProviderFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation },
    ...form
  } = useForm<AIProvider, HttpError, ProviderFormValues>({
    defaultValues: getDefaultsForSchema(providerFormSchema),
    resolver: zodResolver(providerFormSchema),
    refineCoreProps: {
      resource: 'ai_providers',
      action: mode,
      redirect: 'list',
    },
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
              <CardTitle>Provider Information</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the basic information for the AI provider'
                  : 'Update the basic information for the AI provider'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. OpenAI, Anthropic, Google"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SlugField
                name="id"
                sourceValue={form.watch('name')}
                resource="ai_providers"
                label="Provider ID *"
                description={
                  isCreate
                    ? 'Unique identifier for the provider'
                    : 'The ID cannot be changed after creation'
                }
                placeholder="e.g. openai, anthropic"
                disabled={!isCreate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding & Links</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Optional logo and website information'
                  : 'Update logo and website information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        folder="ai-providers"
                        label="Upload Logo"
                        mode={isCreate ? 'create' : 'edit'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
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
                  ? 'Create Provider'
                  : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
