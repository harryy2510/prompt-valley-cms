import { createFileRoute } from '@tanstack/react-router'

import { AiProvidersList } from '@/pages/ai-providers'

export const Route = createFileRoute('/__authed/ai-providers/')({
	component: AiProvidersList
})
