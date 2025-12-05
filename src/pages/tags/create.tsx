import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'

import { TagForm } from './components/tag-form'

export function TagsCreate() {
	return (
		<CreateView>
			<CreateViewHeader title="Create Tag" />
			<TagForm mode="create" />
		</CreateView>
	)
}
