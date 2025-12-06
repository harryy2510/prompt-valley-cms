import { createFileRoute } from '@tanstack/react-router'

import { PromptsShow } from '@/pages/prompts'

export const Route = createFileRoute('/__authed/prompts/show/$id')({
	component: PromptsShow
})
