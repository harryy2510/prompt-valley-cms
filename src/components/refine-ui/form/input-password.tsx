import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/libs/cn'

type InputPasswordProps = React.ComponentProps<'input'>

export const InputPassword = ({ className, ...props }: InputPasswordProps) => {
	const [showPassword, setShowPassword] = useState(false)

	return (
		<div className={cn('relative')}>
			<Input className={cn(className)} type={showPassword ? 'text' : 'password'} {...props} />
			<button
				className={cn('appearance-none', 'absolute right-3 top-1/2 -translate-y-1/2')}
				onClick={() => setShowPassword(!showPassword)}
				type="button"
			>
				{showPassword ? (
					<EyeOff className={cn('text-gray-500')} size={18} />
				) : (
					<Eye className={cn('text-gray-500')} size={18} />
				)}
			</button>
		</div>
	)
}

InputPassword.displayName = 'InputPassword'
