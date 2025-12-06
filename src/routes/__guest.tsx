import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

// ============================================
// Search Schema
// ============================================

const guestSearchSchema = z.object({
	to: z.string().optional()
})

// ============================================
// Protected Layout Route
// ============================================

export const Route = createFileRoute('/__guest')({
	beforeLoad: ({ context, search }) => {
		// Session is already in context from root route
		if (context.identity) {
			throw redirect({
				to: search.to || '/'
			})
		}
	},
	validateSearch: guestSearchSchema
})
