import type {
	BaseRecord,
	CreateManyParams,
	CreateParams,
	CrudFilter,
	DataProvider,
	DeleteManyParams,
	DeleteOneParams,
	GetListParams,
	GetManyParams,
	GetOneParams,
	MetaQuery,
	UpdateManyParams,
	UpdateParams
} from '@refinedev/core'

import {
	createManyServer,
	createServer,
	deleteManyServer,
	deleteOneServer,
	getListServer,
	getManyServer,
	getOneServer,
	getRelatedServer,
	updateManyServer,
	updateServer
} from '@/actions/crud'

export type RelationConfig = {
	foreignKey: string
	relatedKey: string
	through: string
	type: 'manyToMany'
}

export type SanitizedMeta = {
	count?: 'estimated' | 'exact' | 'planned'
	idColumnName?: string
	relations?: Record<string, RelationConfig>
	schema?: string
	select?: string
}

/**
 * Strips non-serializable properties (signal, etc.) from meta
 * Only keeps properties that are JSON-serializable and used by the server
 */
function sanitizeMeta(meta?: MetaQuery): SanitizedMeta | undefined {
	if (!meta) return undefined
	// Only pick serializable properties used by the data provider
	const { count, idColumnName, relations, schema, select } = meta as MetaQuery & {
		relations?: Record<string, RelationConfig>
	}
	return { count, idColumnName, relations, schema, select }
}

/**
 * Refine Data Provider that delegates ALL operations to server functions
 * No client-side Supabase client needed for data operations
 */
export const serverDataProvider: DataProvider = {
	create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		meta,
		resource,
		variables
	}: CreateParams<TVariables>) => {
		const result = await createServer({
			data: { meta: sanitizeMeta(meta), resource, variables }
		})
		return result as unknown as { data: TData }
	},

	createMany: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		meta,
		resource,
		variables
	}: CreateManyParams<TVariables>) => {
		const result = await createManyServer({
			data: { meta: sanitizeMeta(meta), resource, variables }
		})
		return result as unknown as { data: Array<TData> }
	},

	deleteMany: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		ids,
		meta,
		resource
	}: DeleteManyParams<TVariables>) => {
		const result = await deleteManyServer({
			data: { ids: ids.map(String), meta: sanitizeMeta(meta), resource }
		})
		return result as unknown as { data: Array<TData> }
	},

	deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		id,
		meta,
		resource
	}: DeleteOneParams<TVariables>) => {
		const result = await deleteOneServer({
			data: { id: String(id), meta: sanitizeMeta(meta), resource }
		})
		return result as unknown as { data: TData }
	},

	getApiUrl: () => process.env.VITE_SUPABASE_URL || '',

	getList: async <TData extends BaseRecord = BaseRecord>({
		filters = [],
		meta,
		pagination,
		resource,
		sorters
	}: GetListParams) => {
		const sanitizedMeta = sanitizeMeta(meta)
		const relations = sanitizedMeta?.relations

		// Handle manyToMany junction table filters if relations are defined
		if (relations) {
			const junctionFilters: Array<{
				field: string
				relation: RelationConfig
				value: string
			}> = []

			// Find filters that match manyToMany relations by relatedKey
			for (const [, relation] of Object.entries(relations)) {
				if (relation.type === 'manyToMany') {
					const filter = filters.find((f) => 'field' in f && f.field === relation.relatedKey)
					if (filter && 'value' in filter) {
						junctionFilters.push({
							field: relation.relatedKey,
							relation,
							value: filter.value as string
						})
					}
				}
			}

			if (junctionFilters.length > 0) {
				let matchingIds: Array<string> | null = null

				// Query each junction table and intersect results
				for (const { relation, value } of junctionFilters) {
					const result = await getRelatedServer({
						data: {
							fkColumn: relation.relatedKey,
							fkValue: value,
							junctionTable: relation.through,
							select: relation.foreignKey
						}
					})
					const ids = ((result.data ?? []) as unknown as Array<Record<string, string>>).map(
						(row) => row[relation.foreignKey]
					)

					if (matchingIds === null) {
						matchingIds = ids
					} else {
						matchingIds = matchingIds.filter((id) => ids.includes(id))
					}
				}

				// Remove junction filters from the filter list
				const junctionFields = junctionFilters.map((jf) => jf.field)
				const remainingFilters = filters.filter(
					(f) => !('field' in f) || !junctionFields.includes(f.field)
				)

				// If no matching IDs found, return empty result
				if (matchingIds !== null && matchingIds.length === 0) {
					return { data: [] as Array<TData>, total: 0 }
				}

				// Add the ID filter if we have results
				const newFilters: Array<CrudFilter> = [...remainingFilters]
				if (matchingIds !== null) {
					newFilters.push({
						field: 'id',
						operator: 'in',
						value: matchingIds
					})
				}

				const result = await getListServer({
					data: { filters: newFilters, meta: sanitizedMeta, pagination, resource, sorters }
				})
				return result as unknown as { data: Array<TData>; total: number }
			}
		}

		const result = await getListServer({
			data: { filters, meta: sanitizedMeta, pagination, resource, sorters }
		})
		return result as unknown as { data: Array<TData>; total: number }
	},

	getMany: async <TData extends BaseRecord = BaseRecord>({
		ids,
		meta,
		resource
	}: GetManyParams) => {
		const result = await getManyServer({
			data: { ids: ids.map(String), meta: sanitizeMeta(meta), resource }
		})
		return result as unknown as { data: Array<TData> }
	},

	getOne: async <TData extends BaseRecord = BaseRecord>({ id, meta, resource }: GetOneParams) => {
		const result = await getOneServer({
			data: { id: String(id), meta: sanitizeMeta(meta), resource }
		})
		return result as unknown as { data: TData }
	},

	update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		id,
		meta,
		resource,
		variables
	}: UpdateParams<TVariables>) => {
		const result = await updateServer({
			data: { id: String(id), meta: sanitizeMeta(meta), resource, variables }
		})
		return result as unknown as { data: TData }
	},

	updateMany: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		ids,
		meta,
		resource,
		variables
	}: UpdateManyParams<TVariables>) => {
		const result = await updateManyServer({
			data: { ids: ids.map(String), meta: sanitizeMeta(meta), resource, variables }
		})
		return result as unknown as { data: Array<TData> }
	}
}
