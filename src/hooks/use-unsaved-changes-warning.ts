import { useEffect } from 'react'
import { useWarnAboutChange } from '@refinedev/core'
import type { FieldValues, FormState } from 'react-hook-form'

interface UseUnsavedChangesWarningOptions<T extends FieldValues> {
  /** The form state from react-hook-form */
  formState: FormState<T>
}

/**
 * Hook to warn users about unsaved changes when navigating away or closing the tab.
 *
 * This hook integrates with Refine's built-in unsaved changes warning system:
 * 1. Blocks in-app navigation with a confirmation dialog
 * 2. Shows browser's native "Leave site?" dialog on tab close/refresh
 *
 * Uses dirtyFields instead of isDirty to only warn when user has actually
 * modified fields (not when data is loaded into form).
 *
 * @example
 * ```tsx
 * const form = useForm()
 * useUnsavedChangesWarning({
 *   formState: form.formState,
 * })
 * ```
 */
export function useUnsavedChangesWarning<T extends FieldValues>({
  formState,
}: UseUnsavedChangesWarningOptions<T>) {
  const { setWarnWhen } = useWarnAboutChange()

  // Check if any fields have been modified by the user
  const hasDirtyFields = Object.keys(formState.dirtyFields).length > 0

  // Sync form dirty state with Refine's warning system
  useEffect(() => {
    setWarnWhen(hasDirtyFields)
  }, [hasDirtyFields, setWarnWhen])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setWarnWhen(false)
    }
  }, [setWarnWhen])
}
