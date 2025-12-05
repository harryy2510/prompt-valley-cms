import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

// ============================================
// Search Schema
// ============================================

const guestSearchSchema = z.object({
	redirect: z.string().optional()
})

// ============================================
// Protected Layout Route
// ============================================

export const Route = createFileRoute('/__guest')({
	beforeLoad: ({ context, search }) => {
		// Session is already in context from root route
		if (context.session) {
			throw redirect({
				to: search.redirect || '/'
			})
		}
	},
	validateSearch: guestSearchSchema
})
