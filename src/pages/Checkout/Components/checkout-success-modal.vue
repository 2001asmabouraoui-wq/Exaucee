<script setup lang="ts">
import { useCartStore } from '../../../pinia/cartStore.ts'
import { useFormStore } from '../../../pinia/formStore'
import { useLangStore } from '../../../pinia/langStore'
import { onBeforeMount, onBeforeUnmount } from 'vue'

const cartStore = useCartStore()
const formStore = useFormStore()
const langStore = useLangStore()

const handleClose = () => {
  cartStore.clearCart()
  formStore.bannerOff()
}

onBeforeMount(() => { if (formStore.showBanner) document.body.classList.add('overflow-y-hidden') })
onBeforeUnmount(() => { document.body.classList.remove('overflow-y-hidden') })
</script>

<template>
  <Transition name="modal-fade">
    <div class="fixed inset-0 z-50 flex items-center justify-center px-4" data-test="checkout-success-modal">

      <!-- Overlay -->
      <router-link to="/" @click="handleClose()" class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <!-- Modal card -->
      <div class="relative z-10 w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl" style="border:1px solid #f0ebe3;">

        <!-- Check icon -->
        <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-full mx-auto" style="background-color:#FDEEF1;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="#C4828A" class="h-7 w-7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 class="font-great-vibes text-4xl text-center mb-1" style="color:#3D2B1F;">{{ langStore.t.checkout.successTitle }}</h2>
        <p class="text-xs text-center uppercase tracking-widest mb-1 font-bold" style="color:#9B86A8;">{{ langStore.t.checkout.orderConfirmed }}</p>
        <p class="text-xs text-center opacity-60 mb-8" style="color:#3D2B1F;">{{ langStore.t.checkout.emailSent }}</p>

        <!-- First item preview -->
        <div class="flex items-center gap-4 rounded-xl p-4 mb-3" style="background-color:#FFF9F4; border:1px solid #f0ebe3;">
          <div class="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-lg bg-white">
            <img class="w-12 h-12 object-contain" :src="cartStore.getFirstItem.product.src" alt="" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-great-vibes text-xl leading-tight truncate" style="color:#3D2B1F;">{{ cartStore.getFirstItem.product.header }}</p>
            <p class="text-xs font-bold opacity-60" style="color:#3D2B1F;">{{ cartStore.getFirstItem.product.price }} TND</p>
          </div>
          <span class="text-xs font-bold opacity-50 flex-shrink-0" style="color:#3D2B1F;">×{{ cartStore.getFirstItem.amount }}</span>
        </div>

        <p v-if="cartStore.getUniqueItems > 1" class="text-xs text-center opacity-50 mb-6" style="color:#3D2B1F;">
          + {{ cartStore.getUniqueItems - 1 }} {{ cartStore.getUniqueItems > 2 ? langStore.t.checkout.otherItems : langStore.t.checkout.otherItem }}
        </p>

        <!-- Grand total -->
        <div class="flex justify-between items-center py-3 mb-8" style="border-top:1px solid #f0ebe3; border-bottom:1px solid #f0ebe3;">
          <p class="text-xs font-black uppercase tracking-widest" style="color:#3D2B1F;">{{ langStore.t.checkout.grandTotal }}</p>
          <p class="text-lg font-black" style="color:#C4828A;">{{ cartStore.getGrandTotal }} TND</p>
        </div>

        <!-- Back to home -->
        <router-link
          to="/"
          @click="handleClose()"
          class="home-btn w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300"
          data-test="checkout-success-modal-button"
        >
          {{ langStore.t.checkout.backToHome }}
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

.home-btn { background-color: #C4828A; color: #ffffff; }
.home-btn:hover { background-color: #A85560; box-shadow: 0 10px 25px -5px rgba(196,130,138,0.4); }

.modal-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.96); }
</style>
