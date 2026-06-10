import { ref } from 'vue'

export interface ViewedProduct {
  id: number
  category: string
  name: string
  src: string
  price: number
}

const STORAGE_KEY = 'exaucee_recently_viewed'
const MAX_ITEMS = 6

function getStored(): ViewedProduct[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

// Module-level reactive state shared across all consumers
const recentProducts = ref<ViewedProduct[]>(getStored())

export function useRecentlyViewed() {
  function track(product: ViewedProduct) {
    const current = getStored().filter(
      p => !(p.category === product.category && p.id === product.id)
    )
    const next = [product, ...current].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    recentProducts.value = next
  }

  return { recentProducts, track }
}
