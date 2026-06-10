<script setup lang="ts">
import { computed, onMounted } from 'vue'
import CartItem from './cart-item.vue'
import { useCartStore } from '../../pinia/cartStore.ts'
import { useLangStore } from '../../pinia/langStore'
import { usePerkStore } from '../../pinia/perkStore'
import { useFormStore } from '../../pinia/formStore'
import { usePackagingStore } from '../../pinia/packagingStore'

const cartStore      = useCartStore()
const langStore      = useLangStore()
const perkStore      = usePerkStore()
const formStore      = useFormStore()
const packagingStore = usePackagingStore()

const earnedGifts = computed(() =>
  perkStore.giftPerks.filter(p => cartStore.cartValue >= p.threshold)
)

const nextGift = computed(() => {
  const unearned = perkStore.giftPerks.filter(p => cartStore.cartValue < p.threshold)
  return unearned.length > 0 ? unearned[0] : null
})

// Returns the locale-translated gift name for a perk, falling back to the admin-set name
const THRESHOLD_IDX: Record<number, number> = { 50: 0, 100: 1, 150: 2, 0: 3 }
function localGiftName(threshold: number, fallback: string): string {
  const idx = THRESHOLD_IDX[threshold]
  if (idx === undefined) return fallback
  const p = langStore.t.landing.perks[idx] as { giftName?: string }
  return p?.giftName || fallback
}

// Whether any cart item already has packaging included for free
const hasIncludedItem = computed(() =>
  Object.values(cartStore.cart).some(ci => ci.product.packaging === 'included')
)
// Whether there are items that don't have packaging included (need the toggle)
const hasOptionalItems = computed(() =>
  Object.values(cartStore.cart).some(ci => ci.product.packaging !== 'included')
)

onMounted(() => packagingStore.fetchPrice())
</script>

