import { createFileRoute } from '@tanstack/react-router'

import { BucketList } from '@/pages/media-library'

export const Route = createFileRoute('/__authed/media-library/')({
	component: BucketList
})
