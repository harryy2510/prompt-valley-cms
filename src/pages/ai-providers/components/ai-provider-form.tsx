import { zodResolver } from '@hookform/resolvers/zod'
import { useBack } from '@refinedev/core'
import type { FormAction, HttpError } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import * as z from 'zod'
import { getDefaultsForSchema } from 'zod-defaults'

import { SlugField } from '@/components/forms/slug-field'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import type { Tables } from '@/types/database.types'
import { slug } from '@/utils/validations'

type AIProvider = Tables<'ai_providers'>

export const providerFormSchema = z.object({
	id: slug,
	logo_url: z.string().optional().nullable(),
	name: z.string().min(1, 'Provider name is required'),
	website_url: z.url('Must be a valid URL').optional().or(z.literal(''))
})

export type ProviderFormValues = z.infer<typeof providerFormSchema>

type AIProviderFormProps = {
	mode: Exclude<FormAction, 'clone'>
}

export function AIProviderForm({ mode }: AIProviderFormProps) {
	const isCreate = mode === 'create'
	const back = useBack()

	const {
		refineCore: { formLoading, mutation, onFinish },
		...form
	} = useForm<AIProvider, HttpError, ProviderFormValues>({
		defaultValues: getDefaultsForSchema(providerFormSchema),
		refineCoreProps: {
			action: mode,
			redirect: 'list',
			resource: 'ai_providers'
		},
		resolver: zodResolver(providerFormSchema)
	})

	useUnsavedChangesWarning({
		formState: form.formState
	})

	return (
		<Form {...form}>
			<form className="space-y-6 w-full max-w-4xl mx-auto" onSubmit={form.handleSubmit(onFinish)}>
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
											<Input placeholder="e.g. OpenAI, Anthropic, Google" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SlugField
								description={
									isCreate
										? 'Unique identifier for the provider'
										: 'The ID cannot be changed after creation'
								}
								disabled={!isCreate}
								label="Provider ID *"
								name="id"
								placeholder="e.g. openai, anthropic"
								resource="ai_providers"
								sourceValue={form.watch('name')}
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
												folder="ai-providers"
												label="Upload Logo"
												mode={isCreate ? 'create' : 'edit'}
												onChange={field.onChange}
												value={field.value}
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
												placeholder="https://example.com"
												type="url"
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
						<Button onClick={back} type="button" variant="outline">
							Cancel
						</Button>
						<Button disabled={mutation.isPending} type="submit">
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
