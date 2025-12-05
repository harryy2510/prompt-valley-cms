import { createFileRoute } from '@tanstack/react-router'

import { AiProvidersEdit } from '@/pages/ai-providers'

export const Route = createFileRoute('/__authed/ai-providers/$id/edit')({
	component: AiProvidersEdit
})
