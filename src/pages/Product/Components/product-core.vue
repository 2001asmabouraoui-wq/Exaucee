<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { product, ProductOption } from '../../../data/product-types.ts'
import { useCartStore } from '../../../pinia/cartStore.ts'
import { useWishlistStore } from '../../../pinia/wishlistStore.ts'
import { useAuthStore } from '../../../pinia/authStore.ts'
import { useLangStore } from '../../../pinia/langStore'
import { useRouter } from 'vue-router'
import SkinToneGuide from '../../../components/SkinToneGuide.vue'

const cartStore     = useCartStore()
const wishlistStore = useWishlistStore()
const auth          = useAuthStore()
const langStore     = useLangStore()
const router        = useRouter()

const props = defineProps<{ item: product }>()

// ── Image zoom ──────────────────────────────────────
const zoomOpen = ref(false)
const zoomedReviewImg = ref<string | null>(null)

// ── Shade guide popup ────────────────────────────────
const showShadeGuide = ref(false)

// ── Shade selector ────────────────────────────────────
const selectedShade = ref<string | null>(null)

// ── Notify Me (back-in-stock) ─────────────────────────
const notifyEmail   = ref(auth.user?.email ?? '')
const notifyStatus  = ref<'idle' | 'loading' | 'sent' | 'error'>('idle')

const selectedOptions = ref<Record<string, boolean>>({})
props.item.options?.forEach((opt: ProductOption) => {
  selectedOptions.value[opt.name] = false
})

const computedPrice = computed(() => {
  let price = props.item.price
  props.item.options?.forEach(opt => {
    if (selectedOptions.value[opt.name]) price += opt.price
  })
  return price.toFixed(2)
})

function addToCart() {
  cartStore.addToCart({
    ...props.item,
    selectedOptions: { ...selectedOptions.value },
    finalPrice: parseFloat(computedPrice.value),
  })
}

const images = ref([props.item.src, props.item.altImage])
const currentIndex = ref(0)

// ── Wishlist ──────────────────────────────────────────
const wishlistMsg = ref('')
const isWishlisted = computed(() => wishlistStore.isWishlisted(props.item.header))

async function toggleWishlist() {
  if (!auth.isLoggedIn) {
    wishlistMsg.value = langStore.t.product.signInToWishlist
    setTimeout(() => { wishlistMsg.value = '' }, 2500)
    return
  }
  await wishlistStore.toggle(props.item.header, auth.authHeaders())
}

// ── Reviews ───────────────────────────────────────────
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  created_at: string
  image_url?: string | null
}

const reviews        = ref<Review[]>([])
const reviewsLoading = ref(true)

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
})

async function loadReviews() {
  try {
    const res = await fetch(`${apiUrl}/api/reviews?product_id=${encodeURIComponent(props.item.header)}`)
    if (res.ok) {
      const data = await res.json()
      reviews.value = Array.isArray(data) ? data : data.reviews ?? []
    }
  } catch { /* non-critical */ }
  reviewsLoading.value = false
}

// Write-review form
const showReviewForm    = ref(false)
const reviewName        = ref('')
const reviewEmail       = ref('')
const reviewRating      = ref(0)
const reviewComment     = ref('')
const reviewSubmitted   = ref(false)
const reviewError       = ref('')
const reviewSending     = ref(false)
const reviewImageFile   = ref<File | null>(null)
const reviewImagePreview= ref('')
const reviewImageUrl    = ref('')
const reviewImageLoading= ref(false)
const reviewFileInput   = ref<HTMLInputElement | null>(null)

