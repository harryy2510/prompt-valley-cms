import { createFileRoute } from '@tanstack/react-router'

import { FileBrowser } from '@/pages/media-library'

export const Route = createFileRoute('/__authed/media-library/$bucketId/$')({
	component: FileBrowser
})
