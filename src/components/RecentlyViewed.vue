<script setup lang="ts">
import { computed } from 'vue'
import { useRecentlyViewed } from '../composables/useRecentlyViewed'

const props = defineProps<{ currentCategory: string; currentId: number }>()

const { recentProducts } = useRecentlyViewed()

const visible = computed(() =>
  recentProducts.value.filter(
    p => !(p.category === props.currentCategory && p.id === props.currentId)
  )
)
</script>

<template>
  <section v-if="visible.length" class="w-full max-w-5xl mx-auto px-4 pb-12">
    <div class="mb-4 flex items-center gap-3">
      <div class="h-px flex-1 bg-[#f0ebe3]"></div>
      <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">Recently Viewed</p>
      <div class="h-px flex-1 bg-[#f0ebe3]"></div>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      <router-link
        v-for="p in visible"
        :key="`${p.category}-${p.id}`"
        :to="{ name: p.category, params: { id: p.id } }"
        class="flex-shrink-0 snap-start flex flex-col items-center gap-2 rounded-2xl bg-white p-4 w-36 transition hover:-translate-y-1 hover:shadow-md"
        style="border:1px solid #f0ebe3;"
      >
        <img :src="p.src" :alt="p.name" class="h-20 w-20 object-contain" />
        <p class="text-xs font-bold text-center leading-tight truncate w-full text-center" style="color:#3D2B1F;">{{ p.name }}</p>
        <p class="text-[10px] font-semibold" style="color:#C9A45A;">{{ p.price }} TND</p>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
