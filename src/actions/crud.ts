import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerClient } from '@/libs/supabase/server'
import type { CrudFilters, CrudSorting, Pagination } from '@refinedev/core'

// ============================================
// Types
// ============================================

interface MetaOptions {
  select?: string
  [key: string]: unknown
}

interface GetListInput {
  resource: string
  pagination?: Pagination
  filters?: CrudFilters
  sorters?: CrudSorting
  meta?: MetaOptions
}

// ============================================
// Server Functions
// ============================================

export const getListServer = createServerFn({ method: 'POST' })
  .inputValidator((data: GetListInput) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, pagination, filters, sorters, meta } = data

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
            case 'eq':
              query = query.eq(field, value)
              break
            case 'ne':
              query = query.neq(field, value)
              break
            case 'contains':
              query = query.ilike(field, `%${value}%`)
              break
            case 'in':
              query = query.in(field, value as unknown[])
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

    const { data: records, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data: records || [], total: count || 0 }
  })

export const getOneServer = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string; id: string; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id, meta } = data

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
  .inputValidator((data: { resource: string; variables: unknown; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, variables, meta } = data

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
  .inputValidator((data: { resource: string; id: string; variables: unknown; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id, variables, meta } = data

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
  .inputValidator((data: { resource: string; id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id } = data

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
