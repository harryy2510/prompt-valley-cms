import { createFileRoute } from '@tanstack/react-router'

import { TagsCreate } from '@/pages/tags'

export const Route = createFileRoute('/__authed/tags/create')({
	component: TagsCreate
})
