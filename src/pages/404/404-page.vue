<script lang="ts" setup>
import ButtonSolid from '../../components/Buttons/button-solid.vue'
</script>

<template>
  <main
    class="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff7f8] via-[#f8f5f7] to-[#f2f7f4]"
  >
    <!-- soft background blobs -->
    <div
      class="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#B76E79]/15 blur-3xl"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#A9C3A1]/20 blur-3xl"
      aria-hidden="true"
    ></div>

    <!-- card -->
    <div
      class="relative z-10 flex max-w-md flex-col items-center gap-5 rounded-3xl border border-[#eadde2] bg-white/80 px-8 py-10 text-center shadow-xl backdrop-blur-md"
    >
      <span class="rounded-full bg-[#f8f0f3] px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#B76E79]">
        OOPS · PAGE NOT FOUND
      </span>

      <h1 class="mt-2 text-6xl font-black tracking-tight text-[#111827] md:text-7xl">
        404
      </h1>

      <p class="text-sm uppercase tracking-[0.35em] text-[#B76E79]/80">
        You took a wrong turn on the menu
      </p>

      <p class="mt-3 text-sm leading-relaxed text-[#4b5563] md:text-base">
        The page you’re looking for has slipped off the tray.<br />
        Let’s take you back to something more delicious.
      </p>

      <ButtonSolid
        to="/"
        :color="'light'"
        :content="'Back to home'"
        :size="'big'"
        add="mt-6 font-bold !bg-[#B76E79] !text-white hover:!bg-[#a0606b]"
      />
    </div>
  </main>
</template>
