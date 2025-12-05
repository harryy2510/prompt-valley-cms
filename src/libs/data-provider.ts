import type { CrudFilter, DataProvider } from '@refinedev/core'
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase'

import { supabase } from './supabase'

const baseDataProvider = supabaseDataProvider(supabase)

// Custom data provider that handles junction table filtering for prompts
export const dataProvider: DataProvider = {
	...baseDataProvider,
	getList: async (params) => {
		const { filters = [], resource, ...rest } = params

		// Handle special junction table filters for prompts
		if (resource === 'prompts') {
			const tagFilter = filters.find((f) => 'field' in f && f.field === 'tag_id')
			const modelFilter = filters.find((f) => 'field' in f && f.field === 'model_id')

			// If filtering by tag or model, we need to get prompt IDs from junction tables first
			if (tagFilter || modelFilter) {
				let promptIds: Array<string> | null = null

				if (tagFilter && 'value' in tagFilter) {
					const { data: tagPrompts } = await supabase
						.from('prompt_tags')
						.select('prompt_id')
						.eq('tag_id', tagFilter.value as string)

					if (tagPrompts) {
						promptIds = tagPrompts.map((tp) => tp.prompt_id)
					}
				}

				if (modelFilter && 'value' in modelFilter) {
					const { data: modelPrompts } = await supabase
						.from('prompt_models')
						.select('prompt_id')
						.eq('model_id', modelFilter.value as string)

					if (modelPrompts) {
						const modelPromptIds = modelPrompts.map((mp) => mp.prompt_id)
						// If we already have tag filter results, intersect them
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

				return baseDataProvider.getList({
					filters: newFilters,
					resource,
					...rest
				})
			}
		}

		// For all other cases, use the base data provider
		return baseDataProvider.getList(params)
	}
}
