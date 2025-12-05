import { useState, useEffect, ReactNode, ChangeEvent, useRef } from 'react'
import {
  FieldPath,
  FieldValues,
  useController,
  useFormContext,
} from 'react-hook-form'
import slugify from '@sindresorhus/slugify'
import { RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/libs/cn'
import { supabase } from '@/libs/supabase'

type AvailabilityStatus = 'idle' | 'typing' | 'checking' | 'available'

interface SlugFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  sourceValue: string
  resource: string
  currentId?: string
  label?: ReactNode
  description?: ReactNode
  placeholder?: string
  disabled?: boolean
}

export function SlugField<T extends FieldValues>({
  name,
  sourceValue,
  resource,
  currentId,
  label,
  description,
  placeholder,
  disabled = false,
}: SlugFieldProps<T>) {
  const [syncWithSource, setSyncWithSource] = useState(!disabled)
  const [status, setStatus] = useState<AvailabilityStatus>('idle')
  const { field } = useController({ name })
  const { setError, clearErrors } = useFormContext()

  // Track the last checked slug to prevent re-checking
  const lastCheckedSlugRef = useRef<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Find an available slug (appends -1, -2, etc. if needed)
  const findAvailableSlug = async (baseSlug: string): Promise<string> => {
    if (!baseSlug) return baseSlug

    // First check if the base slug is available
    let query = supabase
      .from(resource)
      .select('id', { count: 'exact', head: true })
      // @ts-expect-error - dynamic field name
      .eq(name, baseSlug)

    if (currentId) {
      query = query.neq('id', currentId)
    }

    const { count } = await query

    if (count === 0) {
      return baseSlug // Available as-is
    }

    // Slug is taken, find an available one with suffix
    const { data } = await supabase
      .from(resource)
      .select(name)
      .like(name, `${baseSlug}%`)

    // @ts-expect-error - dynamic field access
    const existingSlugs = new Set(data?.map((row) => row[name]) || [])

    let counter = 1
    let candidate = `${baseSlug}-${counter}`

    while (existingSlugs.has(candidate)) {
      counter++
      candidate = `${baseSlug}-${counter}`
    }

    return candidate
  }

  // Check slug availability with debounce
  const checkSlug = async (slug: string) => {
    if (!slug || disabled || slug === lastCheckedSlugRef.current) {
      return
    }

    setStatus('checking')
    setError(name, { type: 'manual', message: 'Checking availability...' })

    try {
      const availableSlug = await findAvailableSlug(slug)
      lastCheckedSlugRef.current = availableSlug

      if (availableSlug !== slug) {
        // Slug was taken, update to available one
        field.onChange(availableSlug)
      }

      setStatus('available')
      clearErrors(name)
    } catch (error) {
      console.error('Error checking slug:', error)
      setStatus('idle')
      clearErrors(name)
    }
  }

  // Debounced check when field value changes
  useEffect(() => {
    if (disabled || !field.value) {
      setStatus('idle')
      clearErrors(name)
      return
    }

    // If this slug was already checked and confirmed available, skip
    if (field.value === lastCheckedSlugRef.current) {
      setStatus('available')
      clearErrors(name)
      return
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setStatus('typing')
    setError(name, { type: 'manual', message: 'Checking availability...' })

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      checkSlug(field.value)
    }, 1000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [field.value, disabled])

  // Auto-generate slug from source (only when syncing)
  useEffect(() => {
    if (!syncWithSource || !sourceValue || disabled) return

    const newSlug = slugify(sourceValue)
    if (newSlug === field.value) return

    // Reset the last checked slug when auto-generating
    lastCheckedSlugRef.current = ''
    field.onChange(newSlug)
  }, [sourceValue, syncWithSource, disabled])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSyncWithSource(false)
    // Reset the last checked slug when user types
    lastCheckedSlugRef.current = ''
    const value = slugify(e.target.value)
    field.onChange(value)
  }

  const handleRegenerate = () => {
    if (!sourceValue) return

    // Reset the last checked slug when regenerating
    lastCheckedSlugRef.current = ''
    const newSlug = slugify(sourceValue)
    field.onChange(newSlug)
    setSyncWithSource(true)
  }

  const StatusIcon = () => {
    switch (status) {
      case 'typing':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Waiting for you to finish typing...</TooltipContent>
          </Tooltip>
        )
      case 'checking':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Checking availability...</TooltipContent>
          </Tooltip>
        )
      case 'available':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Check className="size-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>Slug is available!</TooltipContent>
          </Tooltip>
        )
      default:
        return null
    }
  }

  const getInputClassName = () => {
    switch (status) {
      case 'available':
        return 'border-green-500 focus-visible:ring-green-500'
      case 'typing':
      case 'checking':
        return 'border-yellow-500 focus-visible:ring-yellow-500'
      default:
        return ''
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
                  className={cn('font-mono text-sm pr-8', getInputClassName())}
                  {...field}
                  disabled={disabled}
                  onChange={handleInputChange}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <StatusIcon />
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
                    disabled={!sourceValue || status === 'checking'}
                  >
                    <RefreshCw
                      className={cn('size-4', {
                        'animate-spin': status === 'checking',
                      })}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate slug from title</TooltipContent>
              </Tooltip>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          {(status === 'typing' || status === 'checking') && (
            <p className="text-sm text-muted-foreground">
              {status === 'typing'
                ? 'Will check availability after you stop typing...'
                : 'Checking availability...'}
            </p>
          )}
        </FormItem>
      )}
    />
  )
}
