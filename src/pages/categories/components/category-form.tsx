import { zodResolver } from '@hookform/resolvers/zod'
import { useBack, useSelect } from '@refinedev/core'
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import type { Tables } from '@/types/database.types'
import { slug } from '@/utils/validations'

type Category = Tables<'categories'>

export const categoryFormSchema = z.object({
	id: slug,
	name: z.string().min(1, 'Category name is required'),
	parent_id: z.string().nullable().optional()
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

type CategoryFormProps = {
	mode: Exclude<FormAction, 'clone'>
}

export function CategoryForm({ mode }: CategoryFormProps) {
	const isCreate = mode === 'create'
	const back = useBack()

	const {
		refineCore: { formLoading, mutation, onFinish, query },
		...form
	} = useForm<Category, HttpError, CategoryFormValues>({
		defaultValues: getDefaultsForSchema(categoryFormSchema),
		refineCoreProps: {
			action: mode,
			redirect: false,
			resource: 'categories'
		},
		resolver: zodResolver(categoryFormSchema)
	})

	const currentCategoryId = query?.data?.data?.id

	// Fetch parent categories (only top-level categories can be parents)
	const { options: parentOptions } = useSelect<Category>({
		filters: [
			{
				field: 'parent_id',
				operator: 'null',
				value: true
			},
			// Exclude current category when editing
			...(currentCategoryId
				? [
						{
							field: 'id',
							operator: 'ne' as const,
							value: currentCategoryId
						}
					]
				: [])
		],
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'categories'
	})

	useUnsavedChangesWarning({
		formState: form.formState
	})

	const handleSubmit = async (data: CategoryFormValues) => {
		await onFinish(data)
		back()
	}

	return (
		<Form {...form}>
			<form className="space-y-6 w-full max-w-4xl mx-auto" onSubmit={form.handleSubmit(handleSubmit)}>
				<LoadingOverlay containerClassName="space-y-6" loading={formLoading}>
					<Card>
						<CardHeader>
							<CardTitle>Category Information</CardTitle>
							<CardDescription>
								{isCreate
									? 'Enter the information for the category'
									: 'Update the category information'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category Name *</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Marketing, Development" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SlugField
								description={
									isCreate
										? 'Unique identifier for the category'
										: 'The ID cannot be changed after creation'
								}
								disabled={!isCreate}
								label="Category ID *"
								name="id"
								placeholder="e.g. marketing, development"
								resource="categories"
								sourceField="name"
							/>

							<FormField
								control={form.control}
								name="parent_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Parent Category</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(value === '_none_' ? null : value)}
											value={field.value ?? '_none_'}
										>
											<FormControl>
												<SelectTrigger className="w-full max-w-[400px]">
													<SelectValue placeholder="Select a parent category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="_none_">
													<span className="text-muted-foreground">No parent (top-level)</span>
												</SelectItem>
												{parentOptions?.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Optionally nest this category under a parent. Only one level of nesting is
											allowed.
										</FormDescription>
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
									? 'Create Category'
									: 'Save'}
						</Button>
					</div>
				</LoadingOverlay>
			</form>
		</Form>
	)
}
