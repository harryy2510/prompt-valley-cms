import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

let browserClient: null | SupabaseClient<Database> = null

/**
 * Client-side Supabase - for auth listeners and OTP only
 * All data operations go through server functions
 */
export function getSupabaseBrowserClient() {
	if (browserClient) {
		return browserClient
	}

	browserClient = createBrowserClient<Database>(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
		{
			auth: {
				storageKey: 'prompt-valley-auth'
			}
		}
	)

	return browserClient
}
