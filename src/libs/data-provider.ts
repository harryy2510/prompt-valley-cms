import type { BaseRecord, CrudFilter, DataProvider } from '@refinedev/core'

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

type MetaOptions = {
	count?: 'estimated' | 'exact' | 'planned'
	idColumnName?: string
	schema?: string
	select?: string
}

// Custom data provider that uses server functions for all operations
export const dataProvider: DataProvider = {
	create: async ({ meta, resource, variables }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await createServer({
			data: {
				meta: metaOptions,
				resource,
				variables
			}
		})

		return result as { data: BaseRecord }
	},

	createMany: async ({ meta, resource, variables }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await createManyServer({
			data: {
				meta: metaOptions,
				resource,
				variables
			}
		})

		return result as { data: Array<BaseRecord> }
	},

	deleteMany: async ({ ids, meta, resource }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await deleteManyServer({
			data: {
				ids: ids.map(String),
				meta: metaOptions,
				resource
			}
		})

		return result as { data: Array<BaseRecord> }
	},

	deleteOne: async ({ id, meta, resource }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await deleteOneServer({
			data: {
				id: String(id),
				meta: metaOptions,
				resource
			}
		})

		return result as { data: BaseRecord }
	},

	getApiUrl: () => {
		return import.meta.env.VITE_SUPABASE_URL || ''
	},

	getList: async ({ filters = [], meta, pagination, resource, sorters }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		// Handle special junction table filters for prompts
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
					const tagPrompts = result.data as Array<{ prompt_id: string }>

					if (tagPrompts) {
						promptIds = tagPrompts.map((tp) => tp.prompt_id)
					}
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
					const modelPrompts = result.data as Array<{ prompt_id: string }>

					if (modelPrompts) {
						const modelPromptIds = modelPrompts.map((mp) => mp.prompt_id)
						if (promptIds !== null) {
							promptIds = promptIds.filter((id) => modelPromptIds.includes(id))
						} else {
							promptIds = modelPromptIds
						}
					}
				}

				// Remove the junction filters and add an ID filter instead
				const remainingFilters = filters.filter(
					(f) => !('field' in f) || (f.field !== 'tag_id' && f.field !== 'model_id')
				)

				// If no prompt IDs found, return empty result
				if (promptIds !== null && promptIds.length === 0) {
					return {
						data: [],
						total: 0
					}
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
					data: {
						filters: newFilters,
						meta: metaOptions,
						pagination,
						resource,
						sorters
					}
				})

				return result as { data: Array<BaseRecord>; total: number }
			}
		}

		const result = await getListServer({
			data: {
				filters,
				meta: metaOptions,
				pagination,
				resource,
				sorters
			}
		})

		return result as { data: Array<BaseRecord>; total: number }
	},

	getMany: async ({ ids, meta, resource }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await getManyServer({
			data: {
				ids: ids.map(String),
				meta: metaOptions,
				resource
			}
		})

		return result as { data: Array<BaseRecord> }
	},

	getOne: async ({ id, meta, resource }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await getOneServer({
			data: {
				id: String(id),
				meta: metaOptions,
				resource
			}
		})

		return result as { data: BaseRecord }
	},

	update: async ({ id, meta, resource, variables }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await updateServer({
			data: {
				id: String(id),
				meta: metaOptions,
				resource,
				variables
			}
		})

		return result as { data: BaseRecord }
	},

	updateMany: async ({ ids, meta, resource, variables }) => {
		const metaOptions: MetaOptions | undefined = meta
			? {
					count: meta.count,
					idColumnName: meta.idColumnName,
					schema: meta.schema,
					select: meta.select
				}
			: undefined

		const result = await updateManyServer({
			data: {
				ids: ids.map(String),
				meta: metaOptions,
				resource,
				variables
			}
		})

		return result as { data: Array<BaseRecord> }
	}
}
