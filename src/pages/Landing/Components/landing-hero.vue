<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLangStore } from '../../../pinia/langStore'
import { useProductStore } from '../../../pinia/productStore'

const langStore    = useLangStore()
const productStore = useProductStore()

const ACCENT_COLORS = ['#EEF4FB', '#FDEEF1', '#FDF0E2', '#EEF9F4', '#FBF0F9']

const slides = computed(() => {
  // Use featured products in sort_order; fall back to first 3 if none are marked featured
  let source = productStore.rawProducts
    .filter(p => p.featured)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (source.length === 0) {
    source = [...productStore.rawProducts].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3)
  }

  const catalog  = langStore.t.productCatalog as Record<string, string>
  const descs    = (langStore.t as Record<string, unknown>).productDescriptions as Record<string, string> | undefined

  return source.map((raw, i) => {
    const key = raw.name.toLowerCase()
    // Resolve the route id: index of this product in its category's sorted list
    const catRaw = productStore.rawProducts
      .filter(p => p.category === raw.category)
      .sort((a, b) => a.sort_order - b.sort_order)
    const routeId = Math.max(0, catRaw.findIndex(p => p.id === raw.id))

    return {
      bg: '#ffffff',
      title: raw.name,
      subtitle: catalog[key] ?? raw.subheader,
      desc: descs?.[key] ?? raw.description,
      cta: `${langStore.t.hero.cta} ${raw.name}`,
      routeName: raw.category,
      routeId,
      image: raw.src,
      flip: i % 2 !== 0,
      accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
    }
  })
})

const current   = ref(0)
const isHovered = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function goTo(i: number) { current.value = i }
function next() { current.value = (current.value + 1) % Math.max(1, slides.value.length) }
function prev() { current.value = (current.value - 1 + Math.max(1, slides.value.length)) % Math.max(1, slides.value.length) }

function startTimer() {
  timer = setInterval(() => { if (!isHovered.value) next() }, 5200)
}
onMounted(startTimer)
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section
    class="relative w-full min-h-[74vh] flex items-center overflow-hidden transition-colors duration-700"
    :style="{ backgroundColor: slides[current]?.bg ?? '#ffffff' }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Slide content -->
    <Transition name="hero-slide" mode="out-in">
      <div
        v-if="slides.length > 0"
        :key="current"
        class="w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-16 flex flex-col md:grid md:grid-cols-2 items-center gap-6 py-24 md:py-16"
      >
        <!-- Text block -->
        <div
          class="flex flex-col items-center text-center md:items-start md:text-start z-10 order-2"
          :class="slides[current].flip ? 'md:order-2' : 'md:order-1'"
        >
          <h1 class="font-great-vibes text-7xl md:text-8xl lg:text-[7rem] leading-none drop-shadow-sm" style="color:#3D2B1F;">
            {{ slides[current].title }}
          </h1>
          <p class="mt-2 text-base font-light tracking-[0.25em] uppercase" style="color:#9B86A8;">
            {{ slides[current].subtitle }}
          </p>

          <div class="my-6 flex items-center gap-3 self-center md:self-start">
            <div class="h-px w-10 opacity-60" style="background-color:#9B86A8;"></div>
            <span class="text-sm" style="color:#9B86A8;">✦</span>
            <div class="h-px w-10 opacity-60" style="background-color:#9B86A8;"></div>
          </div>

          <p class="text-sm leading-relaxed text-ex-brown opacity-65 max-w-sm mb-8">
            {{ slides[current].desc }}
          </p>

          <router-link
            :to="{ name: slides[current].routeName, params: { id: slides[current].routeId } }"
            class="hero-cta inline-flex items-center gap-3 rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-300"
          >
            {{ slides[current].cta }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="hero-cta-arrow h-3.5 w-3.5 transition-transform duration-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </router-link>
        </div>

        <!-- Image block -->
        <div
          class="flex items-center justify-center relative order-1"
          :class="slides[current].flip ? 'md:order-1' : 'md:order-2'"
        >
          <div
            class="absolute w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full blur-3xl opacity-40"
            :style="{ background: `radial-gradient(circle, ${slides[current].accentColor}99 0%, transparent 70%)` }"
          ></div>
          <img
            :src="slides[current].image"
            :alt="slides[current].title"
            class="relative z-10 w-80 sm:w-[30rem] md:w-[38rem] lg:w-[48rem] object-contain product-float drop-shadow-lg"
          />
        </div>
      </div>
    </Transition>

    <!-- Prev / Next arrows -->
    <button
      v-if="slides.length > 1"
      @click="prev"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm text-ex-rose shadow-sm transition hover:bg-white hover:shadow-md"
      aria-label="Previous slide"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      v-if="slides.length > 1"
      @click="next"
      class="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm text-ex-rose shadow-sm transition hover:bg-white hover:shadow-md"
      aria-label="Next slide"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Slide dots -->
    <div v-if="slides.length > 1" class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      <button
        v-for="(_, i) in slides"
        :key="i"
        @click="goTo(i)"
        class="rounded-full transition-all duration-500"
        :class="i === current ? 'w-7 h-2 bg-ex-rose' : 'w-2 h-2 bg-ex-rose/25'"
        :aria-label="`Go to slide ${i + 1}`"
      />
    </div>

    <!-- Slide counter -->
    <div v-if="slides.length > 1" class="absolute top-8 right-8 z-20 hidden md:flex items-center gap-1.5 text-xs font-semibold tracking-widest" style="color:#D4859A;">
      <span>{{ String(current + 1).padStart(2, '0') }}</span>
      <span class="h-px w-5 bg-current inline-block"></span>
      <span>{{ String(slides.length).padStart(2, '0') }}</span>
    </div>
  </section>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.hero-slide-enter-active { transition: all 0.55s cubic-bezier(0.4, 0, 0.2, 1); }
.hero-slide-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.hero-slide-enter-from   { opacity: 0; transform: translateX(32px) scale(0.99); }
.hero-slide-leave-to     { opacity: 0; transform: translateX(-32px) scale(0.99); }

.hero-cta { background-color: #C4828A; color: #ffffff; }
.hero-cta:hover {
  background-color: #A85560;
  box-shadow: 0 10px 25px -5px rgba(196, 130, 138, 0.4);
  transform: translateY(-2px);
}
.hero-cta:hover .hero-cta-arrow { transform: translateX(4px); }
</style>