async function onReviewImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  reviewImageFile.value    = file
  reviewImagePreview.value = URL.createObjectURL(file)
  reviewImageLoading.value = true
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const ext = file.name.split('.').pop() || 'jpg'
    const res = await fetch(`${apiUrl}/api/upload/review-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, contentType: file.type, ext }),
    })
    if (res.ok) {
      const data = await res.json()
      reviewImageUrl.value = data.url
    }
  } catch { /* non-critical — image won't be attached */ } finally {
    reviewImageLoading.value = false
  }
}

async function submitReview() {
  reviewError.value = ''
  if (!reviewName.value || !reviewEmail.value || !reviewRating.value || !reviewComment.value) {
    reviewError.value = langStore.t.product.reviewError
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
        image_url:  reviewImageUrl.value || undefined,
      }),
    })
    if (res.ok) {
      reviewSubmitted.value    = true
      reviewName.value         = reviewEmail.value = reviewComment.value = ''
      reviewRating.value       = 0
      reviewImageFile.value    = null
      reviewImagePreview.value = ''
      reviewImageUrl.value     = ''
    } else {
      reviewError.value = langStore.t.product.reviewError
    }
  } catch {
    reviewError.value = langStore.t.product.reviewError
  } finally {
    reviewSending.value = false
  }
}

async function submitNotify() {
  if (!notifyEmail.value.trim()) return
  notifyStatus.value = 'loading'
  try {
    const res = await fetch(`${apiUrl}/api/restock-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: props.item.header,
        product_name: props.item.header,
        email: notifyEmail.value.trim(),
      }),
    })
    notifyStatus.value = res.ok ? 'sent' : 'error'
  } catch {
    notifyStatus.value = 'error'
  }
}

onMounted(async () => {
  if (auth.isLoggedIn) {
    await wishlistStore.load(auth.authHeaders())
    notifyEmail.value = auth.user?.email ?? ''
  }
  await loadReviews()
})
</script>

