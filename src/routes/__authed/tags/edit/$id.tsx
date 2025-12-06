import { createFileRoute } from '@tanstack/react-router'

import { TagsEdit } from '@/pages/tags'

export const Route = createFileRoute('/__authed/tags/edit/$id')({
	component: TagsEdit
})
