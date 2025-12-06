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

/**
 * Strips non-serializable properties (signal, etc.) from meta
 * Only keeps properties that are JSON-serializable and used by the server
 */
function sanitizeMeta(meta?: MetaQuery) {
	if (!meta) return undefined
	// Only pick serializable properties used by the data provider
	const { count, idColumnName, schema, select } = meta
	return { count, idColumnName, schema, select }
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
		// Handle junction table filters for prompts (many-to-many relationships)
		if (resource === 'prompts') {
			const tagFilter = filters.find((f) => 'field' in f && f.field === 'tag_id')
			const modelFilter = filters.find((f) => 'field' in f && f.field === 'model_id')

			if (tagFilter || modelFilter) {
				let promptIds: Array<string> | null = null

				if (tagFilter && 'value' in tagFilter) {
					const result = await getRelatedServer({
						data: {
							fkColumn: 'tag_id',
							fkValue: tagFilter.value as string,
							junctionTable: 'prompt_tags',
							select: 'prompt_id'
						}
					})
					const tagPrompts = (result.data ?? []) as Array<{ prompt_id: string }>
					promptIds = tagPrompts.map((tp) => tp.prompt_id)
				}

				if (modelFilter && 'value' in modelFilter) {
					const result = await getRelatedServer({
						data: {
							fkColumn: 'model_id',
							fkValue: modelFilter.value as string,
							junctionTable: 'prompt_models',
							select: 'prompt_id'
						}
					})
					const modelPrompts = (result.data ?? []) as Array<{ prompt_id: string }>
					const modelPromptIds = modelPrompts.map((mp) => mp.prompt_id)

					if (promptIds !== null) {
						promptIds = promptIds.filter((id) => modelPromptIds.includes(id))
					} else {
						promptIds = modelPromptIds
					}
				}

				// Remove junction filters and add ID filter
				const remainingFilters = filters.filter(
					(f) => !('field' in f) || (f.field !== 'tag_id' && f.field !== 'model_id')
				)

				// If no prompt IDs found, return empty result
				if (promptIds !== null && promptIds.length === 0) {
					return { data: [] as Array<TData>, total: 0 }
				}

				// Add the prompt ID filter if we have results
				const newFilters: Array<CrudFilter> = [...remainingFilters]
				if (promptIds !== null) {
					newFilters.push({
						field: 'id',
						operator: 'in',
						value: promptIds
					})
				}

				const result = await getListServer({
					data: { filters: newFilters, meta: sanitizeMeta(meta), pagination, resource, sorters }
				})
				return result as unknown as { data: Array<TData>; total: number }
			}
		}

		const result = await getListServer({
			data: { filters, meta: sanitizeMeta(meta), pagination, resource, sorters }
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
