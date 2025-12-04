import {
  CreateView,
  CreateViewHeader,
} from '@/components/refine-ui/views/create-view'
import { AIModelForm } from './components/ai-model-form'

export function AiModelsCreate() {
  return (
    <CreateView>
      <CreateViewHeader title="Create AI Model" />
      <AIModelForm mode="create" />
    </CreateView>
  )
}
