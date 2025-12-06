import type { CrudFilters, CrudSorting, Pagination } from '@refinedev/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerClient } from '@/libs/supabase/server'

// ============================================
// Types
// ============================================

type AnyClient = ReturnType<SupabaseClient<any, any, any>['schema']> | SupabaseClient<any, any, any>

type CreateInput = {
	meta?: MetaOptions
	resource: string
	variables: unknown
}

type CreateManyInput = {
	meta?: MetaOptions
	resource: string
	variables: Array<unknown>
}

type DeleteInput = {
	id: string
	meta?: MetaOptions
	resource: string
}

type DeleteManyInput = {
	ids: Array<string>
	meta?: MetaOptions
	resource: string
}

type GetListInput = {
	filters?: CrudFilters
	meta?: MetaOptions
	pagination?: Pagination
	resource: string
	sorters?: CrudSorting
}

type GetManyInput = {
	ids: Array<string>
	meta?: MetaOptions
	resource: string
}

type GetOneInput = {
	id: string
	meta?: MetaOptions
	resource: string
}

type MetaOptions = {
	count?: 'estimated' | 'exact' | 'planned'
	idColumnName?: string
	schema?: string
	select?: string
}

type UpdateInput = {
	id: string
	meta?: MetaOptions
	resource: string
	variables: unknown
}

// ============================================
// Helpers
// ============================================

type UpdateManyInput = {
	ids: Array<string>
	meta?: MetaOptions
	resource: string
	variables: unknown
}

/**
 * Gets the Supabase client, optionally with a different schema
 * Returns an untyped client to allow dynamic resource names
 */
function getClient(schema?: string): AnyClient {
	const supabase = getSupabaseServerClient() as SupabaseClient<any, any, any>
	return schema ? supabase.schema(schema) : supabase
}

/**
 * Gets the ID column name from meta or defaults to 'id'
 */
function getIdColumn(meta?: MetaOptions): string {
	return meta?.idColumnName || 'id'
}

// ============================================
// Server Functions
// ============================================

export const getListServer = createServerFn({ method: 'POST' })
	.inputValidator((data: GetListInput) => data)
	.handler(async ({ data }) => {
		const { filters, meta, pagination, resource, sorters } = data
		const client = getClient(meta?.schema)

		const selectQuery = meta?.select || '*'
		const countOption = meta?.count || 'exact'
		let query = client.from(resource).select(selectQuery, { count: countOption })

		// Apply pagination (Refine uses 'current' and 'pageSize')
		if (pagination) {
			const {
				currentPage = 1,
				mode = 'server',
				pageSize = 10
			} = pagination as {
				currentPage?: number
				mode?: 'client' | 'off' | 'server'
				pageSize?: number
			}
			if (mode === 'server') {
				const start = (currentPage - 1) * pageSize
				const end = start + pageSize - 1
				query = query.range(start, end)
			}
		}

		// Apply filters
		if (filters) {
			for (const filter of filters) {
				if ('field' in filter && filter.field) {
					const { field, operator, value } = filter

					// Check for relationship filter pattern: table.field or table_field
					// For many-to-many, field might be like "prompt_tags.tag_id" or just "tag_id"
					// which needs to filter through a join table
					const isRelationFilter = field.includes('.')
					const filterField = field

					// For relationship filters, we need to ensure the join is included
					// This requires modifying the select to include the related table with !inner
					if (isRelationFilter) {
						const [relatedTable] = field.split('.')
						// Ensure we have an inner join for filtering
						const currentSelect = selectQuery
						if (!currentSelect.includes(`${relatedTable}!inner`)) {
							query = client
								.from(resource)
								.select(
									currentSelect === '*'
										? `*, ${relatedTable}!inner(*)`
										: `${currentSelect}, ${relatedTable}!inner(*)`,
									{ count: countOption }
								)
						}
					}

					switch (operator) {
						case 'contains':
							query = query.ilike(filterField, `%${value}%`)
							break
						case 'eq':
							query = query.eq(filterField, value)
							break
						case 'gt':
							query = query.gt(filterField, value)
							break
						case 'gte':
							query = query.gte(filterField, value)
							break
						case 'in':
							query = query.in(filterField, value as Array<unknown>)
							break
						case 'lt':
							query = query.lt(filterField, value)
							break
						case 'lte':
							query = query.lte(filterField, value)
							break
						case 'ne':
							query = query.neq(filterField, value)
							break
						case 'null':
							query = value ? query.is(filterField, null) : query.not(filterField, 'is', null)
							break
					}
				}
			}
		}

		// Apply sorting with foreign table support
		if (sorters && sorters.length > 0) {
			for (const sorter of sorters) {
				// Check for foreign table pattern: foreignTable.field
				const [foreignTable, field] = sorter.field.split(/\.(?=[^.]+$)/)

				if (foreignTable && field) {
					// Foreign table sorting
					query = query.select(meta?.select || `*, ${foreignTable}(${field})`).order(field, {
						ascending: sorter.order === 'asc',
						referencedTable: foreignTable
					})
				} else {
					query = query.order(sorter.field, { ascending: sorter.order === 'asc' })
				}
			}
		}

		const { count, data: records, error } = await query

		if (error) {
			throw new Error(error.message)
		}

		return { data: records || [], total: count || 0 }
	})

