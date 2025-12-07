import { zodResolver } from '@hookform/resolvers/zod'
import { useBack, useSelect } from '@refinedev/core'
import type { FormAction, HttpError } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { startCase } from 'lodash-es'
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
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import type { Enums, Tables } from '@/types/database.types'
import { nullableNonNegativeNumber, slug } from '@/utils/validations'

type AIModel = Tables<'ai_models'>
type AIProvider = Tables<'ai_providers'>
type ModelCapability = Enums<'model_capability'>

export const CAPABILITY_OPTIONS: Array<ModelCapability> = ['text', 'image', 'video', 'code']

export const modelFormSchema = z.object({
	capabilities: z.array(z.enum(CAPABILITY_OPTIONS)),
	context_window: nullableNonNegativeNumber,
	cost_input_per_million: nullableNonNegativeNumber,
	cost_output_per_million: nullableNonNegativeNumber,
	id: slug,
	max_output_tokens: nullableNonNegativeNumber,
	name: z.string().min(2, 'Name must be at least 2 characters'),
	provider_id: z.string().min(1, 'Provider is required')
})

export type ModelFormValues = z.infer<typeof modelFormSchema>

type AIModelFormProps = {
	mode: Exclude<FormAction, 'clone'>
}

export function AIModelForm({ mode }: AIModelFormProps) {
	const isCreate = mode === 'create'
	const back = useBack()

	const {
		refineCore: { formLoading, mutation, onFinish },
		...form
	} = useForm<AIModel, HttpError, ModelFormValues>({
		defaultValues: getDefaultsForSchema(modelFormSchema),
		refineCoreProps: {
			action: mode,
			redirect: false,
			resource: 'ai_models'
		},
		resolver: zodResolver(modelFormSchema)
	})

	const { options: providerOptions } = useSelect<AIProvider>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'ai_providers'
	})

	useUnsavedChangesWarning({
		formState: form.formState
	})

	const handleSubmit = async (data: ModelFormValues) => {
		await onFinish(data)
		back()
	}

	return (
		<Form {...form}>
			<form className="space-y-6 w-full max-w-4xl mx-auto" onSubmit={form.handleSubmit(handleSubmit)}>
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
								description={
									isCreate
										? 'Unique identifier for the model'
										: 'The ID cannot be changed after creation'
								}
								disabled={!isCreate}
								label="Model ID *"
								name="id"
								placeholder="e.g. gpt-4, claude-3-5"
								resource="ai_models"
								sourceField="name"
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
										<MultiSelect onValuesChange={field.onChange} values={field.value}>
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
												placeholder="e.g. 128000"
												type="number"
												{...field}
												value={field.value ?? ''}
											/>
										</FormControl>
										<FormDescription className="text-xs">Number of tokens</FormDescription>
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
												placeholder="e.g. 4096"
												type="number"
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
												placeholder="e.g. 3.00"
												step="0.01"
												type="number"
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
												placeholder="e.g. 15.00"
												step="0.01"
												type="number"
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
						<Button onClick={back} type="button" variant="outline">
							Cancel
						</Button>
						<Button disabled={mutation.isPending} type="submit">
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
