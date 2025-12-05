import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'

import { AIProviderForm } from './components/ai-provider-form'

export function AiProvidersEdit() {
	return (
		<EditView>
			<EditViewHeader title="Edit AI Provider" />
			<AIProviderForm mode="edit" />
		</EditView>
	)
}
