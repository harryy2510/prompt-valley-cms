import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'

import { CategoryForm } from './components/category-form'

export function CategoriesEdit() {
	return (
		<EditView>
			<EditViewHeader title="Edit Category" />
			<CategoryForm mode="edit" />
		</EditView>
	)
}
