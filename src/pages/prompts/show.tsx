import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useOne } from '@refinedev/core'

import {
  ShowView,
  ShowViewHeader,
} from '@/components/refine-ui/views/show-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getImageUrl } from '@/libs/storage'
import { supabase } from '@/libs/supabase'

export function PromptsShow() {
  const { id } = useParams()
  const { result, query } = useOne({
    resource: 'prompts',
    id: id || '',
    meta: {
      select: '*, categories(id, name)',
    },
  })
  const { isLoading } = query
  const [tags, setTags] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const loadRelations = async () => {
      if (id) {
        // Load tags
        const { data: promptTags } = await supabase
          .from('prompt_tags')
          .select('tags(*)')
          .eq('prompt_id', id)

        if (promptTags) {
          setTags(promptTags.map((pt: any) => pt.tags))
        }

        // Load models
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

  const prompt = result

  return (
    <ShowView>
      <ShowViewHeader title={prompt?.title || 'Prompt Details'} />
      <LoadingOverlay loading={isLoading}>
        {!isLoading && prompt && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Content</CardTitle>
                <CardDescription>{prompt?.description || ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Content</Label>
                    <div className="mt-2 whitespace-pre-wrap rounded-md border p-4 bg-muted/30 text-sm">
                      {prompt?.content}
                    </div>
                  </div>

                  {prompt?.images && prompt.images.length > 0 && (
                    <div>
                      <Label className="text-base font-medium">Images</Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {prompt.images.map((image: string, index: number) => {
                          const imageUrl = getImageUrl(image)
                          return (
                            <img
                              key={index}
                              src={imageUrl || ''}
                              alt={`Prompt image ${index + 1}`}
                              className="h-24 w-24 rounded-md border object-cover"
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant={prompt?.is_published ? 'default' : 'outline'}
                    >
                      {prompt?.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {prompt?.is_featured && <Badge>Featured</Badge>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tier:</span>
                    <Badge
                      variant={prompt?.tier === 'pro' ? 'default' : 'secondary'}
                    >
                      {prompt?.tier}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Views:</span>
                    <span className="text-sm font-medium">
                      {prompt?.views_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Category:</span>
                    <span className="text-sm">
                      {(prompt as any)?.categories?.name || '—'}
                    </span>
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
                    {tags.map((tag: any) => (
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
                  <div className="space-y-2">
                    {models.map((model: any) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span className="text-sm font-medium">
                          {model.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {model.provider_id}
                        </span>
                      </div>
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
