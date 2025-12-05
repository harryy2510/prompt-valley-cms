import { useState, useEffect, ReactNode, ChangeEvent, useMemo } from 'react'
import { FieldPath, FieldValues, useController } from 'react-hook-form'
import slugify from '@sindresorhus/slugify'
import { RefreshCw, Check, X, Loader2 } from 'lucide-react'
import { useDebounceCallback } from 'usehooks-ts'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/libs/cn'
import { supabase } from '@/libs/supabase'

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken'

interface SlugFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  sourceValue: string
  resource: string
  label?: ReactNode
  description?: ReactNode
  placeholder?: string
  disabled?: boolean
}

export function SlugField<T extends FieldValues>({
  name,
  sourceValue,
  resource,
  label,
  description,
  placeholder,
  disabled = false,
}: SlugFieldProps<T>) {
  const [syncWithSource, setSyncWithSource] = useState(!disabled)
  const [pendingSlug, setPendingSlug] = useState('')
  const { field } = useController({ name })

  const scheduleCheck = useDebounceCallback((value: string) => {
    setPendingSlug(value)
  }, 500)

  const resolveAvailableSlug = useCallback(
    async (baseSlug: string): Promise<string> => {
      if (!baseSlug) return baseSlug

      const { count } = await supabase
        .from(resource)
        .select(name, { count: 'exact', head: true })
        // @ts-ignore
        .eq(name, baseSlug)

      if (count === 0) return baseSlug

      const { data } = await supabase
        .from(resource)
        .select(name)
        .like(name, `${baseSlug}%`)

      // @ts-ignore
      const existingSlugs = new Set(data?.map((row) => row[name]) || [])

      let counter = 1
      let candidate = `${baseSlug}-${counter}`

      while (existingSlugs.has(candidate)) {
        counter++
        candidate = `${baseSlug}-${counter}`
      }

      return candidate
    },
    [resource, name],
  )

  const { data: resolvedSlug, isFetching } = useQuery({
    queryKey: ['slug-availability', resource, name, pendingSlug],
    queryFn: () => resolveAvailableSlug(pendingSlug),
    enabled: Boolean(pendingSlug) && !disabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const availability: AvailabilityStatus = useMemo(() => {
    if (!field.value || disabled) return 'idle'
    if (isFetching || field.value !== pendingSlug) return 'checking'
    if (resolvedSlug === field.value) return 'available'
    if (resolvedSlug && resolvedSlug !== field.value) return 'taken'
    return 'idle'
  }, [field.value, disabled, isFetching, resolvedSlug, pendingSlug])

  // Auto-update field when available slug is resolved
  useEffect(() => {
    if (
      resolvedSlug &&
      resolvedSlug !== field.value &&
      syncWithSource &&
      !disabled
    ) {
      field.onChange(resolvedSlug)
    }
  }, [resolvedSlug, syncWithSource, disabled])

  // Auto-generate slug from source
  useEffect(() => {
    if (!syncWithSource || !sourceValue || disabled) return

    const newSlug = slugify(sourceValue)
    if (newSlug === field.value) return

    field.onChange(newSlug)
    scheduleCheck(newSlug)
  }, [sourceValue, syncWithSource, disabled])

  // Trigger check on field change
  useEffect(() => {
    if (field.value && !disabled) {
      scheduleCheck(field.value)
    }
  }, [field.value, disabled])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSyncWithSource(false)
    field.onChange(e.target.value)
  }

  const handleRegenerate = () => {
    if (!sourceValue) return

    const newSlug = slugify(sourceValue)
    field.onChange(newSlug)
    setSyncWithSource(true)
    setPendingSlug(newSlug)
  }

  const AvailabilityIcon = () => {
    switch (availability) {
      case 'checking':
        return <Loader2 className="size-4 animate-spin text-muted-foreground" />
      case 'available':
        return <Check className="size-4 text-green-500" />
      case 'taken':
        return <X className="size-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <FormField
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <div className="relative flex-1">
                <Input
                  placeholder={placeholder}
                  className={cn('font-mono text-sm pr-8', {
                    'border-green-500 focus-visible:ring-green-500':
                      availability === 'available',
                    'border-destructive focus-visible:ring-destructive':
                      availability === 'taken',
                  })}
                  {...field}
                  disabled={disabled}
                  onChange={handleInputChange}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <AvailabilityIcon />
                </div>
              </div>
            </FormControl>
            {!disabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerate}
                    disabled={!sourceValue || isFetching}
                  >
                    <RefreshCw
                      className={cn('size-4', {
                        'animate-spin': availability === 'checking',
                      })}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate slug</TooltipContent>
              </Tooltip>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          {availability === 'taken' && (
            <p className="text-sm text-destructive">
              This slug is already taken
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
