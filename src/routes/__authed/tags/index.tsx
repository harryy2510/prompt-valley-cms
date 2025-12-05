import { createFileRoute } from '@tanstack/react-router'

import { TagsList } from '@/pages/tags'

export const Route = createFileRoute('/__authed/tags/')({
	component: TagsList
})
