import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database.types'

import { STORAGE_KEY } from './constants'

let browserClient: null | ReturnType<typeof createBrowserClient<Database>> = null

/**
 * Browser-side Supabase client (singleton)
 * Used only for auth state listening and token refresh
 */
export function getSupabaseBrowserClient() {
	if (browserClient) return browserClient

	browserClient = createBrowserClient<Database>(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
		{
			auth: {
				storageKey: STORAGE_KEY
			}
		}
	)

	return browserClient
}
