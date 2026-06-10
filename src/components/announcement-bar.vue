<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLangStore } from '../pinia/langStore'

const langStore = useLangStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Only store the admin override; if empty, fall through to the reactive locale
const backendAnnouncement = ref('')

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl}/api/settings`)
    if (res.ok) {
      const data = await res.json()
      if (data.announcement) backendAnnouncement.value = data.announcement
    }
  } catch { /* keep empty → locale used */ }
})

// Reactive: updates immediately when language switches (unless admin override is set)
const displayAnnouncement = computed(() => backendAnnouncement.value || langStore.t.announcement)
</script>

<template>
  <div class="w-full overflow-hidden py-2.5" style="background-color: #C4828A; color: #ffffff;">
    <div class="marquee-track text-xs font-bold uppercase tracking-widest select-none">
      <span v-for="n in 2" :key="n" class="flex shrink-0 items-center px-5">
        {{ displayAnnouncement }}
      </span>
    </div>
  </div>
</template>
