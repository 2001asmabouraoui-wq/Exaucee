<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore }     from '../../../pinia/cartStore'
import { useAuthStore }     from '../../../pinia/authStore'
import { useWishlistStore } from '../../../pinia/wishlistStore'
import { useLangStore }     from '../../../pinia/langStore'
import SkinToneGuide        from '../../../components/SkinToneGuide.vue'
import type { product }     from '../../../data/product-types'

const props = defineProps<{ item: product }>()
const router   = useRouter()
const cart     = useCartStore()
const auth     = useAuthStore()
const wishlist = useWishlistStore()
const lang     = useLangStore()
const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const translatedSubheader = computed(() =>
  (lang.t.productCatalog as Record<string, string>)[props.item.header.toLowerCase()] ?? props.item.subheader
)

// ── Images & zoom ────────────────────────────────────────
const images = computed(() => {
  const list = [props.item.src]
  if (props.item.altImage && props.item.altImage !== props.item.src) {
    list.push(props.item.altImage)
  }
  return list
})
const currentImg = ref(0)
const zoomOpen   = ref(false)
const zoomedSrc  = computed(() => images.value[currentImg.value])

// ── Shade selector ───────────────────────────────────────
const selectedShade  = ref<string | null>(null)
const showShadeGuide = ref(false)

// ── Options ──────────────────────────────────────────────
const selectedOptions = ref<Record<string, boolean>>({})
props.item.options?.forEach(opt => { selectedOptions.value[opt.name] = false })

// ── Price ────────────────────────────────────────────────
const isOnSale = computed(() => !!props.item.finalPrice && props.item.finalPrice < props.item.price)
const displayPrice = computed(() => {
  let base = isOnSale.value ? props.item.finalPrice! : props.item.price
  props.item.options?.forEach(opt => {
    if (selectedOptions.value[opt.name]) base += opt.price
  })
  return base.toFixed(2)
})

// ── Cart ─────────────────────────────────────────────────
const addedToCart = ref(false)
function addToCart() {
  cart.addToCart({ ...props.item, finalPrice: parseFloat(displayPrice.value), selectedOptions: { ...selectedOptions.value } })
  addedToCart.value = true
  setTimeout(() => { addedToCart.value = false }, 1800)
}

// ── Wishlist ─────────────────────────────────────────────
const wishlistMsg  = ref('')
const isWishlisted = computed(() => wishlist.isWishlisted(props.item.header))

async function toggleWishlist() {
  if (!auth.isLoggedIn) {
    wishlistMsg.value = lang.t.product.signInToWishlist
    setTimeout(() => { wishlistMsg.value = '' }, 2500)
    return
  }
  await wishlist.toggle(props.item.header, auth.authHeaders())
}

// ── Notify me ────────────────────────────────────────────
const notifyEmail  = ref('')
const notifyStatus = ref<'idle' | 'loading' | 'sent' | 'error'>('idle')

