<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'
import { useCartStore } from '../../pinia/cartStore'

const cartStore = useCartStore()
const apiUrl    = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Bundle {
  id: string
  name: string
  description: string
  original_price: number
  bundle_price: number
  image: string
  items: { name: string; quantity: number }[]
  featured: boolean
}

const bundles = ref<Bundle[]>([])
const loading = ref(true)
const added   = ref<Record<string, boolean>>({})

async function fetchBundles() {
  try {
    const res = await fetch(`${apiUrl}/api/bundles`)
    if (res.ok) bundles.value = await res.json()
  } catch { /* ignore */ }
  loading.value = false
}

function addToCart(bundle: Bundle) {
  cartStore.addToCart({
    id: 0,
    category: 'bundle',
    src: bundle.image || '/brand/logo.jpg',
    altImage: bundle.image || '/brand/logo.jpg',
    topSrc: '', botSrc: '', rightSrc: '',
    nu: false,
    header: bundle.name,
    subheader: 'Bundle',
    text: bundle.description,
    features: bundle.items.map(i => `${i.name} × ${i.quantity}`).join(' · '),
    inthebox: [],
    price: bundle.bundle_price,
    options: [],
    selectedOptions: {},
    finalPrice: bundle.bundle_price,
  })
  added.value[bundle.id] = true
  setTimeout(() => { added.value[bundle.id] = false }, 2000)
}

function savings(b: Bundle) {
  if (!b.original_price || b.original_price <= b.bundle_price) return 0
  return (b.original_price - b.bundle_price).toFixed(2)
}

onMounted(fetchBundles)
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none" style="background-color:#FFF9F4;">
    <AnnouncementBar />
    <Navigation color="k-black" />

    <main class="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-16 gap-12 flex-grow">

      <!-- Header -->
      <div class="flex flex-col items-center text-center">
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-3" style="color:#9B86A8;">Curated Sets</p>
        <h1 class="font-great-vibes text-6xl drop-shadow-sm" style="color:#3D2B1F;">Pâtisserie Boxes</h1>
        <div class="mt-4 flex items-center gap-3">
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          <span class="text-ex-gold text-sm">✦</span>
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        </div>
        <p class="mt-4 text-sm opacity-60 max-w-md" style="color:#3D2B1F;">Indulge in perfectly paired collections — each bundle crafted for a complete look at a special price.</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-sm opacity-40" style="color:#3D2B1F;">Loading bundles…</div>

      <!-- Empty -->
      <div v-else-if="bundles.length === 0" class="text-center py-16 opacity-50">
        <p class="text-2xl mb-3">🎁</p>
        <p class="text-sm" style="color:#3D2B1F;">No bundles available yet. Check back soon!</p>
      </div>

      <!-- Bundles grid -->
      <div v-else class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="bundle in bundles"
          :key="bundle.id"
          class="relative rounded-2xl bg-white overflow-hidden flex flex-col transition hover:shadow-md"
          style="border:1px solid #f0ebe3;"
        >
          <!-- Savings badge -->
          <div
            v-if="savings(bundle)"
            class="absolute top-3 right-3 z-10 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white"
            style="background:#C4828A;"
          >Save {{ savings(bundle) }} TND</div>

          <!-- Image -->
          <div class="flex items-center justify-center p-8" style="background:#FFF9F4; min-height:180px;">
            <img
              v-if="bundle.image"
              :src="bundle.image"
              :alt="bundle.name"
              class="h-36 w-full object-contain"
            />
            <span v-else class="text-5xl">🎁</span>
          </div>

          <!-- Content -->
          <div class="flex flex-col gap-3 p-6 flex-grow">
            <h2 class="font-great-vibes text-3xl leading-none" style="color:#3D2B1F;">{{ bundle.name }}</h2>
            <p v-if="bundle.description" class="text-xs leading-relaxed opacity-60" style="color:#3D2B1F;">{{ bundle.description }}</p>

            <!-- Items list -->
            <ul class="flex flex-col gap-1">
              <li
                v-for="(item, i) in bundle.items"
                :key="i"
                class="flex items-center gap-2 text-xs"
                style="color:#3D2B1F;"
              >
                <span style="color:#C4828A;">✦</span>
                {{ item.name }} <span class="opacity-50">× {{ item.quantity }}</span>
              </li>
            </ul>

            <!-- Price + CTA -->
            <div class="mt-auto pt-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p class="text-xl font-bold" style="color:#3D2B1F;">{{ bundle.bundle_price }} TND</p>
                <p v-if="bundle.original_price > bundle.bundle_price" class="text-xs line-through opacity-40" style="color:#3D2B1F;">{{ bundle.original_price }} TND</p>
              </div>
              <button
                @click="addToCart(bundle)"
                class="rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition"
                :style="added[bundle.id]
                  ? { background:'#5A9E8A', color:'#fff', border:'none' }
                  : { background:'transparent', color:'#C4828A', border:'1px solid #C4828A' }"
              >{{ added[bundle.id] ? '✓ Added' : 'Add to Cart' }}</button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <Footer />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
