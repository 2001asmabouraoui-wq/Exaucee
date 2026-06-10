<script setup lang="ts">
import { computed } from 'vue'
import { useProductStore } from '../pinia/productStore'

const props = defineProps<{ productCategory: string; productId: number }>()
const store = useProductStore()

const CARD_ACCENT: Record<string, string> = {
  lipgloss: '#FEF0F2',
}

function categoryLabel(cat: string): string {
  if (cat === 'lipgloss') return 'Lip Gloss'
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

const items = computed(() =>
  store.getSelection(props.productCategory, props.productId).slice(0, 3)
)
</script>

<template>
  <section v-if="items.length" class="w-full py-16 px-4" style="background-color:#ffffff;">
    <div class="max-w-6xl mx-auto flex flex-col items-center">
      <span class="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style="color:#3D2B1F;">You May Also Like</span>
      <h2 class="font-great-vibes text-5xl md:text-6xl drop-shadow-sm mb-2" style="color:#3D2B1F;">The Collection</h2>
      <div class="flex items-center gap-3 mb-10">
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold">✦</span>
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full justify-items-center">
        <router-link
          v-for="(item, i) in items"
          :key="i"
          :to="{ name: item.category, params: { id: item.id } }"
          class="group relative flex flex-col items-center rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white w-full max-w-xs"
          :style="{ border: '1px solid #f0ebe3', borderTopWidth: '3px', borderTopColor: CARD_ACCENT[item.category] }"
        >
          <div class="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            <span v-if="item.nu" class="rounded-full bg-ex-rose px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">New</span>
            <span class="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ex-brown" :style="{ backgroundColor: CARD_ACCENT[item.category] }">{{ categoryLabel(item.category) }}</span>
          </div>
          <span class="absolute top-4 right-4 text-ex-gold opacity-25 text-sm select-none pointer-events-none">✦</span>
          <div class="w-full flex items-center justify-center pt-12 pb-2 px-6 h-52 relative">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-32 h-32 rounded-full bg-white/40 blur-2xl"></div>
            </div>
            <img :src="item.src" :alt="item.header" loading="lazy" class="relative z-10 h-full object-contain product-float transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div class="w-full flex flex-col items-center text-center px-5 pb-6 pt-3 gap-2">
            <h3 class="font-great-vibes text-3xl text-ex-rose leading-tight">{{ item.header }}</h3>
            <p class="text-[10px] text-ex-brown opacity-50 uppercase tracking-widest">{{ item.subheader }}</p>
            <p class="font-bold text-sm mt-1" style="color:#3D2B1F;">{{ item.price }} TND</p>
            <span class="discover-btn mt-2 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300">
              Discover
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
.discover-btn { border: 1px solid #C4828A; color: #C4828A; background: transparent; }
.group:hover .discover-btn { background: #C4828A; color: #ffffff; border-color: #C4828A; }
</style>
