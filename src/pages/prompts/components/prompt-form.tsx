import { zodResolver } from '@hookform/resolvers/zod'
import { useBack, useSelect } from '@refinedev/core'
import type { FormAction, HttpError } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { startCase } from 'lodash-es'
import * as z from 'zod'
import { getDefaultsForSchema } from 'zod-defaults'

import { deleteJunctionServer, getRelatedServer, insertJunctionServer } from '@/actions/crud'
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
import { ImagesUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import {
	MultiSelect,
	MultiSelectContent,
	MultiSelectGroup,
	MultiSelectItem,
	MultiSelectTrigger,
	MultiSelectValue
} from '@/components/ui/multi-select'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import type { Enums, Tables } from '@/types/database.types'
import { slug } from '@/utils/validations'

type AIModel = Tables<'ai_models'>
type Category = Tables<'categories'>
type Prompt = Tables<'prompts'>
type Tag = Tables<'tags'>
type Tier = Enums<'tier'>

const TIER_OPTIONS: Array<Tier> = ['free', 'pro']

export const promptFormSchema = z.object({
	category_id: z.string().min(1, 'Category is required'),
	content: z.string().min(1, 'Content is required'),
	description: z.string().optional().nullable(),
	id: slug,
	images: z.array(z.string()),
	models: z.array(z.string()),
	// Junction table fields (not in prompts table)
	tags: z.array(z.string()),
	tier: z.enum(TIER_OPTIONS),
	title: z.string().min(1, 'Title is required')
})

export type PromptFormValues = z.infer<typeof promptFormSchema>

type PromptFormProps = {
	mode: Exclude<FormAction, 'clone'>
}

export function PromptForm({ mode }: PromptFormProps) {
	const isCreate = mode === 'create'
	const back = useBack()

	const {
		refineCore: { formLoading, id, mutation, onFinish, query },
		...form
	} = useForm<Prompt, HttpError, PromptFormValues>({
		defaultValues: getDefaultsForSchema(promptFormSchema),
		refineCoreProps: {
			action: mode,
			redirect: 'list',
			resource: 'prompts'
		},
		resolver: zodResolver(promptFormSchema)
	})

	const { options: categoryOptions } = useSelect<Category>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'categories'
	})

	const { options: tagOptions } = useSelect<Tag>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'tags'
	})

	const { options: modelOptions } = useSelect<AIModel>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'ai_models'
	})

	// Load junction table relations for edit mode using React Query
	const { isLoading: isLoadingRelations } = useQuery({
		enabled: !isCreate && !!id && !!query?.data?.data,
		queryFn: async () => {
			// Load existing tags
			const { data: tagsData } = await getRelatedServer({
				data: {
					fkColumn: 'prompt_id',
					fkValue: id as string,
					junctionTable: 'prompt_tags',
					select: 'tag_id'
				}
			})

			if (tagsData && tagsData.length > 0) {
				form.setValue(
					'tags',
					(tagsData as unknown as Array<{ tag_id: string }>).map((t) => t.tag_id)
				)
			}

			// Load existing models
			const { data: modelsData } = await getRelatedServer({
				data: {
					fkColumn: 'prompt_id',
					fkValue: id as string,
					junctionTable: 'prompt_models',
					select: 'model_id'
				}
			})

			if (modelsData && modelsData.length > 0) {
				form.setValue(
					'models',
					(modelsData as unknown as Array<{ model_id: string }>).map((m) => m.model_id)
				)
			}

			return { models: modelsData, tags: tagsData }
		},
		queryKey: ['prompt-relations', id]
	})

	useUnsavedChangesWarning({
		formState: form.formState
	})

	const handleSubmit = async (data: PromptFormValues) => {
		const { models, tags, ...promptData } = data

		// Submit the main prompt data
		await onFinish(promptData as unknown as PromptFormValues)

		// Handle junction tables after main record is saved
		const promptId = data.id

		if (isCreate) {
			// Insert new relations
			if (tags.length > 0) {
				await insertJunctionServer({
					data: {
						junctionTable: 'prompt_tags',
						records: tags.map((tagId) => ({
							prompt_id: promptId,
							tag_id: tagId
						}))
					}
				})
			}
			if (models.length > 0) {
				await insertJunctionServer({
					data: {
						junctionTable: 'prompt_models',
						records: models.map((modelId) => ({
							model_id: modelId,
							prompt_id: promptId
						}))
					}
				})
			}
		} else {
			// Update: delete old and insert new
			await deleteJunctionServer({
				data: {
					column: 'prompt_id',
					junctionTable: 'prompt_tags',
					value: promptId
				}
			})
			if (tags.length > 0) {
				await insertJunctionServer({
					data: {
						junctionTable: 'prompt_tags',
						records: tags.map((tagId) => ({
							prompt_id: promptId,
							tag_id: tagId
						}))
					}
				})
			}

			await deleteJunctionServer({
				data: {
					column: 'prompt_id',
					junctionTable: 'prompt_models',
					value: promptId
				}
			})
			if (models.length > 0) {
				await insertJunctionServer({
					data: {
						junctionTable: 'prompt_models',
						records: models.map((modelId) => ({
							model_id: modelId,
							prompt_id: promptId
						}))
					}
				})
			}
		}
	}

	const isLoading = formLoading || isLoadingRelations

	return (
		<Form {...form}>
			<form
				className="space-y-6 w-full max-w-4xl mx-auto"
				onSubmit={form.handleSubmit(handleSubmit)}
			>
				<LoadingOverlay containerClassName="space-y-6" loading={isLoading}>
					<Card>
						<CardHeader>
							<CardTitle>Prompt Details</CardTitle>
							<CardDescription>
								{isCreate
									? 'Enter the information for the new prompt'
									: 'Update the prompt information'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title *</FormLabel>
										<FormControl>
											<Input placeholder="Write a compelling product description" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SlugField
								description={
									isCreate
										? 'Unique identifier for the prompt'
										: 'The ID cannot be changed after creation'
								}
								disabled={!isCreate}
								label="Prompt ID *"
								name="id"
								placeholder="e.g. write-product-description"
								resource="prompts"
								sourceField="title"
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Brief description of what this prompt does"
												rows={2}
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
								name="content"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Prompt Content *</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Enter the full prompt content here..."
												rows={8}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Content Settings</CardTitle>
							<CardDescription>Configure category, tier, and publishing settings</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="category_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category *</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a category" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{categoryOptions?.map((option) => (
														<SelectItem key={option.value} value={String(option.value)}>
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
									name="tier"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tier *</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a tier" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{TIER_OPTIONS.map((tier) => (
														<SelectItem key={tier} value={tier}>
															{startCase(tier)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Relationships</CardTitle>
							<CardDescription>
								Associate tags and compatible models with this prompt
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="tags"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tags</FormLabel>
										<MultiSelect onValuesChange={field.onChange} values={field.value}>
											<MultiSelectTrigger className="w-full">
												<MultiSelectValue placeholder="Select tags..." />
											</MultiSelectTrigger>
											<MultiSelectContent>
												<MultiSelectGroup>
													{tagOptions?.map((tag) => (
														<MultiSelectItem key={tag.value} value={String(tag.value)}>
															{tag.label}
														</MultiSelectItem>
													))}
												</MultiSelectGroup>
											</MultiSelectContent>
										</MultiSelect>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="models"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Compatible Models</FormLabel>
										<MultiSelect onValuesChange={field.onChange} values={field.value}>
											<MultiSelectTrigger className="w-full">
												<MultiSelectValue placeholder="Select compatible models..." />
											</MultiSelectTrigger>
											<MultiSelectContent>
												<MultiSelectGroup>
													{modelOptions?.map((model) => (
														<MultiSelectItem key={model.value} value={String(model.value)}>
															{model.label}
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
							<CardTitle>Images</CardTitle>
							<CardDescription>Add images to illustrate the prompt</CardDescription>
						</CardHeader>
						<CardContent>
							<FormField
								control={form.control}
								name="images"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<ImagesUpload
												folder="prompts"
												label="Add Images"
												mode={isCreate ? 'create' : 'edit'}
												onChange={field.onChange}
												value={field.value}
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
									? 'Create Prompt'
									: 'Save'}
						</Button>
					</div>
				</LoadingOverlay>
			</form>
		</Form>
	)
}
