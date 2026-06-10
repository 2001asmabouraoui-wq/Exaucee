<script setup lang="ts">
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'
import { useLangStore } from '../../pinia/langStore'

const langStore = useLangStore()
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none" style="background-color:#ffffff;">

    <!-- Content layer -->
    <div class="relative z-10 w-full flex flex-col items-center">
      <AnnouncementBar />
      <Navigation color="k-black" />

      <main class="flex flex-col items-center flex-grow px-4 py-16 gap-12 max-w-5xl mx-auto w-full">

        <!-- Page header -->
        <div class="flex flex-col items-center">
          <p class="text-xs font-bold uppercase tracking-[0.25em] mb-3" style="color:#3D2B1F;">{{ langStore.t.about.tagline }}</p>
          <h1 class="font-great-vibes text-6xl text-center drop-shadow-sm" style="color:#3D2B1F;">{{ langStore.t.about.title }}</h1>
          <div class="mt-4 flex items-center gap-3">
            <div class="h-px w-12 bg-ex-gold opacity-40"></div>
            <span class="text-ex-gold text-sm">✦</span>
            <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          </div>
        </div>

        <!-- Brand story card -->
        <div class="flex flex-col md:flex-row items-center gap-10 rounded-2xl shadow-sm p-8 w-full" style="background-color:#ffffff; border:1px solid #f0ebe3;">
          <div class="flex items-center justify-center w-full md:w-1/2">
            <img src="/brand/logo.jpg" alt="Exaucée" class="w-full max-w-xs object-contain rounded-xl" />
          </div>
          <div class="flex flex-col gap-5 md:w-1/2">
            <h2 class="font-great-vibes text-3xl" style="color:#3D2B1F;">{{ langStore.t.about.brandTitle }}</h2>
            <p class="text-sm leading-relaxed opacity-75" style="color:#3D2B1F;">{{ langStore.t.about.p1 }}</p>
            <p class="text-sm leading-relaxed opacity-75" style="color:#3D2B1F;">{{ langStore.t.about.p2 }}</p>
            <router-link
              to="/"
              class="about-cta self-start inline-flex items-center gap-3 rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-md transition-all duration-300"
            >
              {{ langStore.t.about.shopCta }}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="about-cta-arrow h-3.5 w-3.5 transition-transform duration-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </router-link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.about-cta {
  background-color: #C4828A;
  color: #ffffff;
}
.about-cta:hover {
  background-color: #A85560;
  box-shadow: 0 10px 25px -5px rgba(196, 130, 138, 0.4);
  transform: translateY(-2px);
}
.about-cta:hover .about-cta-arrow {
  transform: translateX(4px);
}
</style>
