import { useEffect } from 'react'
import { useWarnAboutChange } from '@refinedev/core'

interface UseUnsavedChangesWarningOptions {
  /** Whether there are unsaved changes */
  isDirty: boolean
}

/**
 * Hook to warn users about unsaved changes when navigating away or closing the tab.
 *
 * This hook integrates with Refine's built-in unsaved changes warning system:
 * 1. Blocks in-app navigation with a confirmation dialog
 * 2. Shows browser's native "Leave site?" dialog on tab close/refresh
 *
 * @example
 * ```tsx
 * const form = useForm()
 * useUnsavedChangesWarning({
 *   isDirty: form.formState.isDirty,
 * })
 * ```
 */
export function useUnsavedChangesWarning({
  isDirty,
}: UseUnsavedChangesWarningOptions) {
  const { setWarnWhen } = useWarnAboutChange()

  // Sync form dirty state with Refine's warning system
  useEffect(() => {
    setWarnWhen(isDirty)
  }, [isDirty, setWarnWhen])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setWarnWhen(false)
    }
  }, [setWarnWhen])
}
