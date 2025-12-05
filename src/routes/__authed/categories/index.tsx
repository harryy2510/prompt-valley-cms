import { createFileRoute } from '@tanstack/react-router'

import { CategoriesList } from '@/pages/categories'

export const Route = createFileRoute('/__authed/categories/')({
	component: CategoriesList
})
