import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Perk {
  id: number
  threshold: number   // 0 = always shown; >0 = cart must reach this amount
  topText: string     // e.g. "Dès 50 TND"
  subText: string     // e.g. "Pochette ruban offerte"
  giftName: string    // empty = badge only, not a cart gift
  emoji: string
  active: boolean
}

const DEFAULTS: Perk[] = [
  { id: 1, threshold: 50,  topText: 'Dès 50 TND',  subText: 'Pochette ruban offerte',  giftName: 'Pochette Ruban Exaucée', emoji: '🎀', active: true },
  { id: 2, threshold: 100, topText: 'Dès 100 TND', subText: 'Gloss offert',             giftName: 'Gloss Exaucée',          emoji: '✨', active: true },
  { id: 3, threshold: 150, topText: 'Dès 150 TND', subText: 'Coffret cadeau offert',    giftName: 'Coffret Cadeau Exaucée', emoji: '🌸', active: true },
  { id: 4, threshold: 0,   topText: 'Toujours',    subText: 'Cruelty-free & vegan',     giftName: '',                       emoji: '🐰', active: true },
]

export const usePerkStore = defineStore('perks', () => {
  const perks  = ref<Perk[]>(DEFAULTS)
  const loaded = ref(false)

  async function fetchPerks() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/perks`)
      if (res.ok) {
        perks.value = await res.json()
        loaded.value = true
        return
      }
    } catch { /* keep defaults */ }
    loaded.value = true
  }

  // All active perks (for the display bar)
  const displayPerks = computed(() => perks.value.filter(p => p.active))

  // Perks that give an actual free item (threshold > 0, giftName set)
  const giftPerks = computed(() =>
    perks.value.filter(p => p.active && p.threshold > 0 && p.giftName.trim())
  )

  return { perks, loaded, fetchPerks, displayPerks, giftPerks }
})
