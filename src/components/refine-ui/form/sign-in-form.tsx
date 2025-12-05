import { useLogin, useRefineOptions } from '@refinedev/core'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

export const SignInForm = () => {
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState('')
	const [step, setStep] = useState<'email' | 'otp'>('email')

	const { title } = useRefineOptions()

	const { error, isPending, mutateAsync: login } = useLogin()

	const handleSendOTP = async (e: FormEvent) => {
		e.preventDefault()
		await login({ email })
		setStep('otp')
	}

	const handleVerifyOTP = async (e: FormEvent) => {
		e.preventDefault()
		await login({ email, otp })
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
						{step === 'email' ? (
							<form className="space-y-4" onSubmit={handleSendOTP}>
								<div className="space-y-2">
									<Label htmlFor="email">Email address</Label>
									<Input
										disabled={isPending}
										id="email"
										onChange={(e) => setEmail(e.target.value)}
										placeholder="name@example.com"
										required
										type="email"
										value={email}
									/>
								</div>

								{!isPending && error && (
									<div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
										{error.message}
									</div>
								)}

								<Button className="w-full" disabled={isPending} type="submit">
									{isPending ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											Sending...
										</>
									) : (
										'Send one-time password'
									)}
								</Button>
							</form>
						) : (
							<form className="space-y-4" onSubmit={handleVerifyOTP}>
								<div className="space-y-4">
									<Label htmlFor="otp">One-time password</Label>
									<div className="flex justify-center">
										<InputOTP
											autoFocus
											disabled={isPending}
											maxLength={6}
											onChange={(value) => setOtp(value)}
											pattern={REGEXP_ONLY_DIGITS}
											value={otp}
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
									<p className="text-center text-xs text-muted-foreground">
										Check your email at {email}
									</p>
								</div>

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
												Verifying...
											</>
										) : (
											'Verify and sign in'
										)}
									</Button>

									<Button
										className="w-full"
										disabled={isPending}
										onClick={() => {
											setStep('email')
											setOtp('')
										}}
										type="button"
										variant="ghost"
									>
										Use a different email
									</Button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

SignInForm.displayName = 'SignInForm'
