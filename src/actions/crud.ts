import type { CrudFilters, CrudSorting, Pagination } from '@refinedev/core'
import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerClient } from '@/libs/supabase/server'

// ============================================
// Types
// ============================================

type GetListInput = {
	filters?: CrudFilters
	meta?: MetaOptions
	pagination?: Pagination
	resource: string
	sorters?: CrudSorting
}

type MetaOptions = {
	[key: string]: unknown
	select?: string
}

// ============================================
// Server Functions
// ============================================

export const getListServer = createServerFn({ method: 'POST' })
	.inputValidator((data: GetListInput) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { filters, meta, pagination, resource, sorters } = data

		const selectQuery = meta?.select || '*'
		let query = supabase.from(resource).select(selectQuery, { count: 'exact' })

		// Apply pagination
		if (pagination) {
			const { current = 1, pageSize = 10 } = pagination
			const start = (current - 1) * pageSize
			const end = start + pageSize - 1
			query = query.range(start, end)
		}

		// Apply filters
		if (filters) {
			for (const filter of filters) {
				if ('field' in filter && filter.field) {
					const { field, operator, value } = filter
					switch (operator) {
						case 'contains':
							query = query.ilike(field, `%${value}%`)
							break
						case 'eq':
							query = query.eq(field, value)
							break
						case 'in':
							query = query.in(field, value as Array<unknown>)
							break
						case 'ne':
							query = query.neq(field, value)
							break
					}
				}
			}
		}

		// Apply sorting
		if (sorters && sorters.length > 0) {
			for (const sorter of sorters) {
				query = query.order(sorter.field, { ascending: sorter.order === 'asc' })
			}
		}

		const { count, data: records, error } = await query

		if (error) {
			throw new Error(error.message)
		}

		return { data: records || [], total: count || 0 }
	})

export const getOneServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { id: string; meta?: MetaOptions; resource: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { id, meta, resource } = data

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await supabase
			.from(resource)
			.select(selectQuery)
			.eq('id', id)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const createServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { meta?: MetaOptions; resource: string; variables: unknown }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { meta, resource, variables } = data

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await supabase
			.from(resource)
			.insert(variables as Record<string, unknown>)
			.select(selectQuery)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const updateServer = createServerFn({ method: 'POST' })
	.inputValidator(
		(data: { id: string; meta?: MetaOptions; resource: string; variables: unknown }) => data
	)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { id, meta, resource, variables } = data

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await supabase
			.from(resource)
			.update(variables as Record<string, unknown>)
			.eq('id', id)
			.select(selectQuery)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const deleteOneServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { id: string; resource: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerClient()
		const { id, resource } = data

		const { data: record, error } = await supabase
			.from(resource)
			.delete()
			.eq('id', id)
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})
