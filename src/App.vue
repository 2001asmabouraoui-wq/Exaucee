<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from './pinia/productStore'
import { useAuthStore }    from './pinia/authStore'
import { useCartStore }    from './pinia/cartStore'
import { useLangStore }    from './pinia/langStore'
import SpinWheel      from './components/SpinWheel.vue'
import CookieConsent  from './components/cookie-consent.vue'

const productStore = useProductStore()
const authStore    = useAuthStore()
const cartStore    = useCartStore()
const langStore    = useLangStore()
const route        = useRoute()

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'admin'

onMounted(() => {
  langStore.init()
  productStore.fetchProducts()
  authStore.initialize()
})

const isAdmin = computed(() => route.path.startsWith(`/${ADMIN_PATH}`))
</script>

<template>
  <div class="select-none font-Manrope">
    <router-view></router-view>
    <SpinWheel v-if="!isAdmin" />
    <CookieConsent v-if="!isAdmin" />

    <!-- WhatsApp floating button -->
    <a
      v-if="!isAdmin && !cartStore.showCart"
      href="https://wa.me/21694000000"
      target="_blank"
      rel="noopener noreferrer"
      class="wa-float fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-110"
      style="background-color:#25D366;"
      title="Chat with us"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.428a.5.5 0 00.609.64l5.79-1.521A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.027-1.381l-.36-.213-3.735.981.999-3.633-.235-.374A9.818 9.818 0 1112 21.818z"/>
      </svg>
    </a>
  </div>
</template>

<style>
@keyframes wa-pulse {
  0%, 100% { box-shadow: 0 0 0 0 #25D36644; }
  50%       { box-shadow: 0 0 0 8px transparent; }
}
.wa-float { animation: wa-pulse 2s infinite; }
</style>