async function submitNotify() {
  if (!notifyEmail.value.trim()) return
  notifyStatus.value = 'loading'
  try {
    const res = await fetch(`${apiUrl}/api/restock-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id:   props.item.header,
        product_name: props.item.header,
        email:        notifyEmail.value.trim(),
      }),
    })
    notifyStatus.value = res.ok ? 'sent' : 'error'
  } catch {
    notifyStatus.value = 'error'
  }
}

// ── Reviews ──────────────────────────────────────────────
interface Review {
  id: number; name: string; rating: number
  comment: string; created_at: string; image_url?: string | null
}

const reviews        = ref<Review[]>([])
const reviewsLoading = ref(true)
const avgRating      = computed(() =>
  reviews.value.length
    ? reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
    : 0
)

async function loadReviews() {
  try {
    const res = await fetch(`${apiUrl}/api/reviews?product_id=${encodeURIComponent(props.item.header)}`)
    if (res.ok) {
      const data = await res.json()
      reviews.value = Array.isArray(data) ? data : []
    }
  } catch { /* non-critical */ }
  reviewsLoading.value = false
}

const showReviewForm  = ref(false)
const reviewName      = ref('')
const reviewEmail     = ref('')
const reviewRating    = ref(0)
const reviewComment   = ref('')
const reviewSubmitted = ref(false)
const reviewError     = ref('')
const reviewSending   = ref(false)

async function submitReview() {
  reviewError.value = ''
  if (!reviewName.value || !reviewEmail.value || !reviewRating.value || !reviewComment.value) {
    reviewError.value = lang.t.product.reviewError
    return
  }
  reviewSending.value = true
  try {
    const res = await fetch(`${apiUrl}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: props.item.header,
        name:       reviewName.value,
        email:      reviewEmail.value,
        rating:     reviewRating.value,
        comment:    reviewComment.value,
      }),
    })
    if (res.ok) {
      reviewSubmitted.value = true
      reviewName.value = reviewEmail.value = reviewComment.value = ''
      reviewRating.value = 0
    } else {
      reviewError.value = lang.t.product.serverError
    }
  } catch {
    reviewError.value = lang.t.product.networkError
  } finally {
    reviewSending.value = false
  }
}

onMounted(async () => {
  if (auth.isLoggedIn) {
    notifyEmail.value = auth.user?.email ?? ''
    await wishlist.load(auth.authHeaders())
  }
  await loadReviews()
})
</script>

