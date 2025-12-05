import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'

import { PromptForm } from './components/prompt-form'

export function PromptsCreate() {
	return (
		<CreateView>
			<CreateViewHeader title="Create Prompt" />
			<PromptForm mode="create" />
		</CreateView>
	)
}
