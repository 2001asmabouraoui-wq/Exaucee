<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCartStore } from '../../../pinia/cartStore.ts'
import { useFormStore } from '../../../pinia/formStore.ts'
import { useLangStore } from '../../../pinia/langStore'
import { usePerkStore } from '../../../pinia/perkStore'
import { usePackagingStore } from '../../../pinia/packagingStore'
import SummaryItem from './checkout-summary-item.vue'

const cartStore      = useCartStore()
const formStore      = useFormStore()
const langStore      = useLangStore()
const perkStore      = usePerkStore()
const packagingStore = usePackagingStore()

onMounted(() => packagingStore.fetchPrice())

const earnedGifts = computed(() =>
  perkStore.giftPerks.filter(p => cartStore.cartValue >= p.threshold)
)

const THRESHOLD_IDX: Record<number, number> = { 50: 0, 100: 1, 150: 2, 0: 3 }
function localGiftName(threshold: number, fallback: string): string {
  const idx = THRESHOLD_IDX[threshold]
  if (idx === undefined) return fallback
  const p = langStore.t.landing.perks[idx] as { giftName?: string }
  return p?.giftName || fallback
}
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const couponInput   = ref('')
const couponLoading = ref(false)
const couponError   = ref('')
const couponSuccess = ref('')

// ── Loyalty points ──────────────────────────────────
const loyaltyBalance  = ref<number | null>(null)
const loyaltyFetching = ref(false)
const useLoyalty      = ref(false)

const maxRedeemablePoints = computed(() => {
  if (!loyaltyBalance.value || loyaltyBalance.value <= 0) return 0
  // 10 pts = 1 TND, cap at 20% of cart total
  const fromBalance = loyaltyBalance.value
  const maxFromTotal = Math.floor(cartStore.getGrandTotal * 0.2 * 10)
  return Math.min(fromBalance, maxFromTotal)
})

const loyaltyDiscount = computed(() =>
  useLoyalty.value ? Number((maxRedeemablePoints.value / 10).toFixed(2)) : 0
)

watch(loyaltyDiscount, (val) => {
  formStore.loyaltyDiscount = val
  formStore.loyaltyPointsRedeemed = useLoyalty.value ? maxRedeemablePoints.value : 0
})

async function fetchLoyaltyBalance() {
  const email = formStore.email.trim()
  if (!email || loyaltyFetching.value) return
  loyaltyFetching.value = true
  try {
    const res = await fetch(`${apiUrl}/api/loyalty/balance?email=${encodeURIComponent(email)}`)
    if (res.ok) {
      const data = await res.json()
      loyaltyBalance.value = data.balance ?? 0
    }
  } catch { /* non-critical */ } finally {
    loyaltyFetching.value = false
  }
}

// Fetch balance when email becomes valid
watch(() => formStore.email, (email) => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fetchLoyaltyBalance()
  else loyaltyBalance.value = null
})
// ────────────────────────────────────────────────────

