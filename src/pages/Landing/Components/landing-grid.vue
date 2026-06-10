<script setup lang="ts">
import { computed } from 'vue'
import { useProductStore } from '../../../pinia/productStore'
import { useLangStore } from '../../../pinia/langStore'
import { product } from '../../../data/product-types.ts'

const FLOAT_DELAYS = ['0s', '0.6s', '1.2s']
const CARD_ACCENT = '#FEF0F2'

const store     = useProductStore()
const langStore = useLangStore()

const products = computed<product[]>(() => store.catalog['lipgloss'] ?? [])

function subheaderFor(header: string, fallback: string): string {
  return (langStore.t.productCatalog as Record<string, string>)[header.toLowerCase()] ?? fallback
}
</script>

<template>
  <section class="w-full py-20 px-4" style="background-color:#FFF9F4;">
    <div class="max-w-6xl mx-auto">

      <!-- Section header -->
      <div class="flex flex-col items-center mb-12">
        <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-ex-sage mb-3">{{ langStore.t.landing.grid.eyebrow }}</span>
        <h2 class="font-great-vibes text-5xl md:text-6xl text-ex-rose drop-shadow-sm">{{ langStore.t.landing.grid.title }}</h2>
        <div class="mt-4 flex items-center gap-3">
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          <span class="text-ex-gold">✦</span>
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        </div>
        <p class="mt-3 text-xs text-ex-brown opacity-50 italic max-w-sm text-center leading-relaxed">
          {{ langStore.t.landing.grid.subtitle }}
        </p>
      </div>

      <!-- Loading shimmer — only when there are truly no products yet -->
      <div v-if="!products.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="rounded-2xl bg-white h-80 animate-pulse" style="border:1px solid #f0ebe3;"></div>
      </div>

      <!-- Product grid — shows immediately from static fallback, updates when DB responds -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <router-link
          v-for="(p, i) in products"
          :key="p.category + '-' + p.id"
          :to="`/${p.category}/${p.id}`"
          class="group relative flex flex-col items-center rounded-2xl overflow-hidden shadow-sm transition-all duration-400 hover:-translate-y-2 hover:shadow-xl bg-white cursor-pointer"
          :style="{ border: '1px solid #f0ebe3', borderTop: `3px solid ${CARD_ACCENT}` }"
        >
          <div class="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            <span v-if="p.nu" class="rounded-full bg-ex-rose px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">{{ langStore.t.landing.grid.newBadge }}</span>
            <span class="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ex-brown" :style="{ backgroundColor: CARD_ACCENT }">{{ langStore.t.landing.grid.lipGloss }}</span>
          </div>
          <span class="absolute top-4 right-4 text-ex-gold opacity-25 text-sm select-none pointer-events-none">✦</span>
          <div class="w-full flex items-center justify-center pt-8 pb-2 px-8 h-40 relative">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-32 h-32 rounded-full bg-white/40 blur-2xl"></div>
            </div>
            <img :src="p.src" :alt="p.header" loading="lazy" class="relative z-10 h-full object-contain product-float transition-transform duration-700 group-hover:scale-110" :style="{ animationDelay: FLOAT_DELAYS[i] }" />
          </div>
          <div class="w-full flex flex-col items-center text-center px-5 pb-6 pt-3 gap-2">
            <h3 class="font-great-vibes text-3xl text-ex-rose leading-tight">{{ p.header }}</h3>
            <p class="text-[10px] text-ex-brown opacity-50 uppercase tracking-widest">{{ subheaderFor(p.header, p.subheader) }}</p>
            <p class="text-ex-gold font-bold text-sm mt-1">{{ p.price }} TND</p>
            <span class="discover-btn mt-2 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300">
              {{ langStore.t.landing.grid.discover }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
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