<template>
  <section class="w-full max-w-5xl mx-auto px-4 py-12">

    <!-- Back link -->
    <button
      @click="router.back()"
      class="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 back-btn"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      {{ langStore.t.product.back }}
    </button>

    <!-- One card wrapping image + details -->
    <div class="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden bg-white" style="border:1px solid #f0ebe3;">

      <!-- Image side -->
      <div class="flex flex-col items-center justify-center gap-4 p-10 lg:w-1/2">
        <div class="relative group cursor-zoom-in" @click="zoomOpen = true" title="Click to zoom">
          <img
            :src="images[currentIndex]"
            :alt="item.header"
            class="w-72 sm:w-96 object-contain product-float drop-shadow-md transition-transform duration-200 group-hover:scale-105"
          />
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity rounded-full bg-white p-1.5 shadow-sm">
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
            @click="currentIndex = i"
            class="rounded-full transition-all duration-300"
            :class="i === currentIndex ? 'w-6 h-2' : 'w-2 h-2'"
            :style="i === currentIndex ? { backgroundColor: '#C4828A' } : { backgroundColor: '#C4828A44' }"
          />
        </div>
      </div>

      <!-- Details side -->
      <div class="flex flex-col items-center text-center lg:items-start lg:text-start gap-4 p-10 lg:w-1/2">

        <span
          v-if="item.nu"
          class="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
          style="background-color:#C4828A;"
        >{{ langStore.t.product.new }}</span>

        <h1 class="font-great-vibes text-6xl leading-none drop-shadow-sm" style="color:#3D2B1F;">
          {{ item.header }}
        </h1>
        <p class="text-xs font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">
          {{ item.subheader }}
        </p>

        <div class="flex items-center gap-3 self-center lg:self-start">
          <div class="h-px w-10 opacity-40" style="background-color:#9B86A8;"></div>
          <span class="text-sm" style="color:#9B86A8;">✦</span>
          <div class="h-px w-10 opacity-40" style="background-color:#9B86A8;"></div>
        </div>

        <p class="text-sm leading-relaxed opacity-70 max-w-sm" style="color:#3D2B1F;">{{ item.text }}</p>

        <!-- Shade selector -->
        <div v-if="item.shades?.length" class="flex flex-col gap-2 self-center lg:self-start">
          <div class="flex items-center gap-3">
            <p class="text-[10px] font-bold uppercase tracking-widest" style="color:#9B86A8;">
              Shade<span v-if="selectedShade"> — {{ selectedShade }}</span>
            </p>
            <button
              @click="showShadeGuide = true"
              class="text-[9px] font-bold uppercase tracking-widest underline transition hover:opacity-60"
              style="color:#9B86A8;"
            >Guide</button>
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
                boxShadow: selectedShade === shade.name ? '0 0 0 2px #fff, 0 0 0 4px #3D2B1F' : '0 1px 4px rgba(0,0,0,0.15)',
              }"
              :title="shade.name"
            />
          </div>
        </div>

        <!-- Options -->
        <div v-if="item.options?.length" class="flex flex-col gap-2 self-start">
          <label
            v-for="(opt, i) in item.options"
            :key="i"
            class="flex items-center gap-2 cursor-pointer text-sm"
            style="color:#3D2B1F;"
          >
            <input type="checkbox" v-model="selectedOptions[opt.name]" class="accent-rose-400" />
            {{ opt.name }}<span v-if="opt.price > 0" class="opacity-60"> (+{{ opt.price }} TND)</span>
          </label>
        </div>

        <!-- Out of stock — Notify Me -->
        <div v-if="item.in_stock === false" class="mt-2 w-full self-center lg:self-start">
          <div v-if="notifyStatus === 'sent'" class="rounded-xl p-3 text-center text-xs font-semibold" style="background:#D6E9DC; color:#5A9E8A;">
            ✓ We'll email you when it's back!
          </div>
          <div v-else class="flex flex-col gap-2">
            <p class="text-xs font-bold uppercase tracking-widest" style="color:#C4828A;">Out of stock — Notify me when available</p>
            <div class="flex gap-2">
              <input
                v-model="notifyEmail"
                type="email"
                placeholder="Your email"
                class="flex-1 rounded-full border px-4 py-2 text-xs outline-none transition"
                style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
              />
              <button
                @click="submitNotify"
                :disabled="notifyStatus === 'loading'"
                class="rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60 flex-shrink-0"
                style="background:#9B86A8; color:#fff;"
              >{{ notifyStatus === 'loading' ? '…' : 'Notify Me' }}</button>
            </div>
            <p v-if="notifyStatus === 'error'" class="text-xs" style="color:#f87171;">Something went wrong. Try again.</p>
          </div>
        </div>

        <!-- Price + Add to cart + Wishlist -->
        <div class="mt-4 flex items-center gap-3 flex-wrap">
          <p class="text-2xl font-bold" style="color:#3D2B1F;">{{ computedPrice }} TND</p>
          <button
            v-if="item.in_stock !== false"
            @click="addToCart"
            class="add-to-cart-btn inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
          >
            {{ langStore.t.product.addToCart }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <!-- Wishlist heart button -->
          <div class="relative">
            <button
              @click="toggleWishlist"
              class="wish-btn flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
              :class="isWishlisted ? 'wish-active' : ''"
              :title="isWishlisted ? langStore.t.product.removeFromWishlist : langStore.t.product.saveToWishlist"
            >
              <span class="text-base leading-none" :style="isWishlisted ? 'color:#ffffff;' : 'color:#C4828A;'">
                {{ isWishlisted ? '♥' : '♡' }}
              </span>
            </button>
            <Transition name="fade-tip">
              <span
                v-if="wishlistMsg"
                class="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold shadow"
                style="background:#3D2B1F; color:#FDF6EE;"
              >{{ wishlistMsg }}</span>
            </Transition>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Reviews ───────────────────────────────────── -->
    <div class="mt-8 rounded-2xl bg-white px-6 py-8" style="border:1px solid #f0ebe3;">

      <!-- Header row -->
      <div class="mb-6 flex flex-col gap-1">
        <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">{{ langStore.t.product.reviews }}</p>
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="font-great-vibes text-4xl" style="color:#3D2B1F;">{{ langStore.t.product.whatTheySay }}</h2>
          <div v-if="reviews.length" class="flex items-center gap-1">
            <template v-for="s in 5" :key="s">
              <span class="text-base" :style="s <= Math.round(avgRating) ? 'color:#C4828A;' : 'color:#f0ebe3;'">★</span>
            </template>
            <span class="ml-1 text-xs font-bold opacity-60" style="color:#3D2B1F;">{{ avgRating.toFixed(1) }} ({{ reviews.length }})</span>
          </div>
        </div>
      </div>

      <!-- Reviews list -->
      <div v-if="reviewsLoading" class="text-xs opacity-50 mb-6" style="color:#3D2B1F;">{{ langStore.t.product.loadingReviews }}</div>
      <div v-else-if="reviews.length === 0" class="text-xs opacity-50 mb-6" style="color:#3D2B1F;">{{ langStore.t.product.noReviews }}</div>
      <div v-else class="flex flex-col gap-4 mb-6">
        <div
          v-for="r in reviews"
          :key="r.id"
          class="rounded-xl p-4"
          style="background-color:#FDF6EE; border:1px solid #f0ebe3;"
        >
          <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style="background:linear-gradient(135deg,#C4828A,#9B86A8);">
                {{ r.name.slice(0,1).toUpperCase() }}
              </div>
              <span class="text-xs font-bold" style="color:#3D2B1F;">{{ r.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <template v-for="s in 5" :key="s">
                <span class="text-sm" :style="s <= r.rating ? 'color:#C4828A;' : 'color:#f0ebe3;'">★</span>
              </template>
              <span class="ml-1 text-[10px] opacity-50" style="color:#3D2B1F;">{{ new Date(r.created_at).toLocaleDateString('fr-FR') }}</span>
            </div>
          </div>
          <p class="text-sm leading-relaxed" style="color:#3D2B1F;">{{ r.comment }}</p>
          <img
            v-if="r.image_url"
            :src="r.image_url"
            alt="Review photo"
            class="mt-3 max-h-48 rounded-xl object-cover cursor-zoom-in"
            @click.stop="zoomedReviewImg = r.image_url; zoomOpen = true"
          />
        </div>
      </div>

      <!-- Write a review -->
      <div>
        <button
          @click="showReviewForm = !showReviewForm; reviewSubmitted = false"
          class="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 hover:bg-[#C4828A] hover:text-white hover:border-[#C4828A]"
          style="border-color:#C4828A; color:#C4828A;"
        >
          {{ showReviewForm ? langStore.t.product.closeReview : langStore.t.product.writeReview }}
        </button>

        <Transition name="slide-down">
          <div v-if="showReviewForm" class="mt-4 rounded-xl p-5" style="background-color:#FDF6EE; border:1px solid #f0ebe3;">

            <div v-if="reviewSubmitted" class="text-center py-4">
              <p class="text-sm font-semibold mb-1" style="color:#22c55e;">{{ langStore.t.product.reviewPending }}</p>
              <p class="text-xs opacity-60" style="color:#3D2B1F;">{{ langStore.t.product.reviewPendingText }}</p>
            </div>

            <form v-else @submit.prevent="submitReview" class="flex flex-col gap-3">
              <div class="flex gap-3 flex-col sm:flex-row">
                <input
                  v-model="reviewName"
                  type="text"
                  :placeholder="langStore.t.product.yourName"
                  class="flex-1 rounded-full border px-3 py-2 text-xs outline-none transition focus:border-[#C4828A]"
                  style="border-color:#f0ebe3; color:#3D2B1F;"
                />
                <input
                  v-model="reviewEmail"
                  type="email"
                  :placeholder="langStore.t.product.yourEmail"
                  class="flex-1 rounded-full border px-3 py-2 text-xs outline-none transition focus:border-[#C4828A]"
                  style="border-color:#f0ebe3; color:#3D2B1F;"
                />
              </div>

              <!-- Star rating selector -->
              <div class="flex items-center gap-1">
                <span class="text-xs mr-2 opacity-60" style="color:#3D2B1F;">{{ langStore.t.product.rating }}</span>
                <button
                  v-for="s in 5"
                  :key="s"
                  type="button"
                  @click="reviewRating = s"
                  class="text-xl transition-transform hover:scale-125"
                  :style="s <= reviewRating ? 'color:#C4828A;' : 'color:#f0ebe3;'"
                >★</button>
              </div>

              <textarea
                v-model="reviewComment"
                rows="3"
                :placeholder="langStore.t.product.yourComment"
                class="rounded-xl border px-3 py-2 text-xs outline-none resize-none transition focus:border-[#C4828A]"
                style="border-color:#f0ebe3; color:#3D2B1F;"
              ></textarea>

              <!-- Photo upload -->
              <div class="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  @click="reviewFileInput?.click()"
                  class="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition hover:border-[#C4828A] hover:text-[#C4828A]"
                  style="border-color:#f0ebe3; color:#9B86A8;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-3 w-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {{ reviewImageLoading ? 'Uploading…' : 'Add photo' }}
                </button>
                <input ref="reviewFileInput" type="file" accept="image/*" class="hidden" @change="onReviewImageChange" />
                <img v-if="reviewImagePreview" :src="reviewImagePreview" class="h-12 w-12 rounded-lg object-cover" />
                <button v-if="reviewImagePreview" type="button" @click="reviewImagePreview = ''; reviewImageUrl = ''; reviewImageFile = null" class="text-[10px] opacity-50 hover:opacity-80" style="color:#C4828A;">✕</button>
              </div>

              <p v-if="reviewError" class="text-xs" style="color:#f87171;">{{ reviewError }}</p>

              <button
                type="submit"
                :disabled="reviewSending || reviewImageLoading"
                class="self-start rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60"
                style="background-color:#C4828A; color:#ffffff;"
              >{{ reviewSending ? langStore.t.product.sendingReview : langStore.t.product.submitReview }}</button>
            </form>
          </div>
        </Transition>
      </div>
    </div>

  </section>

  <!-- ── Zoom overlay ─────────────────────────────── -->
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div
        v-if="zoomOpen"
        class="fixed inset-0 z-[350] flex items-center justify-center"
        style="background:rgba(61,43,31,0.85);"
        @click="zoomOpen = false; zoomedReviewImg = null"
      >
        <button
          @click="zoomOpen = false; zoomedReviewImg = null"
          class="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-full text-sm font-bold transition hover:bg-white/20"
          style="color:#fff;"
        >✕</button>
        <img
          :src="zoomedReviewImg ?? images[currentIndex]"
          :alt="item.header"
          class="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          @click.stop
        />
      </div>
    </Transition>
  </Teleport>

  <!-- ── Shade guide ───────────────────────────────── -->
  <SkinToneGuide v-if="showShadeGuide" @close="showShadeGuide = false" />
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.back-btn { color: #9CA3AF; }
.back-btn:hover { color: #6B7280; }

.add-to-cart-btn {
  border: 1px solid #C4828A;
  color: #C4828A;
  background: transparent;
}
.add-to-cart-btn:hover {
  background: #C4828A;
  color: #ffffff;
  border-color: #C4828A;
}

.wish-btn {
  border: 1px solid #C4828A;
  background: transparent;
}
.wish-btn:hover, .wish-active {
  background: #C4828A;
  border-color: #C4828A;
}

.fade-tip-enter-active, .fade-tip-leave-active { transition: opacity 0.2s ease; }
.fade-tip-enter-from, .fade-tip-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.2s ease; }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.zoom-fade-enter-active, .zoom-fade-leave-active { transition: all 0.2s ease; }
.zoom-fade-enter-from, .zoom-fade-leave-to { opacity: 0; }
</style>
