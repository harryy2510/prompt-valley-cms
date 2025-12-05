import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'

import { AIProviderForm } from './components/ai-provider-form'

export function AiProvidersCreate() {
	return (
		<CreateView>
			<CreateViewHeader title="Create AI Provider" />
			<AIProviderForm mode="create" />
		</CreateView>
	)
}
