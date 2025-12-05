import { useState, useEffect } from 'react'
import { useOne } from '@refinedev/core'
import { useParams } from 'react-router'

import {
  ShowView,
  ShowViewHeader,
} from '@/components/refine-ui/views/show-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tables } from '@/types/database.types'
import { getImageUrl } from '@/libs/storage'
import { supabase } from '@/libs/supabase'
import { fShortenNumber } from '@/utils/format'

type Prompt = Tables<'prompts'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name'> | null
}

type Tag = Tables<'tags'>
type AIModel = Tables<'ai_models'>

export function PromptsShow() {
  const { id } = useParams()
  const [tags, setTags] = useState<Tag[]>([])
  const [models, setModels] = useState<AIModel[]>([])

  const { query } = useOne<Prompt>({
    resource: 'prompts',
    id: id || '',
    meta: {
      select: '*, categories(id, name)',
    },
  })

  const prompt = query.data?.data
  const isLoading = query.isLoading

  useEffect(() => {
    const loadRelations = async () => {
      if (id) {
        const { data: promptTags } = await supabase
          .from('prompt_tags')
          .select('tags(*)')
          .eq('prompt_id', id)

        if (promptTags) {
          setTags(promptTags.map((pt: any) => pt.tags))
        }

        const { data: promptModels } = await supabase
          .from('prompt_models')
          .select('ai_models(*)')
          .eq('prompt_id', id)

        if (promptModels) {
          setModels(promptModels.map((pm: any) => pm.ai_models))
        }
      }
    }

    loadRelations()
  }, [id])

  return (
    <ShowView>
      <ShowViewHeader title={prompt?.title || 'Prompt Details'} />
      <LoadingOverlay loading={isLoading}>
        {prompt && (
          <div className="space-y-6 w-full max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Content</CardTitle>
                {prompt.description && (
                  <CardDescription>{prompt.description}</CardDescription>
                )}
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
                            key={index}
                            src={imageUrl || ''}
                            alt={`Prompt image ${index + 1}`}
                            className="size-24 rounded-md border object-cover"
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
                <CardDescription>
                  Current publication and tier status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={prompt.is_published ? 'default' : 'outline'}
                        className={
                          prompt.is_published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : ''
                        }
                      >
                        {prompt.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {prompt.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tier</p>
                    <Badge
                      variant={prompt.tier === 'pro' ? 'default' : 'secondary'}
                      className="mt-1 capitalize"
                    >
                      {prompt.tier}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="mt-1 text-sm font-medium">
                      {prompt.categories?.name || '—'}
                    </p>
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
                  <CardDescription>
                    Associated tags for organization
                  </CardDescription>
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
                  <CardDescription>
                    AI models that work with this prompt
                  </CardDescription>
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
