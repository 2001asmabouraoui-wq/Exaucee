<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavigationGlobal from '../../components/navigation-global.vue'
import FooterGlobal from '../../components/footer-global.vue'
import { useLangStore } from '../../pinia/langStore'
import { useProductStore } from '../../pinia/productStore'
import type { DBProduct } from '../../pinia/productStore'

const router       = useRouter()
const langStore    = useLangStore()
const productStore = useProductStore()

const questions = computed(() => langStore.t.quiz.questions)

const TOTAL = 5

const answers   = ref<number[]>(new Array(TOTAL).fill(-1))
const step      = ref(0)
const direction = ref<'forward' | 'back'>('forward')

function select(idx: number) { answers.value[step.value] = idx }

function next() {
  if (answers.value[step.value] === -1) return
  direction.value = 'forward'
  step.value++
}

function prev() {
  if (step.value === 0) return
  direction.value = 'back'
  step.value--
}

function restart() {
  answers.value = new Array(TOTAL).fill(-1)
  step.value = 0
}

// ── Q4 shade index → exact product name in the DB ────────────────────────
// Index matches the options order in locales (0=Transparent, 1=Cerise, 2=Caramel, 3=Afternoon Tea)
const SHADE_TO_NAME: Record<number, string> = {
  0: 'Chantilly',
  1: 'Framboise',
  2: 'Caramel',
  3: 'Afternoon Tea',
}
// Q2 look fallback (used only when Q4 was skipped somehow)
const LOOK_FALLBACK: Record<number, string> = {
  2: 'Framboise',
  1: 'Caramel',
  3: 'Afternoon Tea',
}

function findByName(name: string): DBProduct | undefined {
  return productStore.rawProducts.find(
    p => p.name.toLowerCase() === name.toLowerCase()
  )
}

function routeIdOf(p: DBProduct): number {
  return Math.max(0, [...productStore.rawProducts]
    .filter(x => x.category === p.category)
    .sort((a, b) => a.sort_order - b.sort_order)
    .findIndex(x => x.id === p.id))
}

// ── Recommendation — index-based, language-independent ───────────────────
interface QuizResult { product: DBProduct; routeId: number }

const result = computed<QuizResult | null>(() => {
  const shadeIdx = answers.value[3]
  const lookIdx  = answers.value[1]

  // Shade choice (Q4) is the primary driver
  const shadeName = SHADE_TO_NAME[shadeIdx]
  let product = shadeName ? findByName(shadeName) : undefined

  // Fallback: derive from look (Q2)
  if (!product) {
    const fallbackName = LOOK_FALLBACK[lookIdx]
    product = fallbackName ? findByName(fallbackName) : undefined
  }

  // Last resort: first product in the store
  if (!product) product = productStore.rawProducts[0]
  if (!product) return null

  return { product, routeId: routeIdOf(product) }
})

const displayPrice = computed(() => {
  if (!result.value) return ''
  const p = result.value.product
  return `${p.final_price ?? p.price} TND`
})

const progress = computed(() => Math.min(100, (step.value / TOTAL) * 100))

