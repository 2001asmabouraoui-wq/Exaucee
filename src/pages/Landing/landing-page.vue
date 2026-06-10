<script setup lang="ts">
import AnnouncementBar from '../../components/announcement-bar.vue'
import Navigation from '../../components/navigation-global.vue'
import LandingHero from './Components/landing-hero.vue'
import Grid from './Components/landing-grid.vue'
import Info from '../../components/info-section.vue'
import Footer from '../../components/footer-global.vue'
import { useLangStore } from '../../pinia/langStore'
import { usePerkStore } from '../../pinia/perkStore'
import { onMounted } from 'vue'

const langStore = useLangStore()
const perkStore = usePerkStore()
onMounted(() => perkStore.fetchPerks())
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none" style="background-color:#FFF9F4;">

    <!-- ✦ Falling glitter + patisserie layer (fixed, above content but below nav) -->
    <div class="pointer-events-none fixed inset-0 z-40 overflow-hidden" style="pointer-events:none;" aria-hidden="true">
      <!-- Stars — baby pink -->
      <span class="glitter" style="left:2%;  animation-duration:11s;   animation-delay:0s;    font-size:0.75rem; color:#FFB6C1;">✦</span>
      <span class="glitter" style="left:33%; animation-duration:9.5s;  animation-delay:3s;    font-size:0.65rem; color:#F4BFCA; animation-name:glitter-drift;">✧</span>
      <span class="glitter" style="left:89%; animation-duration:12s;   animation-delay:0.7s;  font-size:0.6rem;  color:#FFB6C1; animation-name:glitter-drift;">✸</span>
      <!-- Stars — baby blue -->
      <span class="glitter" style="left:17%; animation-duration:14s;   animation-delay:2s;    font-size:0.7rem;  color:#B8D4E8; animation-name:glitter-drift;">✶</span>
      <span class="glitter" style="left:53%; animation-duration:8.5s;  animation-delay:1.8s;  font-size:0.6rem;  color:#B5C5E0; animation-name:glitter-drift;">✩</span>
      <span class="glitter" style="left:83%; animation-duration:9s;    animation-delay:6s;    font-size:0.7rem;  color:#B8D4E8; animation-name:glitter-drift;">✶</span>
      <!-- Stars — baby green -->
      <span class="glitter" style="left:43%; animation-duration:10s;   animation-delay:2.5s;  font-size:0.75rem; color:#A8E6CF;">✦</span>
      <span class="glitter" style="left:70%; animation-duration:12s;   animation-delay:1.5s;  font-size:0.65rem; color:#B4D9CB; animation-name:glitter-drift;">✧</span>
      <!-- Stars — soft gold -->
      <span class="glitter" style="left:62%; animation-duration:11s;   animation-delay:4.2s;  font-size:0.65rem; color:#E8D5A3; animation-name:glitter-drift;">✸</span>
      <span class="glitter" style="left:94%; animation-duration:13s;   animation-delay:1s;    font-size:0.7rem;  color:#E8D5A3; animation-name:glitter-drift;">✧</span>

      <!-- Patisserie — croissants -->
      <span class="glitter" style="left:8%;  animation-duration:13s;   animation-delay:1s;    font-size:1rem;">🥐</span>
      <span class="glitter" style="left:76%; animation-duration:11.5s; animation-delay:4s;    font-size:0.9rem;  animation-name:glitter-drift;">🥐</span>
      <!-- Patisserie — cupcakes -->
      <span class="glitter" style="left:22%; animation-duration:12s;   animation-delay:2.5s;  font-size:1rem;    animation-name:glitter-drift;">🧁</span>
      <span class="glitter" style="left:65%; animation-duration:10.5s; animation-delay:5.5s;  font-size:0.9rem;">🧁</span>
      <!-- Patisserie — tarts / pies -->
      <span class="glitter" style="left:38%; animation-duration:14s;   animation-delay:0.4s;  font-size:0.95rem; animation-name:glitter-drift;">🥧</span>
      <span class="glitter" style="left:87%; animation-duration:11s;   animation-delay:3.8s;  font-size:0.85rem;">🥧</span>
      <!-- Patisserie — cake slices -->
      <span class="glitter" style="left:49%; animation-duration:13.5s; animation-delay:1.6s;  font-size:1rem;    animation-name:glitter-drift;">🍰</span>
      <span class="glitter" style="left:12%; animation-duration:10s;   animation-delay:5s;    font-size:0.9rem;  animation-name:glitter-drift;">🍰</span>
      <!-- Patisserie — macarons (donut as stand-in, close enough) -->
      <span class="glitter" style="left:57%; animation-duration:12.5s; animation-delay:2.2s;  font-size:0.95rem;">🍩</span>
      <span class="glitter" style="left:28%; animation-duration:9s;    animation-delay:4.5s;  font-size:0.85rem; animation-name:glitter-drift;">🍩</span>
    </div>

    <!-- Content layer -->
    <div class="relative z-10 w-full flex flex-col items-center">
      <AnnouncementBar />
      <Navigation color="k-black" />

      <main class="h-full w-screen">

        <!-- Hero carousel -->
        <LandingHero />

        <!-- Tiered perks bar -->
        <div class="w-full border-y border-ex-gold border-opacity-15 py-5 px-4" style="background-color:#FFF9F4;">
          <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-ex-gold divide-opacity-20">
            <div
              v-for="(perk, i) in perkStore.displayPerks"
              :key="perk.id"
              class="flex flex-1 items-center justify-center gap-3 px-6 py-1"
            >
              <span class="text-xl">{{ perk.emoji }}</span>
              <div class="text-center md:text-left">
                <p class="text-[10px] font-black uppercase tracking-widest text-ex-rose">{{ langStore.t.landing.perks[i]?.top ?? perk.topText }}</p>
                <p class="text-xs text-ex-brown opacity-60">{{ langStore.t.landing.perks[i]?.sub ?? perk.subText }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Full product grid with filters -->
        <Grid />

        <!-- Info pillars -->
        <Info />

      </main>
      <Footer />
    </div>
  </div>
</template>
