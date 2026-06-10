import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { product, catalog } from '../data/product-types'
import { products as staticProducts } from '../data/products'

export interface DBProduct {
  id: string
  created_at: string
  name: string
  subheader: string
  category: string
  price: number
  final_price: number | null
  description: string
  features: string
  src: string
  nu: boolean
  in_stock: boolean
  featured: boolean
  sort_order: number
  quantity: number | null
  shades: { name: string; hex: string }[]
  sale_start: string | null
  sale_end: string | null
  alt_src: string | null
  packaging: 'included' | 'optional' | null
}

function toProduct(row: DBProduct, index: number): product {
  return {
    id: index,
    category: row.category,
    src: row.src,
    altImage: row.alt_src ?? row.src,
    topSrc: row.src,
    botSrc: row.src,
    rightSrc: row.src,
    nu: row.nu,
    header: row.name,
    subheader: row.subheader,
    text: row.description,
    features: row.features,
    inthebox: [],
    price: row.price,
    options: [],
    selectedOptions: {},
    finalPrice: row.final_price ?? undefined,
    in_stock: row.in_stock,
    featured: row.featured,
    shades: row.shades ?? [],
    packaging: row.packaging ?? undefined,
  }
}

// Convert the static products.ts catalog into DBProduct shape for fallback use
function buildStaticFallback(): DBProduct[] {
  const rows: DBProduct[] = []
  for (const items of Object.values(staticProducts)) {
    for (const p of items) {
      rows.push({
        id: `static-${p.category}-${p.id}`,
        created_at: '',
        name: p.header,
        subheader: p.subheader,
        category: p.category,
        price: p.price,
        final_price: p.finalPrice ?? null,
        description: p.text,
        features: p.features,
        src: p.src,
        alt_src: p.altImage !== p.src ? p.altImage : null,
        nu: p.nu,
        in_stock: true,
        featured: p.id === 0,
        sort_order: p.id,
        quantity: null,
        shades: p.shades ?? [],
        sale_start: null,
        sale_end: null,
        packaging: null,
      })
    }
  }
  return rows
}

export const useProductStore = defineStore('products', () => {
  const rawProducts = ref<DBProduct[]>(buildStaticFallback())
  const loading = ref(false)
  const loaded = ref(false)

  const catalog = computed<catalog>(() => {
    const byCategory: Record<string, DBProduct[]> = {}
    for (const p of rawProducts.value) {
      if (!byCategory[p.category]) byCategory[p.category] = []
      byCategory[p.category].push(p)
    }
    const result: catalog = {}
    for (const [cat, items] of Object.entries(byCategory)) {
      result[cat] = items
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p, i) => toProduct(p, i))
    }
    return result
  })

  const flatList = computed<product[]>(() =>
    Object.values(catalog.value).flat()
  )

  async function fetchProducts() {
    if (loading.value) return   // prevent concurrent fetches
    loading.value = true
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/products`)
      if (res.ok) {
        const data: DBProduct[] = await res.json()
        // Only replace static fallback if DB has the current catalog categories.
        // Guards against stale DB (schema not migrated yet) wiping out the static products.
        if (data.length > 0 && data.some(p => p.category === 'lipgloss')) {
          rawProducts.value = data
        }
      }
    } catch {
      // network error — keep whatever rawProducts already has
    } finally {
      loaded.value = true
      loading.value = false
    }
  }

  function getProductsOfType(category: string): product[] {
    return catalog.value[category] ?? []
  }

  function getProduct(category: string, id: number): product | null {
    return catalog.value[category]?.[id] ?? null
  }

  function getSelection(category: string, id: number): product[] {
    const all = flatList.value.filter(p => !(p.category === category && p.id === id))
    return [...all].sort(() => Math.random() - 0.5).slice(0, 3)
  }

  return { rawProducts, loading, loaded, catalog, flatList, fetchProducts, getProductsOfType, getProduct, getSelection }
})
