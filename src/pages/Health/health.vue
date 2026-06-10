<script setup lang="ts">
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'
</script>

<template>
  <main class="flex flex-col min-h-screen bg-ex-cream font-Manrope">
    <AnnouncementBar />
    <Navigation color="k-black" />

    <section class="flex flex-col items-center justify-center flex-grow p-10 gap-10 max-w-5xl mx-auto w-full">

      <div class="flex flex-col items-center">
        <p class="text-xs font-semibold uppercase tracking-widest text-ex-sage mb-2">What goes inside</p>
        <h1 class="font-great-vibes text-5xl text-ex-rose drop-shadow-sm text-center md:text-6xl">Safety &amp; Ingredients</h1>
        <div class="mt-4 flex items-center gap-3">
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          <span class="text-ex-gold text-sm">✦</span>
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        </div>
      </div>

      <p class="text-sm text-ex-brown opacity-65 text-center max-w-2xl leading-relaxed">
        At Exaucée, what goes <em>into</em> our products matters just as much as the packaging they come in.
        We hold ourselves to the highest standards so every gloss is as safe as it is beautiful.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

        <div class="flex flex-col items-center text-center p-6 bg-ex-cream-dark rounded-2xl shadow-sm hover:-translate-y-1 transition duration-300">
          <span class="text-4xl mb-4">🐰</span>
          <h2 class="text-sm font-bold uppercase tracking-widest text-ex-rose mb-2">100% Cruelty-Free</h2>
          <p class="text-xs text-ex-brown opacity-65 leading-relaxed">
            No animal testing. Ever. All Exaucée products are developed through non-animal methods, without exception.
          </p>
        </div>

        <div class="flex flex-col items-center text-center p-6 bg-ex-sage-light rounded-2xl shadow-sm hover:-translate-y-1 transition duration-300">
          <span class="text-4xl mb-4">🧴</span>
          <h2 class="text-sm font-bold uppercase tracking-widest text-ex-rose mb-2">Clean Formula</h2>
          <p class="text-xs text-ex-brown opacity-65 leading-relaxed">
            Free from parabens, sulfates, mineral oils, and synthetic fragrances. Every ingredient is listed transparently.
          </p>
        </div>

        <div class="flex flex-col items-center text-center p-6 bg-ex-cream-dark rounded-2xl shadow-sm hover:-translate-y-1 transition duration-300">
          <span class="text-4xl mb-4">🔬</span>
          <h2 class="text-sm font-bold uppercase tracking-widest text-ex-rose mb-2">Dermatologist Tested</h2>
          <p class="text-xs text-ex-brown opacity-65 leading-relaxed">
            Every product in the Exaucée collection is dermatologist-tested and suitable for sensitive skin.
          </p>
        </div>

      </div>

      <p class="text-xs text-ex-brown opacity-50 italic text-center max-w-xl">
        Questions about ingredients? Write to us at
        <span class="text-ex-rose not-italic">hello@exaucee.tn</span> — we are always happy to help.
      </p>

    </section>
    <Footer />
  </main>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
