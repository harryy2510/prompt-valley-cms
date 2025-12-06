import { useOne, useParsed, useUpdate } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, Star, StarOff } from 'lucide-react'

import { getRelatedServer } from '@/actions/crud'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { ShowView, ShowViewHeader } from '@/components/refine-ui/views/show-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getImageUrl } from '@/libs/storage'
import type { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'

type AIModel = Tables<'ai_models'>

type Prompt = Tables<'prompts'> & {
	categories: null | Pick<Tables<'categories'>, 'id' | 'name'>
}
type Tag = Tables<'tags'>

export function PromptsShow() {
	const { id } = useParsed()
	const { mutateAsync: updatePrompt, mutation } = useUpdate()

	const { query, result: prompt } = useOne<Prompt>({
		id: id || '',
		meta: {
			select: '*, categories(id, name)'
		},
		resource: 'prompts'
	})

	// Load tags using React Query
	const { data: tags = [] } = useQuery({
		enabled: !!id,
		queryFn: async () => {
			const { data } = await getRelatedServer({
				data: {
					fkColumn: 'prompt_id',
					fkValue: id as string,
					junctionTable: 'prompt_tags',
					select: 'tags(*)'
				}
			})
			return data.map((pt: { tags: Tag }) => pt.tags)
		},
		queryKey: ['prompt-tags', id]
	})

	// Load models using React Query
	const { data: models = [] } = useQuery({
		enabled: !!id,
		queryFn: async () => {
			const { data } = await getRelatedServer({
				data: {
					fkColumn: 'prompt_id',
					fkValue: id as string,
					junctionTable: 'prompt_models',
					select: 'ai_models(*)'
				}
			})
			return data.map((pm: { ai_models: AIModel }) => pm.ai_models)
		},
		queryKey: ['prompt-models', id]
	})

	const isLoading = query.isLoading

	const handleTogglePublished = async () => {
		if (!id) return
		await updatePrompt({
			id,
			mutationMode: 'optimistic',
			resource: 'prompts',
			values: { is_published: !prompt?.is_published }
		})
	}

	const handleToggleFeatured = async () => {
		if (!id) return
		await updatePrompt({
			id,
			mutationMode: 'optimistic',
			resource: 'prompts',
			values: { is_featured: !prompt?.is_featured }
		})
	}

	return (
		<ShowView>
			<ShowViewHeader
				actionsSlot={
					prompt && (
						<>
							<Button
								className="gap-2"
								disabled={mutation.isPending}
								onClick={handleTogglePublished}
								size="sm"
								variant={prompt.is_published ? 'default' : 'outline'}
							>
								{prompt.is_published ? (
									<>
										<Eye className="size-4" />
										Published
									</>
								) : (
									<>
										<EyeOff className="size-4" />
										Draft
									</>
								)}
							</Button>
							<Button
								className="gap-2"
								disabled={mutation.isPending}
								onClick={handleToggleFeatured}
								size="sm"
								variant={prompt.is_featured ? 'default' : 'outline'}
							>
								{prompt.is_featured ? (
									<>
										<Star className="size-4 fill-current" />
										Featured
									</>
								) : (
									<>
										<StarOff className="size-4" />
										Not Featured
									</>
								)}
							</Button>
						</>
					)
				}
				title={prompt?.title || 'Prompt Details'}
			/>
			<LoadingOverlay loading={isLoading}>
				{prompt && (
					<div className="space-y-6 w-full max-w-4xl mx-auto">
						<Card>
							<CardHeader>
								<CardTitle>Prompt Content</CardTitle>
								{prompt.description && <CardDescription>{prompt.description}</CardDescription>}
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
									{prompt.content}
								</div>

								{prompt.images && prompt.images.length > 0 && (
									<div>
										<p className="text-sm font-medium mb-2">Images</p>
										<div className="flex flex-wrap gap-2">
											{prompt.images.map((image: string, index: number) => {
												const imageUrl = getImageUrl(image)
												return (
													<img
														alt={`Prompt image ${index + 1}`}
														className="size-24 rounded-md border object-cover"
														key={index}
														src={imageUrl || ''}
													/>
												)
											})}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Status & Classification</CardTitle>
								<CardDescription>Current publication and tier status</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
									<div>
										<p className="text-sm text-muted-foreground">Status</p>
										<div className="mt-1 flex items-center gap-2">
											<Badge
												className={
													prompt.is_published
														? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
														: ''
												}
												variant={prompt.is_published ? 'default' : 'outline'}
											>
												{prompt.is_published ? 'Published' : 'Draft'}
											</Badge>
											{prompt.is_featured && <Badge variant="secondary">Featured</Badge>}
										</div>
									</div>

									<div>
										<p className="text-sm text-muted-foreground">Tier</p>
										<Badge
											className="mt-1 capitalize"
											variant={prompt.tier === 'pro' ? 'default' : 'secondary'}
										>
											{prompt.tier}
										</Badge>
									</div>

									<div>
										<p className="text-sm text-muted-foreground">Category</p>
										<p className="mt-1 text-sm font-medium">{prompt.categories?.name || '—'}</p>
									</div>

									<div>
										<p className="text-sm text-muted-foreground">Views</p>
										<p className="mt-1 text-sm font-medium tabular-nums">
											{fShortenNumber(prompt.views_count || 0)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{tags.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Tags</CardTitle>
									<CardDescription>Associated tags for organization</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{tags.map((tag) => (
											<Badge key={tag.id} variant="secondary">
												{tag.name}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{models.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Compatible Models</CardTitle>
									<CardDescription>AI models that work with this prompt</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{models.map((model) => (
											<Badge key={model.id} variant="outline">
												{model.name}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</LoadingOverlay>
		</ShowView>
	)
}
