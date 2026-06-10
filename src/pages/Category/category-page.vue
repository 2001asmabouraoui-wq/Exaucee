<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Navigation    from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import CategoryBoxes from '../../components/Category-Box/category-box-container.vue'
import Info          from '../../components/info-section.vue'
import Footer        from '../../components/footer-global.vue'
import { useProductStore } from '../../pinia/productStore'
import { product } from '../../data/product-types.ts'

const props = defineProps<{ category: string }>()
const store = useProductStore()

const CATEGORY_CONFIG: Record<string, { title: string; subtitle: string }> = {
  lipgloss: { title: 'Lip Gloss', subtitle: 'High-shine, plumping glosses in three patisserie-inspired shades' },
}

const normalizedCategory = computed(() => props.category.toLowerCase().replace(/\s+/g, '-'))
const activeConfig = computed(() =>
  CATEGORY_CONFIG[normalizedCategory.value] ?? { title: props.category, subtitle: '' }
)
const products = computed(() => store.getProductsOfType(normalizedCategory.value))

// ── Filters ───────────────────────────────────────────
const minPrice       = ref<number | null>(null)
const maxPrice       = ref<number | null>(null)
const inStockOnly    = ref(false)
const selectedShades = ref<Set<string>>(new Set())

const availableShades = computed(() => {
  const seen = new Map<string, string>()
  for (const p of products.value) {
    for (const s of (p.shades ?? [])) seen.set(s.name, s.hex)
  }
  return Array.from(seen.entries()).map(([name, hex]) => ({ name, hex }))
})

const activeFiltersCount = computed(() =>
  (minPrice.value !== null ? 1 : 0) +
  (maxPrice.value !== null ? 1 : 0) +
  (inStockOnly.value ? 1 : 0) +
  selectedShades.value.size
)

function toggleShade(name: string) {
  const s = new Set(selectedShades.value)
  if (s.has(name)) { s.delete(name) } else { s.add(name) }
  selectedShades.value = s
}

function clearFilters() {
  minPrice.value = null
  maxPrice.value = null
  inStockOnly.value = false
  selectedShades.value = new Set()
}

const filteredProducts = computed(() => {
  let result = products.value
  if (minPrice.value !== null) result = result.filter(p => p.price >= minPrice.value!)
  if (maxPrice.value !== null) result = result.filter(p => p.price <= maxPrice.value!)
  if (inStockOnly.value) result = result.filter(p => p.in_stock !== false)
  if (selectedShades.value.size > 0)
    result = result.filter(p => (p.shades ?? []).some(s => selectedShades.value.has(s.name)))
  return result
})
// ─────────────────────────────────────────────────────

const currentIndex = ref(0)
watch(filteredProducts, () => { currentIndex.value = 0 })

function getWindow(arr: product[], start: number, size: number): product[] {
  const result: product[] = []
  for (let i = 0; i < Math.min(size, arr.length); i++) {
    result.push(arr[(start + i) % arr.length])
  }
  return result
}

const visibleDesktop = computed(() => getWindow(filteredProducts.value, currentIndex.value, 3))
const visibleMobile  = computed(() => getWindow(filteredProducts.value, currentIndex.value, 1))

function next() { if (filteredProducts.value.length) currentIndex.value = (currentIndex.value + 1) % filteredProducts.value.length }
function prev() { if (filteredProducts.value.length) currentIndex.value = (currentIndex.value - 1 + filteredProducts.value.length) % filteredProducts.value.length }

const CARD_ACCENTS = ['#FDEEF1', '#D6E9DC', '#F7D9E0', '#C6B7CC']
function cardColor(productId: number): string {
  return CARD_ACCENTS[productId % CARD_ACCENTS.length]
}

const FLOAT_DELAYS = ['0s', '0.5s', '1.0s']
</script>

