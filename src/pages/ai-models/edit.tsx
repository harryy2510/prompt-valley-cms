import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'

import { AIModelForm } from './components/ai-model-form'

export function AiModelsEdit() {
	return (
		<EditView>
			<EditViewHeader title="Edit AI Model" />
			<AIModelForm mode="edit" />
		</EditView>
	)
}
