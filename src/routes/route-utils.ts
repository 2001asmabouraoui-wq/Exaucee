import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useSeoMeta } from '@unhead/vue'
import { getProduct } from '../data/product-utils.ts'
import { meta } from '../data/meta-types'
import { getCategoryPageMeta, getProductPageMeta } from '../data/meta-utils'
import { useProductStore } from '../pinia/productStore'

function parseRouteId(id: string | string[]): number {
	if (Array.isArray(id)) return parseInt(id[0])
	return parseInt(id)
}

export function handleRouteMeta(metaFunc: () => meta): void {
	const metaData = metaFunc()
	useSeoMeta({
		title: metaData.title,
		description: metaData.description,
		ogTitle: metaData.title,
		ogDescription: metaData.description,
		ogImage: metaData.image,
	})
}

export function categoryRoute(category: string) {
	return {
		path: `/${category}`,
		component: () => import('../pages/Category/category-page.vue'),
		props: { category: category },
		beforeEnter: () => {
			const meta = getCategoryPageMeta(category)
			useSeoMeta({
				title: meta.title,
				description: meta.description,
				ogTitle: meta.title,
				ogDescription: meta.description,
				ogImage: meta.image,
			})
		},
	}
}

export function productRoute(category: string) {
	return {
		path: `/${category}/:id`,
		name: category,
		component: () => import('../pages/Product/product-page.vue'),
		// eslint-disable-next-line
		props: (route: any) => ({
			category: category,
			productId: parseInt(route.params.id),
		}),
		beforeEnter: (
			to: RouteLocationNormalized,
			_: RouteLocationNormalized,
			next: NavigationGuardNext,
		) => {
			try {
				const id = parseRouteId(to.params.id)
				const store = useProductStore()

				// Primary: check the live store
				const storeProduct = store.getProduct(category, id)
				if (storeProduct) {
					try {
						const meta = getProductPageMeta(storeProduct)
						useSeoMeta({
							title: meta.title,
							description: meta.description,
							ogTitle: meta.title,
							ogDescription: meta.description,
							ogImage: meta.image,
						})
					} catch { /* seo is non-critical */ }
					next()
					return
				}

				// Fallback: check static data
				const staticProduct = getProduct(category, id)
				if (staticProduct) {
					try {
						const meta = getProductPageMeta(staticProduct)
						useSeoMeta({
							title: meta.title,
							description: meta.description,
							ogTitle: meta.title,
							ogDescription: meta.description,
							ogImage: meta.image,
						})
					} catch { /* seo is non-critical */ }
					next()
					return
				}

				// Store not loaded yet — let the product page render
				if (!store.loaded) {
					next()
					return
				}

				// Store loaded and product genuinely doesn't exist
				next('/404')
			} catch {
				// Guard threw unexpectedly — allow navigation rather than silently blocking
				next()
			}
		},
	}
}
