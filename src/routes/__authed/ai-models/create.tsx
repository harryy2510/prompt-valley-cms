import { createFileRoute } from '@tanstack/react-router'

import { AiModelsCreate } from '@/pages/ai-models'

export const Route = createFileRoute('/__authed/ai-models/create')({
	component: AiModelsCreate
})