async function applyCoupon() {
  couponError.value = couponSuccess.value = ''
  if (!couponInput.value.trim()) return
  couponLoading.value = true
  try {
    const res = await fetch(`${apiUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: couponInput.value.trim().toUpperCase(),
        cart_total: cartStore.cartValue,
      }),
    })
    const data = await res.json()
    if (data.valid) {
      cartStore.applyCoupon({
        code: couponInput.value.trim().toUpperCase(),
        type: data.type,
        discount: data.discount_amount,
        message: data.message,
      })
      couponSuccess.value = data.message
      couponInput.value = ''
    } else {
      couponError.value = data.message || 'Invalid coupon code.'
    }
  } catch {
    couponError.value = 'Could not validate coupon.'
  } finally {
    couponLoading.value = false
  }
}

function removeCoupon() {
  cartStore.removeCoupon()
  couponSuccess.value = couponError.value = ''
}
</script>

<template>
  <div
    class="col-span-1 flex h-fit w-full flex-col rounded-2xl bg-white px-6 py-8 lg:self-start"
    style="border:1px solid #f0ebe3;"
    data-test="checkout-summary"
  >
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-1">
      <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">{{ langStore.t.checkout.yourOrder }}</p>
      <h2 class="font-great-vibes text-4xl" style="color:#3D2B1F;">{{ langStore.t.checkout.summary }}</h2>
    </div>

    <!-- Items -->
    <div class="mb-6 flex flex-col gap-3 overflow-y-auto max-h-64">
      <SummaryItem
        v-for="(value, _, index) in cartStore.cart"
        :cart-item="value.product"
        :item-count="value.amount"
        :key="index"
      />
    </div>

    <!-- Earned gifts -->
    <div v-if="earnedGifts.length > 0" class="mb-5 rounded-xl px-4 py-3" style="background:#F0FAF4; border:1px solid #A8D8BB;">
      <p class="text-[9px] font-black uppercase tracking-widest mb-2" style="color:#5A9E8A;">{{ langStore.t.checkout.giftsEarned }}</p>
      <div v-for="g in earnedGifts" :key="g.id" class="flex items-center gap-2 mb-1 last:mb-0">
        <span>{{ g.emoji }}</span>
        <p class="flex-1 text-xs font-semibold" style="color:#3D2B1F;">{{ localGiftName(g.threshold, g.giftName) }}</p>
        <span class="text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5" style="background:#D6E9DC; color:#5A9E8A;">{{ langStore.t.checkout.freeGift }}</span>
      </div>
    </div>

    <!-- Coupon section -->
    <div class="mb-4">
      <!-- Applied coupon pill -->
      <div v-if="cartStore.coupon" class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style="background-color:#22c55e;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {{ cartStore.coupon.code }}
        </span>
        <button @click="removeCoupon" class="text-xs opacity-50 hover:opacity-80 transition" style="color:#3D2B1F;" title="Remove coupon">✕</button>
      </div>
      <p v-if="couponSuccess && cartStore.coupon" class="text-xs mb-2 font-semibold" style="color:#22c55e;">{{ couponSuccess }}</p>

      <!-- Coupon input row -->
      <div v-if="!cartStore.coupon" class="flex gap-2">
        <input
          v-model="couponInput"
          type="text"
          :placeholder="langStore.t.checkout.couponPlaceholder"
          @keyup.enter="applyCoupon"
          class="flex-1 rounded-full border px-3 py-2 text-xs uppercase tracking-widest outline-none transition focus:border-[#C4828A]"
          style="border-color:#f0ebe3; color:#3D2B1F;"
        />
        <button
          @click="applyCoupon"
          :disabled="couponLoading"
          class="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-60"
          style="background-color:#C4828A; color:#ffffff;"
        >
          {{ couponLoading ? '…' : langStore.t.checkout.applyCoupon }}
        </button>
      </div>
      <p v-if="couponError" class="mt-1.5 text-xs" style="color:#f87171;">{{ couponError }}</p>
    </div>

    <div class="h-px w-full mb-5" style="background-color:#f0ebe3;"></div>

    <!-- Totals -->
    <div class="flex flex-col gap-2 mb-6">
      <div class="flex justify-between text-sm">
        <p class="opacity-60 uppercase tracking-widest text-xs font-semibold" style="color:#3D2B1F;">{{ langStore.t.checkout.subtotal }}</p>
        <p class="font-bold" style="color:#3D2B1F;">{{ cartStore.cartValue }} TND</p>
      </div>
      <div class="flex justify-between text-sm items-center">
        <p class="opacity-60 uppercase tracking-widest text-xs font-semibold" style="color:#3D2B1F;">{{ langStore.t.checkout.shipping }}</p>
        <div class="flex items-center gap-2">
          <span
            v-if="cartStore.coupon?.type === 'free_shipping'"
            class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white"
            style="background-color:#22c55e;"
          >{{ langStore.t.checkout.free }}</span>
          <p
            class="font-bold"
            :class="(cartStore.cartValue > cartStore.freeShippingThreshold || cartStore.coupon?.type === 'free_shipping') ? 'line-through opacity-40' : ''"
            style="color:#3D2B1F;"
          >{{ cartStore.shipping }} TND</p>
        </div>
      </div>

      <!-- Discount line -->
      <div
        v-if="cartStore.coupon && cartStore.coupon.type !== 'free_shipping'"
        class="flex justify-between text-sm"
      >
        <p class="opacity-60 uppercase tracking-widest text-xs font-semibold" style="color:#3D2B1F;">{{ langStore.t.checkout.discount }}</p>
        <p class="font-bold" style="color:#22c55e;">-{{ cartStore.coupon.discount }} TND</p>
      </div>

      <!-- Gift wrap line -->
      <div v-if="formStore.giftWrap" class="flex justify-between text-sm">
        <p class="opacity-60 uppercase tracking-widest text-xs font-semibold" style="color:#3D2B1F;">🎀 {{ langStore.t.checkout.giftWrapLine }}</p>
        <p class="font-bold" style="color:#3D2B1F;">+{{ packagingStore.price }} TND</p>
      </div>

      <!-- Loyalty discount line -->
      <div v-if="formStore.loyaltyDiscount > 0" class="flex justify-between text-sm">
        <p class="opacity-60 uppercase tracking-widest text-xs font-semibold" style="color:#3D2B1F;">✦ {{ langStore.t.checkout.loyaltyLine }}</p>
        <p class="font-bold" style="color:#C9A45A;">−{{ formStore.loyaltyDiscount.toFixed(2) }} TND</p>
      </div>

      <div class="h-px w-full my-2" style="background-color:#f0ebe3;"></div>

      <div class="flex justify-between">
        <p class="font-black uppercase tracking-widest text-xs" style="color:#3D2B1F;">{{ langStore.t.checkout.grandTotal }}</p>
        <p class="text-lg font-black" style="color:#C4828A;">
          {{ Math.max(0, cartStore.getGrandTotal + (formStore.giftWrap ? packagingStore.price : 0) - formStore.loyaltyDiscount).toFixed(2) }} TND
        </p>
      </div>
    </div>

    <!-- Gift wrap toggle -->
    <label class="flex items-center gap-3 mb-3 cursor-pointer rounded-xl px-4 py-3 transition hover:bg-[#FFF9F4]" style="border:1px solid #f0ebe3;">
      <input type="checkbox" v-model="formStore.giftWrap" class="accent-rose-400 h-4 w-4 flex-shrink-0" />
      <div>
        <p class="text-xs font-bold" style="color:#3D2B1F;">🎀 {{ langStore.t.checkout.giftWrapLine }} (+{{ packagingStore.price }} TND)</p>
        <p class="text-[10px] opacity-50 mt-0.5" style="color:#3D2B1F;">{{ langStore.t.checkout.giftWrapDesc }}</p>
      </div>
    </label>

    <!-- Loyalty points toggle -->
    <div v-if="loyaltyBalance !== null && loyaltyBalance > 0" class="mb-5">
      <label class="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 transition hover:bg-[#FFF9F4]" :style="useLoyalty ? 'border:1px solid #C9A45A; background:#FFFBF4;' : 'border:1px solid #f0ebe3;'">
        <input type="checkbox" v-model="useLoyalty" class="h-4 w-4 flex-shrink-0 accent-amber-500" />
        <div class="flex-1">
          <p class="text-xs font-bold" style="color:#3D2B1F;">✦ {{ langStore.t.checkout.loyaltyUse }} {{ maxRedeemablePoints }} {{ langStore.t.checkout.loyaltyPts }} (−{{ loyaltyDiscount.toFixed(2) }} TND)</p>
          <p class="text-[10px] opacity-50 mt-0.5" style="color:#3D2B1F;">{{ langStore.t.checkout.loyaltyBal }}: {{ loyaltyBalance }} pts · 10 pts = 1 TND · {{ langStore.t.checkout.loyaltyMaxOff }}</p>
        </div>
      </label>
    </div>
    <div v-else-if="loyaltyFetching" class="mb-5 text-[10px] opacity-40 text-center" style="color:#3D2B1F;">{{ langStore.t.checkout.checkingLoyalty }}</div>

    <!-- Pay button -->
    <p v-if="formStore.submitError" class="text-xs text-center mb-3" style="color:#f87171;">
      {{ formStore.submitError }}
    </p>
    <button
      @click="formStore.submit()"
      :disabled="formStore.isSubmitting"
      class="pay-btn w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      data-test="checkout-button"
    >
      <svg v-if="formStore.isSubmitting" class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <span>{{ formStore.isSubmitting ? langStore.t.checkout.placingOrder : langStore.t.checkout.continuePay }}</span>
      <svg v-if="!formStore.isSubmitting" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.pay-btn {
  background-color: #C4828A;
  color: #ffffff;
}
.pay-btn:hover {
  background-color: #A85560;
  box-shadow: 0 10px 25px -5px rgba(196,130,138,0.4);
}
</style>
