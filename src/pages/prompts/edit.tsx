import { useOne, useUpdate, useParsed } from '@refinedev/core'
import { Eye, EyeOff, Star, StarOff } from 'lucide-react'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
import { PromptForm } from './components/prompt-form'
import { Button } from '@/components/ui/button'
import { Tables } from '@/types/database.types'

type Prompt = Tables<'prompts'>

export function PromptsEdit() {
  const { id } = useParsed()
  const { mutateAsync: updatePrompt, mutation } = useUpdate()

  const { query } = useOne<Prompt>({
    resource: 'prompts',
    id: id || '',
  })

  const prompt = query.data?.data

  const handleTogglePublished = async () => {
    if (!id) return
    await updatePrompt({
      resource: 'prompts',
      id,
      values: { is_published: !prompt?.is_published },
      mutationMode: 'optimistic',
    })
  }

  const handleToggleFeatured = async () => {
    if (!id) return
    await updatePrompt({
      resource: 'prompts',
      id,
      values: { is_featured: !prompt?.is_featured },
      mutationMode: 'optimistic',
    })
  }

  return (
    <EditView>
      <EditViewHeader
        title="Edit Prompt"
        actionsSlot={
          prompt && (
            <>
              <Button
                variant={prompt.is_published ? 'default' : 'outline'}
                size="sm"
                onClick={handleTogglePublished}
                disabled={mutation.isPending}
                className="gap-2"
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
                variant={prompt.is_featured ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleFeatured}
                disabled={mutation.isPending}
                className="gap-2"
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
      />
      <PromptForm mode="edit" />
    </EditView>
  )
}