<template>
  <section class="w-full max-w-5xl mx-auto px-4 py-12 font-Manrope">

    <!-- Back -->
    <button
      @click="router.back()"
      class="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition hover:opacity-60"
      style="color:#9B86A8;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      {{ lang.t.product.back }}
    </button>

    <!-- ── Main card ── -->
    <div class="flex flex-col lg:flex-row rounded-2xl overflow-hidden bg-white" style="border:1px solid #f0ebe3;">

      <!-- Image side -->
      <div class="lg:w-1/2 flex flex-col items-center justify-center gap-5 p-10 bg-white">
        <div
          class="relative group cursor-zoom-in"
          @click="zoomOpen = true"
        >
          <img
            :src="images[currentImg]"
            :alt="item.header"
            class="w-64 sm:w-80 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            :class="currentImg === 0 ? 'product-float' : ''"
            style="max-height:320px;"
          />
          <!-- zoom hint -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity rounded-full bg-white p-1.5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4" style="color:#3D2B1F;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </div>
        </div>
        <!-- Dots -->
        <div class="flex gap-2">
          <button
            v-for="(_, i) in images"
            :key="i"
            @click="currentImg = i"
            class="rounded-full transition-all duration-300"
            :style="i === currentImg
              ? 'background:#C4828A; width:20px; height:10px;'
              : 'background:#C4828A44; width:10px; height:10px;'"
          />
        </div>
      </div>

      <!-- Info side -->
      <div class="lg:w-1/2 flex flex-col gap-5 p-10">

        <!-- New badge -->
        <span v-if="item.nu" class="self-start rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white" style="background:#C4828A;">
          {{ lang.t.product.new }}
        </span>

        <!-- Name -->
        <h1 class="font-great-vibes text-6xl leading-none" style="color:#3D2B1F;">{{ item.header }}</h1>

        <!-- Subheader -->
        <p class="text-xs font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">{{ translatedSubheader }}</p>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="h-px w-10 opacity-30" style="background:#9B86A8;"></div>
          <span style="color:#9B86A8; font-size:0.75rem;">✦</span>
          <div class="h-px w-10 opacity-30" style="background:#9B86A8;"></div>
        </div>

        <!-- Description -->
        <p class="text-sm leading-relaxed opacity-70 max-w-sm" style="color:#3D2B1F;">{{ item.text }}</p>

        <!-- Shade selector -->
        <div v-if="item.shades && item.shades.length" class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <p class="text-[10px] font-bold uppercase tracking-widest" style="color:#9B86A8;">
              {{ lang.t.product.shade }}<span v-if="selectedShade"> — {{ selectedShade }}</span>
            </p>
            <button
              @click="showShadeGuide = true"
              class="text-[9px] font-bold uppercase tracking-widest underline transition hover:opacity-60"
              style="color:#9B86A8;"
            >{{ lang.t.product.shadeGuide }}</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="shade in item.shades"
              :key="shade.name"
              @click="selectedShade = selectedShade === shade.name ? null : shade.name"
              class="h-7 w-7 rounded-full border-2 transition-all duration-200 hover:scale-110"
              :style="{
                backgroundColor: shade.hex,
                borderColor: selectedShade === shade.name ? '#3D2B1F' : 'transparent',
                boxShadow: selectedShade === shade.name
                  ? '0 0 0 2px #fff, 0 0 0 4px #3D2B1F'
                  : '0 1px 4px rgba(0,0,0,0.15)',
              }"
              :title="shade.name"
            />
          </div>
        </div>

        <!-- Options -->
        <div v-if="item.options && item.options.length" class="flex flex-col gap-2">
          <p class="text-[10px] font-bold uppercase tracking-widest" style="color:#9B86A8;">{{ lang.t.product.options }}</p>
          <label
            v-for="(opt, i) in item.options"
            :key="i"
            class="flex items-center gap-2 cursor-pointer text-sm"
            style="color:#3D2B1F;"
          >
            <input type="checkbox" v-model="selectedOptions[opt.name]" class="accent-rose-400" />
            {{ opt.name }}
            <span v-if="opt.price > 0" class="opacity-50"> (+{{ opt.price }} TND)</span>
          </label>
        </div>

        <!-- Out of stock — Notify Me -->
        <div v-if="item.in_stock === false" class="flex flex-col gap-3 mt-2">
          <div v-if="notifyStatus === 'sent'" class="rounded-xl p-3 text-center text-xs font-semibold" style="background:#D6E9DC; color:#5A9E8A;">
            {{ lang.t.product.notifySuccess }}
          </div>
          <template v-else>
            <p class="text-xs font-bold uppercase tracking-widest" style="color:#C4828A;">{{ lang.t.product.notifyMe }}</p>
            <div class="flex gap-2">
              <input
                v-model="notifyEmail"
                type="email"
                :placeholder="lang.t.product.notifyPlaceholder"
                class="flex-1 rounded-full border px-4 py-2 text-xs outline-none"
                style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
              />
              <button
                @click="submitNotify"
                :disabled="notifyStatus === 'loading'"
                class="rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60 flex-shrink-0"
                style="background:#9B86A8; color:#fff; border:none;"
              >{{ notifyStatus === 'loading' ? '…' : lang.t.product.notify }}</button>
            </div>
            <p v-if="notifyStatus === 'error'" class="text-xs" style="color:#f87171;">{{ lang.t.product.serverError }}</p>
          </template>
        </div>

        <!-- Price + Cart + Wishlist -->
        <div v-else class="flex items-center gap-4 flex-wrap mt-2">

          <!-- Price (with sale support) -->
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold" style="color:#3D2B1F;">{{ displayPrice }} TND</p>
            <p v-if="isOnSale" class="text-sm line-through opacity-40" style="color:#3D2B1F;">{{ item.price }} TND</p>
            <span v-if="isOnSale" class="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white" style="background:#C4828A;">{{ lang.t.product.sale }}</span>
          </div>

          <!-- Add to cart -->
          <button
            @click="addToCart"
            class="inline-flex items-center gap-2 rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
            :style="addedToCart
              ? 'background:#5A9E8A; color:#fff; border:1px solid #5A9E8A;'
              : 'background:transparent; color:#C4828A; border:1px solid #C4828A;'"
          >
            <svg v-if="!addedToCart" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {{ addedToCart ? lang.t.product.added : lang.t.product.addToCart }}
          </button>

          <!-- Wishlist -->
          <div class="relative">
            <button
              @click="toggleWishlist"
              class="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300"
              :style="isWishlisted
                ? 'background:#C4828A; border:1px solid #C4828A;'
                : 'background:transparent; border:1px solid #C4828A;'"
              :title="isWishlisted ? lang.t.product.removeFromWishlist : lang.t.product.saveToWishlist"
            >
              <span class="text-base leading-none" :style="isWishlisted ? 'color:#fff;' : 'color:#C4828A;'">
                {{ isWishlisted ? '♥' : '♡' }}
              </span>
            </button>
            <Transition name="fade-tip">
              <span
                v-if="wishlistMsg"
                class="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[9px] font-bold shadow"
                style="background:#3D2B1F; color:#FDF6EE;"
              >{{ wishlistMsg }}</span>
            </Transition>
          </div>
        </div>

        <!-- Features -->
        <div v-if="item.features" class="mt-1">
          <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color:#9B86A8;">{{ lang.t.product.formula }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="feat in item.features.split('·').map(f => f.trim()).filter(Boolean)"
              :key="feat"
              class="rounded-full px-3 py-1 text-[10px] font-semibold"
              style="background:#FFF0F2; color:#C4828A; border:1px solid #F7D9E0;"
            >{{ feat }}</span>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Reviews ── -->
    <div class="mt-8 rounded-2xl bg-white px-6 py-8" style="border:1px solid #f0ebe3;">

      <!-- Header -->
      <div class="mb-6 flex flex-col gap-1">
        <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">{{ lang.t.product.reviews }}</p>
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="font-great-vibes text-4xl" style="color:#3D2B1F;">{{ lang.t.product.whatTheySay }}</h2>
          <div v-if="reviews.length" class="flex items-center gap-1">
            <span
              v-for="s in 5" :key="s"
              class="text-base"
              :style="s <= Math.round(avgRating) ? 'color:#C4828A;' : 'color:#f0ebe3;'"
            >★</span>
            <span class="ml-1 text-xs font-bold opacity-60" style="color:#3D2B1F;">
              {{ avgRating.toFixed(1) }} ({{ reviews.length }})
            </span>
          </div>
        </div>
      </div>

      <!-- Review list -->
      <div v-if="reviewsLoading" class="text-xs opacity-40 mb-6" style="color:#3D2B1F;">{{ lang.t.product.loadingReviews }}</div>
      <div v-else-if="!reviews.length" class="text-xs opacity-40 mb-6" style="color:#3D2B1F;">{{ lang.t.product.noReviews }}</div>
      <div v-else class="flex flex-col gap-4 mb-6">
        <div
          v-for="r in reviews"
          :key="r.id"
          class="rounded-xl p-4"
          style="background:#FDF6EE; border:1px solid #f0ebe3;"
        >
          <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div
                class="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style="background:linear-gradient(135deg,#C4828A,#9B86A8);"
              >{{ r.name.slice(0,1).toUpperCase() }}</div>
              <span class="text-xs font-bold" style="color:#3D2B1F;">{{ r.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span v-for="s in 5" :key="s" class="text-sm" :style="s <= r.rating ? 'color:#C4828A;' : 'color:#f0ebe3;'">★</span>
              <span class="ml-1 text-[10px] opacity-50" style="color:#3D2B1F;">
                {{ new Date(r.created_at).toLocaleDateString('fr-FR') }}
              </span>
            </div>
          </div>
          <p class="text-sm leading-relaxed" style="color:#3D2B1F;">{{ r.comment }}</p>
          <img
            v-if="r.image_url"
            :src="r.image_url"
            alt="Photo avis"
            class="mt-3 max-h-48 rounded-xl object-cover cursor-zoom-in"
            @click.stop="zoomOpen = true; currentImg = -1"
          />
        </div>
      </div>

      <!-- Write review toggle -->
      <button
        @click="showReviewForm = !showReviewForm; reviewSubmitted = false"
        class="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
        style="border-color:#C4828A; color:#C4828A;"
        onmouseover="this.style.background='#C4828A'; this.style.color='#fff';"
        onmouseout="this.style.background='transparent'; this.style.color='#C4828A';"
      >
        {{ showReviewForm ? lang.t.product.closeReview : lang.t.product.writeReview }}
      </button>

      <!-- Review form -->
      <Transition name="slide-down">
        <div v-if="showReviewForm" class="mt-4 rounded-xl p-5" style="background:#FDF6EE; border:1px solid #f0ebe3;">

          <div v-if="reviewSubmitted" class="text-center py-4">
            <p class="text-sm font-semibold mb-1" style="color:#5A9E8A;">{{ lang.t.product.reviewPending }}</p>
            <p class="text-xs opacity-60" style="color:#3D2B1F;">{{ lang.t.product.reviewPendingText }}</p>
          </div>

          <form v-else @submit.prevent="submitReview" class="flex flex-col gap-3">
            <div class="flex gap-3 flex-col sm:flex-row">
              <input
                v-model="reviewName"
                type="text"
                :placeholder="lang.t.product.yourName"
                class="flex-1 rounded-full border px-3 py-2 text-xs outline-none"
                style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
              />
              <input
                v-model="reviewEmail"
                type="email"
                :placeholder="lang.t.product.yourEmail"
                class="flex-1 rounded-full border px-3 py-2 text-xs outline-none"
                style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
              />
            </div>

            <!-- Star picker -->
            <div class="flex items-center gap-1">
              <span class="text-xs mr-2 opacity-60" style="color:#3D2B1F;">{{ lang.t.product.rating }}</span>
              <button
                v-for="s in 5" :key="s"
                type="button"
                @click="reviewRating = s"
                class="text-xl transition-transform hover:scale-125"
                :style="s <= reviewRating ? 'color:#C4828A;' : 'color:#f0ebe3;'"
              >★</button>
            </div>

            <textarea
              v-model="reviewComment"
              rows="3"
              :placeholder="lang.t.product.yourComment"
              class="rounded-xl border px-3 py-2 text-xs outline-none resize-none"
              style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
            ></textarea>

            <p v-if="reviewError" class="text-xs" style="color:#f87171;">{{ reviewError }}</p>

            <button
              type="submit"
              :disabled="reviewSending"
              class="self-start rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60"
              style="background:#C4828A; color:#fff; border:none;"
            >{{ reviewSending ? lang.t.product.sendingReview : lang.t.product.submitReview }}</button>
          </form>
        </div>
      </Transition>
    </div>

  </section>

  <!-- ── Zoom overlay ── -->
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div
        v-if="zoomOpen"
        class="fixed inset-0 z-[350] flex items-center justify-center"
        style="background:rgba(61,43,31,0.88);"
        @click="zoomOpen = false"
      >
        <button
          @click="zoomOpen = false"
          class="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-full text-sm font-bold transition hover:bg-white/20"
          style="color:#fff;"
        >✕</button>
        <img
          :src="zoomedSrc"
          :alt="item.header"
          class="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          @click.stop
        />
      </div>
    </Transition>
  </Teleport>

  <!-- ── Shade guide ── -->
  <SkinToneGuide v-if="showShadeGuide" @close="showShadeGuide = false" />
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.fade-tip-enter-active, .fade-tip-leave-active { transition: opacity 0.2s; }
.fade-tip-enter-from, .fade-tip-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.2s ease; }
.slide-down-leave-active  { transition: all 0.15s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.zoom-fade-enter-active, .zoom-fade-leave-active { transition: all 0.2s ease; }
.zoom-fade-enter-from, .zoom-fade-leave-to { opacity: 0; }
</style>
