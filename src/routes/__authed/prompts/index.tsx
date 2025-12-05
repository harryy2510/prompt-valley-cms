import { createFileRoute } from '@tanstack/react-router'

import { PromptsList } from '@/pages/prompts'

export const Route = createFileRoute('/__authed/prompts/')({
	component: PromptsList
})
