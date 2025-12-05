import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
import { TagForm } from './components/tag-form'

export function TagsEdit() {
  return (
    <EditView>
      <EditViewHeader title="Edit Tag" />
      <TagForm mode="edit" />
    </EditView>
  )
}
