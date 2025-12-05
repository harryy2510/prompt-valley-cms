import { useOne, useParsed, useUpdate } from '@refinedev/core'
import { Eye, EyeOff, Star, StarOff } from 'lucide-react'

import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database.types'

import { PromptForm } from './components/prompt-form'

type Prompt = Tables<'prompts'>

export function PromptsEdit() {
	const { id } = useParsed()
	const { mutateAsync: updatePrompt, mutation } = useUpdate()

	const { query } = useOne<Prompt>({
		id: id || '',
		resource: 'prompts'
	})

	const prompt = query.data?.data

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
		<EditView>
			<EditViewHeader
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
				title="Edit Prompt"
			/>
			<PromptForm mode="edit" />
		</EditView>
	)
}
