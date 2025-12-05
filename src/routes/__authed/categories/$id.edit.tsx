import { createFileRoute } from '@tanstack/react-router'

import { CategoriesEdit } from '@/pages/categories'

export const Route = createFileRoute('/__authed/categories/$id/edit')({
	component: CategoriesEdit
})
