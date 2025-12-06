/* eslint-disable react-hooks/set-state-in-effect */
import slugify from '@sindresorhus/slugify'
import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { findAvailableSlugServer } from '@/actions/crud'
import { Button } from '@/components/ui/button'
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/libs/cn'

type AvailabilityStatus = 'available' | 'checking' | 'idle' | 'typing'

type SlugFieldProps<T extends FieldValues> = {
	currentId?: string
	description?: ReactNode
	disabled?: boolean
	label?: ReactNode
	name: FieldPath<T>
	placeholder?: string
	resource: string
	sourceField: string
}

export function SlugField<T extends FieldValues>({
	currentId,
	description,
	disabled = false,
	label,
	name,
	placeholder,
	resource,
	sourceField
}: SlugFieldProps<T>) {
	const sourceValue = useWatch({ name: sourceField })
	const [syncWithSource, setSyncWithSource] = useState(!disabled)
	const [status, setStatus] = useState<AvailabilityStatus>('idle')
	const { field } = useController({ name })
	const { clearErrors, setError } = useFormContext()

	// Track the last checked slug to prevent re-checking
	const lastCheckedSlugRef = useRef<string>('')
	const debounceTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

	// Find an available slug using server function
	const findAvailableSlug = useCallback(
		async (baseSlug: string): Promise<string> => {
			if (!baseSlug) return baseSlug

			const { slug } = await findAvailableSlugServer({
				data: {
					baseSlug,
					columnName: name,
					currentId,
					resource
				}
			})

			return slug
		},
		[currentId, name, resource]
	)

	// Check slug availability with debounce
	const checkSlug = useCallback(
		async (slug: string) => {
			if (!slug || disabled || slug === lastCheckedSlugRef.current) {
				return
			}

			setStatus('checking')
			setError(name, { message: 'Checking availability...', type: 'manual' })

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
		},
		[clearErrors, disabled, field, findAvailableSlug, name, setError]
	)

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
		setError(name, { message: 'Checking availability...', type: 'manual' })

		// Set new timer
		debounceTimerRef.current = setTimeout(() => {
			void checkSlug(field.value)
		}, 1000)

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [field.value, disabled, setError, name, clearErrors, checkSlug])

	// Auto-generate slug from source (only when syncing)
	useEffect(() => {
		if (!syncWithSource || !sourceValue || disabled) return

		const newSlug = slugify(sourceValue)
		if (newSlug === field.value) return

		// Reset the last checked slug when auto-generating
		lastCheckedSlugRef.current = ''
		field.onChange(newSlug)
	}, [sourceValue, syncWithSource, disabled, field])

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

	const getInputClassName = () => {
		switch (status) {
			case 'available':
				return 'border-green-500 focus-visible:ring-green-500'
			case 'checking':
			case 'typing':
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
									className={cn('font-mono text-sm pr-8', getInputClassName())}
									placeholder={placeholder}
									{...field}
									disabled={disabled}
									onChange={handleInputChange}
								/>
								<div className="absolute right-2 top-1/2 -translate-y-1/2">
									<StatusIcon status={status} />
								</div>
							</div>
						</FormControl>
						{!disabled && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={!sourceValue || status === 'checking'}
										onClick={handleRegenerate}
										size="icon"
										type="button"
										variant="outline"
									>
										<RefreshCw
											className={cn('size-4', {
												'animate-spin': status === 'checking'
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

function StatusIcon({ status }: { status: AvailabilityStatus }) {
	switch (status) {
		case 'available':
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<Check className="size-4 text-green-500" />
					</TooltipTrigger>
					<TooltipContent>Slug is available!</TooltipContent>
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
		case 'typing':
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<AlertCircle className="size-4 text-muted-foreground" />
					</TooltipTrigger>
					<TooltipContent>Waiting for you to finish typing...</TooltipContent>
				</Tooltip>
			)
		default:
			return null
	}
}
