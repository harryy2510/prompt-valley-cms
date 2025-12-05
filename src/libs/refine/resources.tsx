import type { ResourceProps } from '@refinedev/core'
import { Bot, Database, FileText, FolderOpen, FolderTree, Package, Tags } from 'lucide-react'

export const resources: Array<ResourceProps> = [
	{
		meta: {
			icon: <Database />,
			label: 'Content'
		},
		name: 'content'
	},
	{
		create: '/prompts/create',
		edit: '/prompts/edit/:id',
		list: '/prompts',
		meta: {
			icon: <FileText />,
			label: 'Prompts',

			parent: 'content'
		},
		name: 'prompts',
		show: '/prompts/show/:id'
	},
	{
		create: '/categories/create',
		edit: '/categories/edit/:id',
		list: '/categories',
		meta: {
			icon: <FolderTree />,
			label: 'Categories',
			parent: 'content'
		},
		name: 'categories'
	},
	{
		create: '/tags/create',
		edit: '/tags/edit/:id',
		list: '/tags',
		meta: {
			icon: <Tags />,
			label: 'Tags',
			parent: 'content'
		},
		name: 'tags'
	},
	{
		create: '/ai-providers/create',
		edit: '/ai-providers/edit/:id',
		list: '/ai-providers',
		meta: {
			icon: <Bot />,
			label: 'AI Providers',
			parent: 'content'
		},
		name: 'ai_providers'
	},
	{
		create: '/ai-models/create',
		edit: '/ai-models/edit/:id',
		list: '/ai-models',
		meta: {
			icon: <Package />,
			label: 'AI Models',
			parent: 'content'
		},
		name: 'ai_models'
	},
	{
		list: '/media-library',
		meta: {
			icon: <FolderOpen />,
			label: 'Media Library'
		},
		name: 'media-library'
	}
]