export const getOneServer = createServerFn({ method: 'POST' })
	.inputValidator((data: GetOneInput) => data)
	.handler(async ({ data }) => {
		const { id, meta, resource } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await client
			.from(resource)
			.select(selectQuery)
			.eq(idColumn, id)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const getManyServer = createServerFn({ method: 'POST' })
	.inputValidator((data: GetManyInput) => data)
	.handler(async ({ data }) => {
		const { ids, meta, resource } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)

		const selectQuery = meta?.select || '*'
		const { data: records, error } = await client
			.from(resource)
			.select(selectQuery)
			.in(idColumn, ids)

		if (error) {
			throw new Error(error.message)
		}

		return { data: records || [] }
	})

export const createServer = createServerFn({ method: 'POST' })
	.inputValidator((data: CreateInput) => data)
	.handler(async ({ data }) => {
		const { meta, resource, variables } = data
		const client = getClient(meta?.schema)

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await client
			.from(resource)
			.insert(variables)
			.select(selectQuery)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const createManyServer = createServerFn({ method: 'POST' })
	.inputValidator((data: CreateManyInput) => data)
	.handler(async ({ data }) => {
		const { meta, resource, variables } = data
		const client = getClient(meta?.schema)

		const selectQuery = meta?.select || '*'
		const { data: records, error } = await client
			.from(resource)
			.insert(variables)
			.select(selectQuery)

		if (error) {
			throw new Error(error.message)
		}

		return { data: records || [] }
	})

export const updateServer = createServerFn({ method: 'POST' })
	.inputValidator((data: UpdateInput) => data)
	.handler(async ({ data }) => {
		const { id, meta, resource, variables } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)

		const selectQuery = meta?.select || '*'
		const { data: record, error } = await client
			.from(resource)
			.update(variables)
			.eq(idColumn, id)
			.select(selectQuery)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const updateManyServer = createServerFn({ method: 'POST' })
	.inputValidator((data: UpdateManyInput) => data)
	.handler(async ({ data }) => {
		const { ids, meta, resource, variables } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)
		const selectQuery = meta?.select || '*'

		// Update each record individually to get proper return data
		const results = await Promise.all(
			ids.map(async (id) => {
				const { data: record, error } = await client
					.from(resource)
					.update(variables)
					.eq(idColumn, id)
					.select(selectQuery)
					.single()

				if (error) {
					throw new Error(error.message)
				}

				return record
			})
		)

		return { data: results }
	})

export const deleteOneServer = createServerFn({ method: 'POST' })
	.inputValidator((data: DeleteInput) => data)
	.handler(async ({ data }) => {
		const { id, meta, resource } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)

		const { data: record, error } = await client
			.from(resource)
			.delete()
			.eq(idColumn, id)
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})

export const deleteManyServer = createServerFn({ method: 'POST' })
	.inputValidator((data: DeleteManyInput) => data)
	.handler(async ({ data }) => {
		const { ids, meta, resource } = data
		const client = getClient(meta?.schema)
		const idColumn = getIdColumn(meta)

		// Delete each record individually to get proper return data
		const results = await Promise.all(
			ids.map(async (id) => {
				const { data: record, error } = await client
					.from(resource)
					.delete()
					.eq(idColumn, id)
					.select()
					.single()

				if (error) {
					throw new Error(error.message)
				}

				return record
			})
		)

		return { data: results }
	})

// ============================================
// Utility Server Functions
// ============================================

type CheckSlugInput = {
	baseSlug: string
	columnName: string
	resource: string
	schema?: string
}

type CountInput = {
	resource: string
	schema?: string
}

type DeleteJunctionInput = {
	column: string
	junctionTable: string
	schema?: string
	value: string
}

type FindAvailableSlugInput = {
	baseSlug: string
	columnName: string
	currentId?: string
	resource: string
	schema?: string
}

type GetRelatedInput = {
	/** The foreign key column pointing to the main resource (e.g., 'prompt_id') */
	fkColumn: string
	/** The value of the foreign key */
	fkValue: string
	/** The junction table to query (e.g., 'prompt_tags') */
	junctionTable: string
	schema?: string
	/** The select query for related data (e.g., 'tags(*)' or 'tag_id') */
	select: string
}

type JunctionTableInput = {
	junctionTable: string
	records: Array<Record<string, unknown>>
	schema?: string
}

export const checkSlugServer = createServerFn({ method: 'POST' })
	.inputValidator((data: CheckSlugInput) => data)
	.handler(async ({ data }) => {
		const { baseSlug, columnName, resource, schema } = data
		const client = getClient(schema)

		const { data: existing } = await client
			.from(resource)
			.select(columnName)
			.like(columnName, `${baseSlug}%`)

		return { data: existing || [] }
	})

export const findAvailableSlugServer = createServerFn({ method: 'POST' })
	.inputValidator((data: FindAvailableSlugInput) => data)
	.handler(async ({ data }) => {
		const { baseSlug, columnName, currentId, resource, schema } = data
		const client = getClient(schema)

		if (!baseSlug) {
			return { slug: baseSlug }
		}

		// First check if the base slug is available
		let query = client
			.from(resource)
			.select('id', { count: 'exact', head: true })
			.eq(columnName, baseSlug)

		if (currentId) {
			query = query.neq('id', currentId)
		}

		const { count } = await query

		if (count === 0) {
			return { slug: baseSlug } // Available as-is
		}

		// Slug is taken, find an available one with suffix
		const { data: existing } = await client
			.from(resource)
			.select(columnName)
			.like(columnName, `${baseSlug}%`)

		const existingSlugs = new Set(
			(existing as Array<Record<string, unknown>> | null)?.map((row) => row[columnName]) || []
		)

		let counter = 1
		let candidate = `${baseSlug}-${counter}`

		while (existingSlugs.has(candidate)) {
			counter++
			candidate = `${baseSlug}-${counter}`
		}

		return { slug: candidate }
	})

export const insertJunctionServer = createServerFn({ method: 'POST' })
	.inputValidator((data: JunctionTableInput) => data)
	.handler(async ({ data }) => {
		const { junctionTable, records, schema } = data
		const client = getClient(schema)

		if (records.length === 0) {
			return { success: true }
		}

		const { error } = await client.from(junctionTable).insert(records)

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const deleteJunctionServer = createServerFn({ method: 'POST' })
	.inputValidator((data: DeleteJunctionInput) => data)
	.handler(async ({ data }) => {
		const { column, junctionTable, schema, value } = data
		const client = getClient(schema)

		const { error } = await client.from(junctionTable).delete().eq(column, value)

		if (error) {
			throw new Error(error.message)
		}

		return { success: true }
	})

export const countServer = createServerFn({ method: 'POST' })
	.inputValidator((data: CountInput) => data)
	.handler(async ({ data }) => {
		const { resource, schema } = data
		const client = getClient(schema)

		const { count, error } = await client.from(resource).select('*', { count: 'exact', head: true })

		if (error) {
			throw new Error(error.message)
		}

		return { count: count || 0 }
	})

export const getRelatedServer = createServerFn({ method: 'POST' })
	.inputValidator((data: GetRelatedInput) => data)
	.handler(async ({ data }) => {
		const { fkColumn, fkValue, junctionTable, schema, select } = data
		const client = getClient(schema)

		const { data: records, error } = await client
			.from(junctionTable)
			.select(select)
			.eq(fkColumn, fkValue)

		if (error) {
			throw new Error(error.message)
		}

		return { data: records || [] }
	})

type ExportDataInput = {
	orderBy?: string
	resource: string
	schema?: string
	select?: string
}

export const exportDataServer = createServerFn({ method: 'POST' })
	.inputValidator((data: ExportDataInput) => data)
	.handler(async ({ data }) => {
		const { orderBy = 'created_at', resource, schema, select = '*' } = data
		const client = getClient(schema)

		const PAGE_SIZE = 1000
		let allData: Array<Record<string, any>> = []
		let page = 0
		let hasMore = true

		// First, get total count
		const { count } = await client.from(resource).select('*', { count: 'exact', head: true })
		const totalCount = count || 0

		while (hasMore) {
			const from = page * PAGE_SIZE
			const to = from + PAGE_SIZE - 1

			const { data: pageData, error } = await client
				.from(resource)
				.select(select)
				.range(from, to)
				.order(orderBy, { ascending: false })

			if (error) {
				throw new Error(error.message)
			}

			if (pageData && pageData.length > 0) {
				allData = [...allData, ...pageData]
			}

			hasMore = pageData !== null && pageData.length === PAGE_SIZE
			page++
		}

		return { data: allData, total: totalCount }
	})

type ValidateIdsInput = {
	ids: Array<string>
	resource: string
	schema?: string
}

export const validateIdsServer = createServerFn({ method: 'POST' })
	.inputValidator((data: ValidateIdsInput) => data)
	.handler(async ({ data }) => {
		const { ids, resource, schema } = data
		const client = getClient(schema)

		const { data: records, error } = await client.from(resource).select('id').in('id', ids)

		if (error) {
			throw new Error(error.message)
		}

		const existingIds = new Set(records?.map((r: { id: string }) => r.id) || [])
		const missingIds = ids.filter((id) => !existingIds.has(id))

		return { existingIds: Array.from(existingIds), missingIds }
	})

type UpsertInput = {
	resource: string
	schema?: string
	variables: unknown
}

export const upsertServer = createServerFn({ method: 'POST' })
	.inputValidator((data: UpsertInput) => data)
	.handler(async ({ data }) => {
		const { resource, schema, variables } = data
		const client = getClient(schema)

		const { data: record, error } = await client
			.from(resource)
			.upsert(variables)
			.select('id')
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return { data: record }
	})
