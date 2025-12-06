import { createFileRoute } from '@tanstack/react-router'

import { PromptsEdit } from '@/pages/prompts'

export const Route = createFileRoute('/__authed/prompts/edit/$id')({
	component: PromptsEdit
})
