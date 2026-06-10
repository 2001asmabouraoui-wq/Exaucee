<script setup lang="ts">
import { ref, onMounted } from 'vue'

const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem('exaucee_cookie_consent')) {
    setTimeout(() => { visible.value = true }, 1200)
  }
})

function accept() {
  localStorage.setItem('exaucee_cookie_consent', 'accepted')
  visible.value = false
}

function decline() {
  localStorage.setItem('exaucee_cookie_consent', 'declined')
  visible.value = false
}
</script>

<template>
  <Transition name="cookie-slide">
    <div
      v-if="visible"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-lg mx-auto px-4"
    >
      <div class="rounded-2xl shadow-xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4" style="background:#3D2B1F; border:1px solid rgba(255,255,255,0.08);">
        <p class="text-xs leading-relaxed flex-1" style="color:rgba(255,255,255,0.75);">
          🍪 We use cookies to improve your experience on Exaucée. By continuing, you agree to our use of cookies.
        </p>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="decline"
            class="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition"
            style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.5);"
          >Decline</button>
          <button
            @click="accept"
            class="rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition"
            style="background:#C4828A; color:#fff; border:none;"
          >Accept</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-slide-enter-active { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
.cookie-slide-leave-active { transition: all 0.3s ease; }
.cookie-slide-enter-from  { opacity: 0; transform: translateX(-50%) translateY(20px); }
.cookie-slide-leave-to    { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