<template>
  <!-- Overlay: fades in place — completely separate from the panel slide -->
  <Transition name="overlay-fade">
    <div
      v-if="cartStore.showCart"
      class="fixed inset-0 z-50 bg-black/25 backdrop-blur-[3px]"
      @click="cartStore.cartOff()"
      data-test="cart-background"
    />
  </Transition>

  <!-- Panel: slides in from the right independently -->
  <Transition name="cart-slide">
    <div
      v-if="cartStore.showCart"
      class="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-white"
      style="border-left:1px solid #f0ebe3; box-shadow:-8px 0 40px rgba(0,0,0,0.12);"
      data-test="cart-modal"
    >

        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-7 pb-5" style="border-bottom:1px solid #f0ebe3;">
          <div class="flex items-center gap-3">
            <h2 class="font-great-vibes text-3xl" style="color:#C4828A;">{{ langStore.t.cart.title }}</h2>
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
              style="background-color:#C4828A;"
            >{{ cartStore.cartLength }}</span>
          </div>
          <button
            @click="cartStore.cartOff()"
            class="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
            data-test="cart-close-button"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4 text-gray-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-if="cartStore.cartLength === 0"
          class="flex flex-1 flex-col items-center justify-center gap-3 opacity-50"
        >
          <span class="text-4xl">🛒</span>
          <p class="text-sm font-semibold uppercase tracking-widest" style="color:#3D2B1F;">{{ langStore.t.cart.empty }}</p>
        </div>

        <!-- Items -->
        <div
          v-else
          class="flex flex-1 flex-col gap-0 overflow-y-auto py-2"
          data-test="cart-item-container"
        >
          <CartItem
            v-for="(value, key) in cartStore.cart"
            :cart-item="value.product"
            :item-count="value.amount"
            :key="key"
          />
        </div>

        <!-- Earned gifts -->
        <div v-if="earnedGifts.length > 0 && cartStore.cartLength > 0" class="mx-4 mb-2 rounded-xl px-4 py-3" style="background:#F0FAF4; border:1px solid #A8D8BB;">
          <p class="text-[9px] font-black uppercase tracking-widest mb-2" style="color:#5A9E8A;">{{ langStore.t.cart.giftsEarned }}</p>
          <div v-for="g in earnedGifts" :key="g.id" class="flex items-center gap-2.5 mb-1 last:mb-0">
            <span class="text-lg">{{ g.emoji }}</span>
            <div class="flex-1">
              <p class="text-xs font-bold" style="color:#3D2B1F;">{{ localGiftName(g.threshold, g.giftName) }}</p>
            </div>
            <span class="text-[9px] font-black tracking-widest rounded-full px-2 py-0.5 uppercase" style="background:#D6E9DC; color:#5A9E8A;">{{ langStore.t.cart.freeGift }}</span>
          </div>
        </div>

        <!-- Next gift progress nudge -->
        <div v-else-if="nextGift && cartStore.cartLength > 0" class="mx-4 mb-2 rounded-xl px-4 py-3" style="background:#FFF9F4; border:1px solid #f0ebe3;">
          <p class="text-[10px]" style="color:#9B86A8;">
            {{ nextGift.emoji }} {{ langStore.t.cart.nudgePre }} <strong style="color:#C4828A;">{{ nextGift.threshold - cartStore.cartValue }} TND</strong> {{ langStore.t.cart.nudgePost }} {{ nextGift.subText }}
          </p>
        </div>

        <!-- Footer -->
        <div v-if="cartStore.cartLength > 0" class="px-6 py-6" style="border-top:1px solid #f0ebe3;">

          <!-- Delete all -->
          <button
            @click="cartStore.clearCart()"
            class="mb-4 text-xs font-semibold uppercase tracking-widest opacity-40 transition hover:opacity-70"
            style="color:#3D2B1F;"
            data-test="cart-delete-all"
          >{{ langStore.t.cart.removeAll }}</button>

          <!-- Packaging section -->
          <!-- All items include packaging → just show a note -->
          <div
            v-if="hasIncludedItem && !hasOptionalItems"
            class="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style="background:#FFF0F5; border:1px solid rgba(196,130,138,0.2);"
          >
            <span class="text-base">🎀</span>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest" style="color:#C4828A;">{{ langStore.t.cart.packagingIncluded }}</p>
              <p class="text-[10px] opacity-55 mt-0.5" style="color:#3D2B1F;">{{ langStore.t.cart.packagingIncludedSub }}</p>
            </div>
          </div>
          <!-- Some items have optional packaging → show toggle -->
          <label
            v-else-if="hasOptionalItems"
            class="mb-4 flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 transition"
            :style="formStore.giftWrap
              ? 'background:#FFF0F5; border:1px solid rgba(196,130,138,0.35);'
              : 'background:transparent; border:1px solid #f0ebe3;'"
          >
            <input type="checkbox" v-model="formStore.giftWrap" class="h-4 w-4 flex-shrink-0 accent-rose-400" />
            <div class="flex-1">
              <p class="text-xs font-bold" style="color:#3D2B1F;">🎀 {{ langStore.t.cart.packagingLabel }} (+{{ packagingStore.price }} TND)</p>
              <p class="text-[10px] opacity-50 mt-0.5" style="color:#3D2B1F;">{{ langStore.t.cart.packagingDesc }}</p>
            </div>
          </label>

          <!-- Total -->
          <div class="flex items-center justify-between mb-5">
            <p class="text-xs font-bold uppercase tracking-widest opacity-60" style="color:#3D2B1F;">{{ langStore.t.cart.total }}</p>
            <p class="text-xl font-bold" style="color:#3D2B1F;">
              {{ (cartStore.cartValue + (formStore.giftWrap && hasOptionalItems ? packagingStore.price : 0)).toFixed(2) }} TND
            </p>
          </div>

          <!-- Checkout button -->
          <router-link
            to="/checkout"
            @click="cartStore.cartOff()"
            class="checkout-btn w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300"
            data-test="cart-checkout-button"
          >
            {{ langStore.t.cart.checkout }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </router-link>
        </div>

    </div>
  </Transition>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.checkout-btn {
  background-color: #C4828A;
  color: #ffffff;
}
.checkout-btn:hover {
  background-color: #A85560;
  box-shadow: 0 10px 25px -5px rgba(196,130,138,0.4);
}

/* Overlay fades in/out smoothly */
.overlay-fade-enter-active { transition: opacity 0.3s ease; }
.overlay-fade-leave-active { transition: opacity 0.22s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to     { opacity: 0; }

/* Panel slides in with a spring feel, out faster */
.cart-slide-enter-active {
  transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.cart-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.55, 0, 1, 0.45);
  will-change: transform;
}
.cart-slide-enter-from,
.cart-slide-leave-to { transform: translateX(100%); }
</style>
