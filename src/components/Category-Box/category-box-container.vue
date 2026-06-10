<script setup lang="ts">
import { computed } from 'vue'
import { useProductStore } from '../../pinia/productStore'
import { useLangStore } from '../../pinia/langStore'

const store     = useProductStore()
const langStore = useLangStore()

const products = computed(() => store.catalog['lipgloss'] ?? [])

function subheaderFor(header: string, fallback: string): string {
  return (langStore.t.productCatalog as Record<string, string>)[header.toLowerCase()] ?? fallback
}

const ACCENTS = ['#EEF4FB', '#FDEEF1', '#FDF0E2', '#F0F5EE']
function accentFor(id: number): string {
  return ACCENTS[id % ACCENTS.length]
}
</script>

<template>
  <div class="mt-16 flex h-full w-full flex-col items-center bg-ex-cream py-12">

    <div class="mb-8 flex flex-col items-center">
      <p class="text-xs font-semibold uppercase tracking-widest text-ex-sage mb-2">
        {{ langStore.t.landing.categoryBox.eyebrow }}
      </p>
      <h2 class="font-great-vibes text-center text-5xl text-ex-rose drop-shadow-sm md:text-6xl">
        {{ langStore.t.landing.categoryBox.title }}
      </h2>
      <p class="mt-2 text-xs italic text-ex-brown opacity-50 md:text-sm">
        {{ langStore.t.landing.categoryBox.subtitle }}
      </p>
      <div class="mt-4 flex items-center gap-3">
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-sm">✦</span>
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
      </div>
    </div>

    <!-- Product cards — live from store -->
    <div class="w-11/12 max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-5 px-2">
      <router-link
        v-for="p in products"
        :key="p.id"
        :to="`/lipgloss/${p.id}`"
        class="group flex flex-col items-center rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
        style="border:1px solid #f0ebe3;"
      >
        <!-- Image area -->
        <div
          class="w-full flex items-center justify-center pt-6 pb-3 px-8 h-40 relative"
          :style="{ backgroundColor: accentFor(p.id) }"
        >
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-28 h-28 rounded-full bg-white/40 blur-2xl"></div>
          </div>
          <img
            :src="p.src"
            :alt="p.header"
            class="relative z-10 h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <!-- Text area -->
        <div class="w-full flex flex-col items-center text-center px-5 py-5 gap-1.5">
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
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
.discover-btn { border: 1px solid #C4828A; color: #C4828A; background: transparent; }
.group:hover .discover-btn { background: #C4828A; color: #ffffff; border-color: #C4828A; }
</style>
