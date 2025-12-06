import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerClient } from '@/libs/supabase/server'

export const listBucketsServer = createServerFn({ method: 'GET' }).handler(async () => {
	const supabase = getSupabaseServerClient()
	const { data, error } = await supabase.storage.listBuckets()

	if (error) {
		throw new Error(error.message)
	}

	return { data: data || [] }
})
