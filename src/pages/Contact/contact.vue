<script setup lang="ts">
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'
import { useLangStore } from '../../pinia/langStore'

const langStore = useLangStore()
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none overflow-x-hidden" style="background-color:#ffffff;">

    <!-- Content layer -->
    <div class="relative z-10 w-full flex flex-col items-center">
      <AnnouncementBar />
      <Navigation color="k-black" />

      <main class="flex flex-col lg:flex-row items-center justify-center flex-grow px-4 py-16 gap-10 max-w-5xl mx-auto w-full">

        <!-- Map -->
        <div class="w-full lg:w-1/2 h-64 lg:h-80 rounded-2xl overflow-hidden shadow-sm" style="border:1px solid #f0ebe3;">
          <iframe
            class="w-full h-full"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3190.091224331797!2d10.181547315088845!3d36.80755507994401!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd3371ff39a2e1%3A0xf6c0e6a048a0f97a!2sTunis!5e0!3m2!1sen!2stn!4v1701234567890!5m2!1sen!2stn"
            style="border:0;"
            :allowfullscreen="true"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <!-- Contact info -->
        <div class="flex flex-col items-start text-left gap-5 w-full lg:w-1/2">
          <p class="text-xs font-bold uppercase tracking-[0.25em]" style="color:#3D2B1F;">{{ langStore.t.contact.tagline }}</p>
          <h1 class="font-great-vibes text-5xl drop-shadow-sm" style="color:#3D2B1F;">{{ langStore.t.contact.title }}</h1>
          <div class="flex items-center gap-3">
            <div class="h-px w-10 opacity-50" style="background-color:#3D2B1F;"></div>
            <span class="text-xs" style="color:#3D2B1F;">✦</span>
          </div>
          <p class="text-sm leading-relaxed opacity-75" style="color:#3D2B1F;">{{ langStore.t.contact.desc }}</p>
          <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold" style="color:#3D2B1F;">📍 Tunis, Tunisia</span>
            <span class="text-sm font-semibold" style="color:#3D2B1F;">📞 +216 XX XXX XXX</span>
            <span class="text-sm font-semibold" style="color:#3D2B1F;">✉️ hello@exaucee.tn</span>
          </div>
          <p class="text-xs opacity-50 italic" style="color:#3D2B1F;">{{ langStore.t.contact.replyTime }}</p>
        </div>

      </main>

      <Footer />
    </div>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
iframe { border-radius: 16px; }
</style>
