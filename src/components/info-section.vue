<script setup lang="ts">
import { useLangStore } from '../pinia/langStore'
const langStore = useLangStore()
</script>

<template>
  <section class="w-full py-10" style="background-color:#ffffff;">

    <div class="flex justify-center mb-10">
      <div class="flex items-center gap-4">
        <div class="h-px w-16 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-base">✦</span>
        <div class="h-px w-16 bg-ex-gold opacity-40"></div>
      </div>
    </div>

    <div class="mx-auto flex w-4/5 max-w-6xl flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">

      <div
        v-for="(pillar, i) in langStore.t.landing.info"
        :key="i"
        class="flex flex-col items-center text-center md:items-start md:text-start md:w-1/3"
      >
        <span class="mb-3 text-2xl">{{ pillar.emoji }}</span>
        <h3 class="text-sm font-bold uppercase tracking-widest text-ex-brown">{{ pillar.title }}</h3>
        <div class="mt-2 mb-3 h-px w-8 bg-ex-sage opacity-60"></div>
        <p class="text-xs text-ex-brown opacity-60 leading-relaxed">{{ pillar.body }}</p>
      </div>

    </div>
  </section>
</template>
