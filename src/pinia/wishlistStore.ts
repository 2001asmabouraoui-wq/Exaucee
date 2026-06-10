import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useWishlistStore = defineStore('wishlist', () => {
  const items  = ref<string[]>([])
  const loaded = ref(false)

  async function load(authHeaders: Record<string, string>) {
    try {
      const res = await fetch(`${API_URL}/api/wishlist`, { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        items.value = Array.isArray(data) ? data.map((d: any) => d.product_id ?? d) : []
      }
    } catch { /* non-critical */ }
    loaded.value = true
  }

  async function toggle(productId: string, authHeaders: Record<string, string>) {
    if (items.value.includes(productId)) {
      try {
        await fetch(`${API_URL}/api/wishlist/${productId}`, {
          method: 'DELETE',
          headers: authHeaders,
        })
      } catch { /* optimistic */ }
      items.value = items.value.filter(id => id !== productId)
    } else {
      try {
        await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ product_id: productId }),
        })
      } catch { /* optimistic */ }
      items.value = [...items.value, productId]
    }
  }

  const isWishlisted = (id: string) => items.value.includes(id)

  return { items, loaded, load, toggle, isWishlisted }
})
