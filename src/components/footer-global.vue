<script setup lang="ts">
import { ref } from 'vue'
import deliveryIcon  from '/icons/delivery.png'
import twitterIcon   from '/icons/twitter.png'
import instagramIcon from '/icons/instagram.png'
import { useLangStore } from '../pinia/langStore'

const langStore = useLangStore()

const email     = ref('')
const name      = ref('')
const subStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const subMsg    = ref('')

async function subscribe() {
  if (!email.value.trim()) return
  subStatus.value = 'loading'
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), name: name.value.trim() }),
    })
    if (res.ok) {
      subStatus.value = 'success'
      subMsg.value = langStore.t.footer.subscribeSuccess
      email.value = name.value = ''
    } else {
      subStatus.value = 'error'
      subMsg.value = langStore.t.footer.subscribeError
    }
  } catch {
    subStatus.value = 'error'
    subMsg.value = langStore.t.footer.subscribeError
  }
}
</script>

<template>
  <footer class="relative flex w-full flex-col items-center text-ex-brown" style="background-color:#ffffff;">

    <div class="w-full h-px bg-ex-gold opacity-30"></div>

    <div class="w-4/5 max-w-6xl flex flex-col items-center py-10">

      <router-link to="/" class="font-great-vibes text-4xl text-ex-rose transition duration-300 hover:scale-105 hover:text-ex-sage">
        Exaucée
      </router-link>
      <p class="mt-1 text-xs italic text-ex-gold tracking-widest">{{ langStore.t.footer.tagline }}</p>

      <div class="mt-6 flex items-center gap-3">
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-sm">✦</span>
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
      </div>

      <!-- Newsletter -->
      <div class="mt-8 w-full max-w-md flex flex-col items-center gap-3">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60" style="color:#3D2B1F;">{{ langStore.t.footer.stayInKnow }}</p>
        <div v-if="subStatus !== 'success'" class="flex w-full gap-2 flex-wrap justify-center">
          <input
            v-model="name"
            type="text"
            :placeholder="langStore.t.footer.yourName"
            class="newsletter-input w-28 flex-shrink-0"
          />
          <input
            v-model="email"
            type="email"
            :placeholder="langStore.t.footer.yourEmail"
            class="newsletter-input flex-1 min-w-40"
            @keyup.enter="subscribe"
          />
          <button
            @click="subscribe"
            :disabled="subStatus === 'loading' || !email.trim()"
            class="subscribe-btn flex-shrink-0"
          >
            {{ subStatus === 'loading' ? langStore.t.footer.subscribing : langStore.t.footer.subscribe }}
          </button>
        </div>
        <p
          v-if="subMsg"
          class="text-xs font-semibold"
          :style="{ color: subStatus === 'success' ? '#5A9E8A' : '#f87171' }"
        >{{ subMsg }}</p>
      </div>

      <div class="mt-6 flex items-center gap-3">
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-sm">✦</span>
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
      </div>

      <!-- Quick links -->
      <nav class="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest">
        <router-link to="/track"   class="footer-link">{{ langStore.t.footer.trackOrder }}</router-link>
        <router-link to="/faq"     class="footer-link">{{ langStore.t.footer.faq }}</router-link>
        <router-link to="/bundles" class="footer-link">{{ langStore.t.footer.bundles }}</router-link>
        <router-link to="/about"   class="footer-link">{{ langStore.t.footer.about }}</router-link>
        <router-link to="/contact" class="footer-link">{{ langStore.t.footer.contact }}</router-link>
      </nav>

      <div class="mt-5 flex items-center gap-3">
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-sm">✦</span>
        <div class="h-px w-12 bg-ex-gold opacity-40"></div>
      </div>

      <nav class="mt-5 flex flex-row items-center gap-5">
        <a href="#" aria-label="Delivery"  class="transition hover:-translate-y-0.5 hover:opacity-60"><img loading="lazy" :src="deliveryIcon"  alt="Delivery"  class="h-8 w-8 object-contain" /></a>
        <a href="#" aria-label="TikTok"    class="transition hover:-translate-y-0.5 hover:opacity-60"><img loading="lazy" :src="twitterIcon"   alt="TikTok"    class="h-5 w-5 object-contain" /></a>
        <a href="#" aria-label="Instagram" class="transition hover:-translate-y-0.5 hover:opacity-60"><img loading="lazy" :src="instagramIcon" alt="Instagram" class="h-5 w-5 object-contain" /></a>
      </nav>

      <p class="mt-5 text-center text-xs tracking-wide opacity-40">{{ langStore.t.footer.rights }}</p>
    </div>
  </footer>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
.newsletter-input {
  border: 1px solid #f0ebe3; border-radius: 20px;
  padding: 8px 14px; font-size: 12px; color: #3D2B1F;
  outline: none; background: #fff;
}
.newsletter-input:focus { border-color: #C4828A; }
.subscribe-btn {
  background: #C4828A; color: #fff; border: none;
  padding: 8px 18px; border-radius: 20px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.subscribe-btn:hover:not(:disabled) { background: #A85560; }
.subscribe-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.footer-link { color:#9B86A8; text-decoration:none; transition:color .2s; }
.footer-link:hover { color:#C4828A; }
</style>
