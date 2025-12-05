import type {
	BaseRecord,
	CreateParams,
	DataProvider,
	DeleteOneParams,
	GetListParams,
	GetOneParams,
	UpdateParams
} from '@refinedev/core'

import {
	createServer,
	deleteOneServer,
	getListServer,
	getOneServer,
	updateServer
} from '@/actions/crud'

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
			data: { meta, resource, variables }
		})
		return result as { data: TData }
	},

	deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		id,
		resource
	}: DeleteOneParams<TVariables>) => {
		const result = await deleteOneServer({
			data: { id: String(id), resource }
		})
		return result as { data: TData }
	},

	getApiUrl: () => process.env.VITE_SUPABASE_URL || '',

	getList: async <TData extends BaseRecord = BaseRecord>({
		filters,
		meta,
		pagination,
		resource,
		sorters
	}: GetListParams) => {
		// Strip signal and other non-serializable properties before sending to server
		const result = await getListServer({
			data: { filters, meta, pagination, resource, sorters }
		})
		return result as { data: Array<TData>; total: number }
	},

	getOne: async <TData extends BaseRecord = BaseRecord>({ id, meta, resource }: GetOneParams) => {
		const result = await getOneServer({
			data: { id: String(id), meta, resource }
		})
		return result as { data: TData }
	},

	update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
		id,
		meta,
		resource,
		variables
	}: UpdateParams<TVariables>) => {
		const result = await updateServer({
			data: { id: String(id), meta, resource, variables }
		})
		return result as { data: TData }
	}
}
