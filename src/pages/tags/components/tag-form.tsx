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
import { Input } from '@/components/ui/input'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import type { Tables } from '@/types/database.types'
import { slug } from '@/utils/validations'

type Tag = Tables<'tags'>

export const tagFormSchema = z.object({
	id: slug,
	name: z.string().min(1, 'Tag name is required')
})

export type TagFormValues = z.infer<typeof tagFormSchema>

type TagFormProps = {
	mode: Exclude<FormAction, 'clone'>
}

export function TagForm({ mode }: TagFormProps) {
	const isCreate = mode === 'create'
	const back = useBack()

	const {
		refineCore: { formLoading, mutation, onFinish },
		...form
	} = useForm<Tag, HttpError, TagFormValues>({
		defaultValues: getDefaultsForSchema(tagFormSchema),
		refineCoreProps: {
			action: mode,
			redirect: false,
			resource: 'tags'
		},
		resolver: zodResolver(tagFormSchema)
	})

	useUnsavedChangesWarning({
		formState: form.formState
	})

	const handleSubmit = async (data: TagFormValues) => {
		await onFinish(data)
		back()
	}

	return (
		<Form {...form}>
			<form className="space-y-6 w-full max-w-4xl mx-auto" onSubmit={form.handleSubmit(handleSubmit)}>
				<LoadingOverlay containerClassName="space-y-6" loading={formLoading}>
					<Card>
						<CardHeader>
							<CardTitle>Tag Information</CardTitle>
							<CardDescription>
								{isCreate ? 'Enter the information for the tag' : 'Update the tag information'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tag Name *</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Content Writing, SEO" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SlugField
								description={
									isCreate
										? 'Unique identifier for the tag'
										: 'The ID cannot be changed after creation'
								}
								disabled={!isCreate}
								label="Tag ID *"
								name="id"
								placeholder="e.g. content-writing, seo"
								resource="tags"
								sourceField="name"
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
									? 'Create Tag'
									: 'Save'}
						</Button>
					</div>
				</LoadingOverlay>
			</form>
		</Form>
	)
}
