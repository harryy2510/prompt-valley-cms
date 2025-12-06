import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin, useRefineOptions } from '@refinedev/core'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

const emailSchema = z.object({
	email: z.email('Please enter a valid email address'),
	otp: z.string().optional()
})

const otpSchema = z.object({
	email: z.email('Please enter a valid email address'),
	otp: z.string().length(6, 'Please enter the 6-digit code')
})

type FormValues = z.infer<typeof emailSchema>

export const SignInForm = () => {
	const [step, setStep] = useState<'email' | 'otp'>('email')
	const { title } = useRefineOptions()
	const { error, isPending, mutateAsync: login } = useLogin()

	const form = useForm<FormValues>({
		defaultValues: {
			email: '',
			otp: ''
		},
		resolver: zodResolver(step === 'email' ? emailSchema : otpSchema)
	})

	const handleSubmit = async (data: FormValues) => {
		if (step === 'email') {
			await login({ email: data.email })
			setStep('otp')
		} else {
			await login({ email: data.email, otp: data.otp })
		}
	}

	const handleBackToEmail = () => {
		setStep('email')
		form.setValue('otp', '')
		form.clearErrors()
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="flex justify-center">{title.icon}</div>

				<div className="w-full divide-y overflow-hidden rounded border bg-background">
					<div className="p-6">
						<h2 className="text-lg font-semibold">Sign In</h2>
						<p className="text-sm text-muted-foreground">
							{step === 'email'
								? 'Enter your email to receive a one-time password'
								: 'Enter the code sent to your email'}
						</p>
					</div>

					<div className="p-6">
						<Form {...form}>
							<form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
								{step === 'email' ? (
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email address</FormLabel>
												<FormControl>
													<Input
														disabled={isPending}
														placeholder="name@example.com"
														type="email"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								) : (
									<div className="space-y-4">
										<FormField
											control={form.control}
											name="otp"
											render={({ field }) => (
												<FormItem>
													<FormLabel>One-time password</FormLabel>
													<FormControl>
														<div className="flex justify-center">
															<InputOTP
																autoFocus
																disabled={isPending}
																maxLength={6}
																pattern={REGEXP_ONLY_DIGITS}
																{...field}
															>
																<InputOTPGroup>
																	<InputOTPSlot index={0} />
																	<InputOTPSlot index={1} />
																	<InputOTPSlot index={2} />
																</InputOTPGroup>
																<InputOTPSeparator />
																<InputOTPGroup>
																	<InputOTPSlot index={3} />
																	<InputOTPSlot index={4} />
																	<InputOTPSlot index={5} />
																</InputOTPGroup>
															</InputOTP>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<p className="text-center text-xs text-muted-foreground">
											Check your email at {form.getValues('email')}
										</p>
									</div>
								)}

								{!isPending && error && (
									<div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
										{error.message}
									</div>
								)}

								<div className="space-y-2">
									<Button className="w-full" disabled={isPending} type="submit">
										{isPending ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												{step === 'email' ? 'Sending...' : 'Verifying...'}
											</>
										) : step === 'email' ? (
											'Send one-time password'
										) : (
											'Verify and sign in'
										)}
									</Button>

									{step === 'otp' && (
										<Button
											className="w-full"
											disabled={isPending}
											onClick={handleBackToEmail}
											type="button"
											variant="ghost"
										>
											Use a different email
										</Button>
									)}
								</div>
							</form>
						</Form>
					</div>
				</div>
			</div>
		</div>
	)
}

SignInForm.displayName = 'SignInForm'