<template>
  <div class="flex flex-col min-h-screen bg-ex-cream font-Manrope select-none">
    <AnnouncementBar />
    <Navigation color="k-black" />

    <header class="flex w-full flex-col items-center bg-ex-sage-light">
      <div class="my-12 flex w-4/5 max-w-4xl flex-col items-center text-center lg:my-20">
        <p class="text-xs uppercase tracking-widest text-ex-sage font-semibold mb-3">Collection</p>
        <h1 class="font-great-vibes text-6xl md:text-7xl text-ex-rose drop-shadow-sm">{{ activeConfig.title }}</h1>
        <p class="mt-3 text-sm text-ex-brown opacity-60 italic">{{ activeConfig.subtitle }}</p>
        <div class="mt-6 flex items-center gap-3">
          <div class="h-px w-16 bg-ex-gold opacity-60"></div>
          <span class="text-ex-gold text-lg">✦</span>
          <div class="h-px w-16 bg-ex-gold opacity-60"></div>
        </div>
      </div>
    </header>

    <main class="flex h-full w-full flex-col items-center bg-ex-cream pb-10">

      <!-- ── Filters ── -->
      <section class="w-full flex justify-center px-4 pt-8 pb-2">
        <div class="w-full max-w-6xl flex flex-wrap items-center gap-3">

          <!-- Price range -->
          <div class="flex items-center gap-2 bg-white rounded-full px-4 py-2" style="border:1px solid #f0ebe3;">
            <span class="text-[10px] font-bold uppercase tracking-widest opacity-50" style="color:#3D2B1F;">Price</span>
            <input
              v-model.number="minPrice"
              type="number" min="0"
              placeholder="Min"
              class="w-14 text-xs outline-none bg-transparent text-center"
              style="color:#3D2B1F;"
            />
            <span class="text-xs opacity-30" style="color:#3D2B1F;">–</span>
            <input
              v-model.number="maxPrice"
              type="number" min="0"
              placeholder="Max"
              class="w-14 text-xs outline-none bg-transparent text-center"
              style="color:#3D2B1F;"
            />
            <span class="text-[10px] opacity-40" style="color:#3D2B1F;">TND</span>
          </div>

          <!-- In stock only -->
          <label
            class="flex items-center gap-2 cursor-pointer rounded-full px-4 py-2 transition"
            :style="inStockOnly ? 'background:#D6E9DC; border:1px solid #D6E9DC;' : 'background:#fff; border:1px solid #f0ebe3;'"
          >
            <input type="checkbox" v-model="inStockOnly" class="sr-only" />
            <span class="h-4 w-4 rounded-sm flex items-center justify-center flex-shrink-0 transition" :style="inStockOnly ? 'background:#5A9E8A;' : 'background:#f0ebe3;'">
              <svg v-if="inStockOnly" class="h-3 w-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest" :style="inStockOnly ? 'color:#5A9E8A;' : 'color:#3D2B1F; opacity:0.6;'">In stock only</span>
          </label>

          <!-- Shade filter (only if products have shades) -->
          <div v-if="availableShades.length" class="flex items-center gap-2 bg-white rounded-full px-4 py-2" style="border:1px solid #f0ebe3;">
            <span class="text-[10px] font-bold uppercase tracking-widest opacity-50 mr-1" style="color:#3D2B1F;">Shade</span>
            <button
              v-for="s in availableShades"
              :key="s.name"
              @click="toggleShade(s.name)"
              class="h-5 w-5 rounded-full transition-all hover:scale-110"
              :style="{
                backgroundColor: s.hex,
                boxShadow: selectedShades.has(s.name) ? `0 0 0 2px #fff, 0 0 0 3.5px ${s.hex}` : '0 1px 3px rgba(0,0,0,0.15)',
              }"
              :title="s.name"
            />
          </div>

          <!-- Clear filters -->
          <button
            v-if="activeFiltersCount > 0"
            @click="clearFilters"
            class="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition"
            style="background:#FDEEF1; color:#C4828A; border:1px solid #F7D9E0;"
          >✕ Clear ({{ activeFiltersCount }})</button>

          <!-- No results notice -->
          <span v-if="!store.loading && filteredProducts.length === 0 && products.length > 0" class="text-xs opacity-50" style="color:#3D2B1F;">
            No products match these filters
          </span>
        </div>
      </section>

      <!-- Loading shimmer — only when no products available yet -->
      <div v-if="!products.length" class="w-full max-w-6xl flex justify-center gap-6 py-16 px-4">
        <div v-for="i in 3" :key="i" class="flex-1 max-w-xs h-80 rounded-3xl animate-pulse" style="background:#f0ebe3;"></div>
      </div>

      <!-- Carousel -->
      <section v-else class="w-full flex flex-col items-center py-16 px-4">
        <!-- DESKTOP -->
        <div class="hidden md:flex items-center gap-4 w-full max-w-6xl px-2">
          <button type="button" @click="prev" class="carousel-arrow" aria-label="Previous">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <Transition name="card-slide" mode="out-in">
            <div :key="currentIndex" class="flex flex-1 justify-center gap-6">
              <router-link
                v-for="(p, slot) in visibleDesktop"
                :key="p.id"
                :to="`/${normalizedCategory}/${p.id}`"
                class="group relative flex flex-col items-center rounded-3xl shadow-sm overflow-hidden flex-1 max-w-xs px-6 pt-8 pb-7 gap-4 transition duration-400 hover:-translate-y-2 hover:shadow-lg cursor-pointer"
                :style="{ backgroundColor: '#ffffff', borderTop: `3px solid ${cardColor(p.id)}` }"
              >
                <span class="absolute top-3 right-4 text-ex-gold opacity-30 text-lg select-none pointer-events-none">✦</span>
                <span v-if="p.nu" class="absolute top-3 left-4 text-[10px] font-semibold uppercase tracking-widest text-ex-sage">New</span>
                <div class="w-full flex items-center justify-center h-44">
                  <img :src="p.src" :alt="p.header" class="h-full object-contain product-float" :style="{ animationDelay: FLOAT_DELAYS[slot] }" />
                </div>
                <div class="text-center">
                  <h3 class="font-great-vibes text-4xl text-ex-rose leading-tight">{{ p.header }}</h3>
                  <p class="text-xs text-ex-brown opacity-55 mt-1 tracking-wide">{{ p.subheader }}</p>
                </div>
                <p class="text-ex-gold font-semibold text-sm tracking-wide">{{ p.price }} TND</p>
                <span class="text-xs uppercase tracking-widest font-semibold text-ex-rose border border-ex-rose rounded-full px-5 py-1.5 group-hover:bg-ex-rose group-hover:text-white transition duration-300">Discover</span>
              </router-link>
            </div>
          </Transition>
          <button type="button" @click="next" class="carousel-arrow" aria-label="Next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <!-- MOBILE -->
        <div class="md:hidden flex items-center gap-3 w-full max-w-sm px-2">
          <button type="button" @click="prev" class="carousel-arrow carousel-arrow--sm" aria-label="Previous">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <Transition name="card-slide" mode="out-in">
            <router-link
              v-for="p in visibleMobile"
              :key="p.id"
              :to="`/${normalizedCategory}/${p.id}`"
              class="group relative flex flex-col items-center rounded-3xl shadow-sm overflow-hidden flex-1 px-6 pt-8 pb-7 gap-4 transition duration-400 hover:shadow-lg cursor-pointer"
              :style="{ backgroundColor: '#ffffff', borderTop: `3px solid ${cardColor(p.id)}` }"
            >
              <span class="absolute top-3 right-4 text-ex-gold opacity-30 text-lg select-none pointer-events-none">✦</span>
              <span v-if="p.nu" class="absolute top-3 left-4 text-[10px] font-semibold uppercase tracking-widest text-ex-sage">New</span>
              <div class="w-full flex items-center justify-center h-44">
                <img :src="p.src" :alt="p.header" class="h-full object-contain product-float" />
              </div>
              <div class="text-center">
                <h3 class="font-great-vibes text-4xl text-ex-rose leading-tight">{{ p.header }}</h3>
                <p class="text-xs text-ex-brown opacity-55 mt-1 tracking-wide">{{ p.subheader }}</p>
              </div>
              <p class="text-ex-gold font-semibold text-sm tracking-wide">{{ p.price }} TND</p>
              <span class="text-xs uppercase tracking-widest font-semibold text-ex-rose border border-ex-rose rounded-full px-5 py-1.5 group-hover:bg-ex-rose group-hover:text-white transition duration-300">Discover</span>
            </router-link>
          </Transition>
          <button type="button" @click="next" class="carousel-arrow carousel-arrow--sm" aria-label="Next">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <!-- Dots -->
        <div class="flex gap-2 mt-8">
          <button
            v-for="(_, i) in filteredProducts"
            :key="i"
            type="button"
            @click="currentIndex = i"
            class="rounded-full transition-all duration-300"
            :class="i === currentIndex ? 'bg-ex-rose w-5 h-2.5' : 'bg-ex-gold opacity-30 w-2.5 h-2.5'"
          />
        </div>
      </section>

      <div class="mt-8 w-full"><CategoryBoxes /></div>
      <Info />
      <Footer />
    </main>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
.carousel-arrow {
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  height: 44px; width: 44px; border-radius: 50%;
  border: 1px solid #C4828A; background: #fff; color: #C4828A;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); cursor: pointer;
  transition: all 0.2s;
}
.carousel-arrow:hover { background: #C4828A; color: #fff; }
.carousel-arrow--sm { height: 40px; width: 40px; }
.card-slide-enter-active, .card-slide-leave-active { transition: all 0.35s ease; }
.card-slide-enter-from  { opacity: 0; transform: translateX(24px) scale(0.97); }
.card-slide-leave-to    { opacity: 0; transform: translateX(-24px) scale(0.97); }
</style>
