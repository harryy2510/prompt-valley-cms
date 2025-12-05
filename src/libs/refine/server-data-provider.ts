import type {
  DataProvider,
  BaseRecord,
  GetListParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteOneParams,
} from '@refinedev/core'

import {
  getListServer,
  getOneServer,
  createServer,
  updateServer,
  deleteOneServer,
} from '@/actions/crud'

/**
 * Refine Data Provider that delegates ALL operations to server functions
 * No client-side Supabase client needed for data operations
 */
export const serverDataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
    sorters,
    meta,
  }: GetListParams) => {
    const result = await getListServer({
      data: { resource, pagination, filters, sorters, meta },
    })
    return result as { data: TData[]; total: number }
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
    meta,
  }: GetOneParams) => {
    const result = await getOneServer({
      data: { resource, id: String(id), meta },
    })
    return result as { data: TData }
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    resource,
    variables,
    meta,
  }: CreateParams<TVariables>) => {
    const result = await createServer({
      data: { resource, variables, meta },
    })
    return result as { data: TData }
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    resource,
    id,
    variables,
    meta,
  }: UpdateParams<TVariables>) => {
    const result = await updateServer({
      data: { resource, id: String(id), variables, meta },
    })
    return result as { data: TData }
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
    resource,
    id,
  }: DeleteOneParams<TVariables>) => {
    const result = await deleteOneServer({
      data: { resource, id: String(id) },
    })
    return result as { data: TData }
  },

  getApiUrl: () => process.env.VITE_SUPABASE_URL || '',
}