onMounted(() => { if (!productStore.loaded) productStore.fetchProducts() })
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color:#FDF6EE;">
    <NavigationGlobal color="k-black" />

    <main class="flex-1 flex flex-col items-center justify-center px-4 py-16">

      <!-- Header -->
      <div v-if="step < TOTAL" class="w-full max-w-lg mb-2 text-center">
        <h1 class="font-great-vibes text-5xl mb-1" style="color:#3D2B1F;">{{ langStore.t.quiz.title }}</h1>
        <p class="text-xs opacity-50" style="color:#3D2B1F;">{{ langStore.t.quiz.subtitle }}</p>
      </div>

      <!-- Progress bar -->
      <div v-if="step < TOTAL" class="w-full max-w-lg mb-8">
        <div class="flex justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#9B86A8;">{{ step + 1 }} / {{ TOTAL }}</span>
          <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#C4828A;">✦</span>
        </div>
        <div class="h-1 w-full rounded-full overflow-hidden" style="background-color:#f0ebe3;">
          <div
            class="h-full rounded-full transition-all duration-500"
            style="background:linear-gradient(90deg,#C4828A,#9B86A8);"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Quiz card -->
      <Transition :name="direction === 'forward' ? 'slide-fwd' : 'slide-back'" mode="out-in">

        <!-- Question card -->
        <div
          v-if="step < TOTAL"
          :key="'q-' + step"
          class="w-full max-w-lg rounded-3xl bg-white px-8 py-10 shadow-sm"
          style="border:1px solid #f0ebe3;"
        >
          <div class="h-2 w-2 rounded-full mb-6 mx-auto" style="background-color:#C4828A;"></div>

          <h2 class="text-center text-xl font-bold mb-8 leading-snug" style="color:#3D2B1F;">
            {{ questions[step].q }}
          </h2>

          <div class="flex flex-col gap-3 mb-8">
            <button
              v-for="(opt, idx) in questions[step].options"
              :key="idx"
              @click="select(idx)"
              class="quiz-option rounded-2xl border px-5 py-3.5 text-sm font-semibold text-left transition-all duration-200"
              :class="answers[step] === idx ? 'option-active' : ''"
            >
              {{ opt }}
            </button>
          </div>

          <div class="flex items-center justify-between">
            <button
              v-if="step > 0"
              @click="prev"
              class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition hover:opacity-60"
              style="color:#9B86A8;"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {{ langStore.t.quiz.back }}
            </button>
            <div v-else></div>

            <button
              @click="next"
              :disabled="answers[step] === -1"
              class="inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-40"
              style="background-color:#C4828A; color:#ffffff;"
            >
              {{ step === TOTAL - 1 ? langStore.t.quiz.seeResult : langStore.t.quiz.next }}
              <svg v-if="step < TOTAL - 1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Result card -->
        <div
          v-else
          key="result"
          class="w-full max-w-lg rounded-3xl bg-white shadow-sm overflow-hidden text-center"
          style="border:1px solid #f0ebe3;"
        >
          <!-- Product image banner -->
          <div
            v-if="result"
            class="w-full flex items-center justify-center py-8"
            style="background:linear-gradient(160deg,#FFF9F4,#FDF0EA);"
          >
            <img
              :src="result.product.src"
              :alt="result.product.name"
              class="h-44 object-contain drop-shadow-md"
            />
          </div>

          <div class="px-8 py-8">
            <p class="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style="color:#9B86A8;">
              {{ langStore.t.quiz.result }}
            </p>

            <template v-if="result">
              <h1 class="font-great-vibes text-6xl mb-1 leading-none" style="color:#3D2B1F;">
                {{ result.product.name }}
              </h1>
              <p class="text-xs font-bold uppercase tracking-[0.22em] mb-6" style="color:#C4828A;">
                ✦ {{ result.product.subheader }} ✦
              </p>

              <div class="h-px w-16 mx-auto mb-5" style="background-color:#f0ebe3;"></div>

              <p class="text-sm leading-relaxed opacity-70 mb-5 max-w-xs mx-auto" style="color:#3D2B1F;">
                {{ result.product.description }}
              </p>

              <!-- Price (final_price if on sale) -->
              <div class="flex items-baseline justify-center gap-2 mb-8">
                <span
                  v-if="result.product.final_price"
                  class="text-base line-through opacity-35 font-semibold"
                  style="color:#3D2B1F;"
                >{{ result.product.price }} TND</span>
                <span class="text-2xl font-bold" style="color:#3D2B1F;">{{ displayPrice }}</span>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  @click="router.push({ name: result.product.category, params: { id: result.routeId } })"
                  class="rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 hover:shadow-lg"
                  style="background-color:#C4828A; color:#ffffff;"
                >
                  {{ langStore.t.quiz.addToBag }}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5 inline ml-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  @click="restart"
                  class="rounded-full border px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 hover:bg-[#FDF6EE]"
                  style="border-color:#C4828A; color:#C4828A;"
                >
                  {{ langStore.t.quiz.retake }}
                </button>
              </div>
            </template>

            <!-- Fallback while store loads -->
            <p v-else class="text-sm opacity-40 py-4" style="color:#3D2B1F;">Chargement…</p>
          </div>
        </div>

      </Transition>

    </main>

    <FooterGlobal />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.quiz-option {
  border-color: #f0ebe3;
  color: #3D2B1F;
  background: #ffffff;
}
.quiz-option:hover {
  border-color: #C4828A;
  color: #C4828A;
  background: #FFF5F6;
}
.option-active {
  border-color: #C4828A !important;
  color: #C4828A !important;
  background: #FFF0F1 !important;
  font-weight: 800;
}

.slide-fwd-enter-active { transition: all 0.3s ease; }
.slide-fwd-leave-active { transition: all 0.2s ease; }
.slide-fwd-enter-from   { opacity: 0; transform: translateX(40px); }
.slide-fwd-leave-to     { opacity: 0; transform: translateX(-40px); }

.slide-back-enter-active { transition: all 0.3s ease; }
.slide-back-leave-active { transition: all 0.2s ease; }
.slide-back-enter-from   { opacity: 0; transform: translateX(-40px); }
.slide-back-leave-to     { opacity: 0; transform: translateX(40px); }
</style>
