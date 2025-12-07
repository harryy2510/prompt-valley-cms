import { useEffect, useRef, useState } from 'react'
import type { ImgHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/libs/cn'
import { getImageUrl } from '@/libs/storage'

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
	fallback?: ReactNode
	src: null | string | undefined
}

const getImageBrightness = (img: HTMLImageElement): number => {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	if (!ctx) return 128

	canvas.width = img.width
	canvas.height = img.height
	ctx.drawImage(img, 0, 0)

	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

	let total = 0
	let count = 0

	for (let i = 0; i < data.length; i += 16) {
		if (data[i + 3] < 128) continue
		total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
		count++
	}

	return count > 0 ? total / count : 128
}

const getBackgroundBrightness = (el: HTMLElement | null): number => {
	while (el) {
		const bg = getComputedStyle(el).backgroundColor
		const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
		if (match && bg !== 'rgba(0, 0, 0, 0)') {
			const [, r, g, b] = match.map(Number)
			return 0.299 * r + 0.587 * g + 0.114 * b
		}
		el = el.parentElement
	}
	return 20
}

export function Image({ alt = '', className, fallback, src, ...props }: ImageProps) {
	const imageUrl = getImageUrl(src)
	const [needsLightBg, setNeedsLightBg] = useState(false)
	const [isLoaded, setIsLoaded] = useState(false)
	const imgRef = useRef<HTMLImageElement>(null) // 1. Fixed type

	useEffect(() => {
		if (!imageUrl) return

		const img = new window.Image()
		img.crossOrigin = 'anonymous'
		img.src = imageUrl

		img.onload = () => {
			const imgBrightness = getImageBrightness(img)
			const bgBrightness = getBackgroundBrightness(imgRef.current) // 2. Use imgRef

			const contrast = Math.abs(imgBrightness - bgBrightness)
			setNeedsLightBg(contrast < 60 && bgBrightness < 128)
			setIsLoaded(true)
		}

		img.onerror = () => setIsLoaded(true)
	}, [imageUrl])

	if (!imageUrl) {
		return fallback ? <>{fallback}</> : null
	}

	return (
		<img
			{...props}
			alt={alt}
			className={cn(
				'object-contain transition-all',
				needsLightBg && 'bg-white/90',
				isLoaded ? 'opacity-100' : 'opacity-0',
				className
			)}
			ref={imgRef}
			src={imageUrl}
		/>
	)
}
