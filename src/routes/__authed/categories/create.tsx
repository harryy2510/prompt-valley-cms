import { createFileRoute } from '@tanstack/react-router'

import { CategoriesCreate } from '@/pages/categories'

export const Route = createFileRoute('/__authed/categories/create')({
	component: CategoriesCreate
})
