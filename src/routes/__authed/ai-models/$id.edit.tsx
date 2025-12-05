import { createFileRoute } from '@tanstack/react-router'

import { AiModelsEdit } from '@/pages/ai-models'

export const Route = createFileRoute('/__authed/ai-models/$id/edit')({
	component: AiModelsEdit
})
