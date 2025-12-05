import { createFileRoute } from '@tanstack/react-router'

import { PromptsCreate } from '@/pages/prompts'

export const Route = createFileRoute('/__authed/prompts/create')({
	component: PromptsCreate
})
