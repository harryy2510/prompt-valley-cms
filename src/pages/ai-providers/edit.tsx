import { useParams } from 'react-router'
import { useForm } from '@refinedev/react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'

const providerSchema = z.object({
  id: z.string().min(1, 'Provider ID is required'),
  name: z.string().min(1, 'Provider name is required'),
  logo_url: z.string().optional(),
  website_url: z.url('Must be a valid URL').optional().or(z.literal('')),
})

type ProviderFormData = z.infer<typeof providerSchema>

export function AiProvidersEdit() {
  const { id } = useParams()

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema) as any,
    refineCoreProps: {
      resource: 'ai_providers',
      action: 'edit',
      id: id || '',
      redirect: 'list',
    },
  })

  return (
    <EditView>
      <EditViewHeader title="Edit AI Provider" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFinish)}
          className="space-y-6 max-w-2xl"
        >
          <LoadingOverlay loading={query?.isLoading || formLoading}>
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
                <CardDescription>
                  Update the basic information for the AI provider
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

                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. openai, anthropic"
                          className="font-mono text-sm"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier cannot be changed after creation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding & Links</CardTitle>
                <CardDescription>
                  Update logo and website information
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
                          folder="ai-models"
                          label="Upload Logo"
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
                        />
                      </FormControl>
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
          </LoadingOverlay>
        </form>
      </Form>
    </EditView>
  )
}
