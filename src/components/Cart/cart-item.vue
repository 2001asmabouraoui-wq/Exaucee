<script setup lang="ts">
import { product } from '../../data/product-types.ts'
import { useCartStore } from '../../pinia/cartStore.ts'
import { useLangStore } from '../../pinia/langStore'

const cartStore = useCartStore()
const langStore = useLangStore()

const props = defineProps<{
  cartItem: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }
  itemCount: number
}>()

function onQtyChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val >= 1) cartStore.setQuantity(props.cartItem, val)
  else (e.target as HTMLInputElement).value = String(props.itemCount)
}
</script>

<template>
  <div
    v-if="itemCount > 0"
    class="flex items-center gap-4 px-6 py-4"
    style="border-bottom:1px solid #f0ebe3;"
  >
    <!-- Image -->
    <div class="flex-shrink-0 rounded-xl overflow-hidden w-16 h-16 flex items-center justify-center" style="background-color:#FFF9F4;">
      <img
        class="w-14 h-14 object-contain"
        :src="props.cartItem.src"
        :alt="props.cartItem.header"
      />
    </div>

    <!-- Info -->
    <div class="flex flex-1 flex-col gap-0.5 min-w-0">
      <p class="font-great-vibes text-xl leading-tight truncate" style="color:#3D2B1F;">{{ props.cartItem.header }}</p>
      <p class="text-xs font-bold" style="color:#3D2B1F;">{{ props.cartItem.finalPrice ?? props.cartItem.price }} TND</p>
      <!-- Packaging always included for this product -->
      <span
        v-if="props.cartItem.packaging === 'included'"
        class="mt-0.5 self-start text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5"
        style="background:#FFF0F5; color:#C4828A; border:1px solid rgba(196,130,138,0.25);"
      >🎀 {{ langStore.t.cart.packagingBadge }}</span>
    </div>

    <!-- Qty controls -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <button
        @click="cartStore.removeFromCart(props.cartItem)"
        class="qty-btn"
        aria-label="Decrease"
      >−</button>
      <input
        type="number"
        :value="props.itemCount"
        min="1"
        @change="onQtyChange"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
        class="qty-input"
        aria-label="Quantity"
      />
      <button
        @click="cartStore.addToCart(props.cartItem)"
        class="qty-btn"
        aria-label="Increase"
      >+</button>
    </div>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 1px solid #C4828A;
  color: #C4828A;
  font-size: 0.85rem;
  font-weight: 700;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
}
.qty-btn:hover {
  background: #C4828A;
  color: #ffffff;
}

.qty-input {
  width: 2.4rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #3D2B1F;
  background: transparent;
  border: 1px solid #f0ebe3;
  border-radius: 6px;
  padding: 2px 4px;
  outline: none;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.qty-input:focus { border-color: #C4828A; }
</style>
