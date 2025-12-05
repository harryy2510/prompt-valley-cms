import { createFileRoute } from '@tanstack/react-router'

import { AiProvidersCreate } from '@/pages/ai-providers'

export const Route = createFileRoute('/__authed/ai-providers/create')({
	component: AiProvidersCreate
})
