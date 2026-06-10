import { defineStore } from 'pinia'
import { ref } from 'vue'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const usePackagingStore = defineStore('packaging', () => {
  const price  = ref(2)   // default 2 TND; overwritten by backend setting
  const loaded = ref(false)

  async function fetchPrice() {
    if (loaded.value) return
    try {
      const res = await fetch(`${API}/api/settings`)
      if (res.ok) {
        const data = await res.json()
        if (data.packaging_price != null) {
          price.value = Number(data.packaging_price)
        }
        loaded.value = true
      }
    } catch { /* keep default */ }
  }

  return { price, loaded, fetchPrice }
})
