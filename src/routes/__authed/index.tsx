import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/__authed/')({
	beforeLoad: () => {
		throw redirect({
			to: '/prompts'
		})
	}
})
