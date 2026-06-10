<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../../pinia/productStore'
import NavigationGlobal from '../../components/navigation-global.vue'
import FooterGlobal     from '../../components/footer-global.vue'

const route        = useRoute()
const productStore = useProductStore()

const fromName = computed(() => String(route.query.from || 'Someone'))
const itemNames = computed<string[]>(() => {
  const raw = String(route.query.items || '')
  if (!raw) return []
  return raw.split('|').map(s => decodeURIComponent(s.trim())).filter(Boolean)
})

const products = computed(() =>
  itemNames.value
    .map(name => productStore.flatList.find(p => p.header === name))
    .filter(Boolean) as typeof productStore.flatList
)

onMounted(() => {
  if (!productStore.loaded) productStore.fetchProducts()
})

function productRoute(p: typeof productStore.flatList[0]) {
  return { name: p.category, params: { id: p.id } }
}
</script>

<template>
  <div class="flex flex-col min-h-screen" style="background:#FDF6EE; font-family:'Manrope',sans-serif;">
    <NavigationGlobal color="black" />

    <main class="flex-grow w-full max-w-4xl mx-auto px-4 py-12">

      <!-- Header -->
      <div class="text-center mb-10">
        <p class="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style="color:#9B86A8;">Shared wishlist</p>
        <h1 class="font-great-vibes text-6xl mb-3" style="color:#3D2B1F;">{{ fromName }}'s Picks</h1>
        <p class="text-sm opacity-60" style="color:#3D2B1F;">
          {{ products.length }} item{{ products.length !== 1 ? 's' : '' }} they love
        </p>
      </div>

      <!-- Products grid -->
      <div v-if="products.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <router-link
          v-for="p in products"
          :key="p.header"
          :to="productRoute(p)"
          class="flex flex-col gap-2 rounded-2xl overflow-hidden bg-white p-4 hover:shadow-md transition group"
          style="border:1px solid #f0ebe3;"
        >
          <div class="rounded-xl overflow-hidden flex items-center justify-center h-36" style="background:#FFF9F4;">
            <img :src="p.src" :alt="p.header" class="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>
          <p class="font-great-vibes text-2xl leading-tight" style="color:#3D2B1F;">{{ p.header }}</p>
          <p class="text-[10px] font-bold uppercase tracking-widest" style="color:#9B86A8;">{{ p.subheader }}</p>
          <p class="text-sm font-bold" style="color:#C4828A;">
            <span v-if="p.finalPrice" class="line-through opacity-40 mr-1.5" style="color:#3D2B1F;">{{ p.price }} TND</span>
            {{ p.finalPrice ?? p.price }} TND
          </p>
        </router-link>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-20">
        <p class="text-5xl mb-4">💝</p>
        <p class="text-sm font-semibold" style="color:#3D2B1F;">No products found</p>
        <p class="text-xs mt-1" style="color:#9B86A8;">The items in this wishlist may no longer be available.</p>
        <router-link to="/" class="mt-6 inline-block px-8 py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest" style="background:#3D2B1F;">
          Explore the collection
        </router-link>
      </div>

    </main>

    <FooterGlobal />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
