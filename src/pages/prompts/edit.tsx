import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
import { PromptForm } from './components/prompt-form'

export function PromptsEdit() {
  return (
    <EditView>
      <EditViewHeader title="Edit Prompt" />
      <PromptForm mode="edit" />
    </EditView>
  )
}
