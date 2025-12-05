import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'

import { CategoryForm } from './components/category-form'

export function CategoriesCreate() {
	return (
		<CreateView>
			<CreateViewHeader title="Create Category" />
			<CategoryForm mode="create" />
		</CreateView>
	)
}
