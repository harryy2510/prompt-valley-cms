import { createFileRoute } from '@tanstack/react-router'

import { AiModelsList } from '@/pages/ai-models'

export const Route = createFileRoute('/__authed/ai-models/')({
	component: AiModelsList
})
