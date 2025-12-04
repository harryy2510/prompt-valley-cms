import { z } from 'zod'

export const nullableNonNegativeNumber = z
  .union([z.number(), z.null()])
  .transform((val): number | null => {
    // @ts-ignore
    if (val === '' || val === null) return null
    return typeof val === 'number' ? val : Number(val)
  })
  .refine((val) => val === null || val >= 0, {
    message: 'Must be a non-negative number',
  })
