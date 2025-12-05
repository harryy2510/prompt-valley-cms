import { z } from 'zod'

/**
 * Slug validation: lowercase letters, numbers, and hyphens only.
 * Must start with a letter or number, no consecutive hyphens.
 */
export const slug = z
  .string()
  .min(1, 'ID is required')
  .max(100, 'ID must be 100 characters or less')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'ID must be lowercase letters, numbers, and hyphens only (e.g. "my-model-1")',
  )

export const nullableNonNegativeNumber = z
  .union([z.string(), z.number(), z.null()])
  .transform((val): number | null => {
    if (val === '' || val === null) return null
    return typeof val === 'number' ? val : Number(val)
  })
  .refine((val) => val === null || (Number.isFinite(val) && val >= 0), {
    message: 'Must be a non-negative number',
  }) as unknown as z.ZodPipe<
  z.ZodUnion<readonly [z.ZodNumber, z.ZodNull]>,
  z.ZodTransform<number | null, number | null>
>
