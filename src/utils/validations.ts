import { z } from 'zod'

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
