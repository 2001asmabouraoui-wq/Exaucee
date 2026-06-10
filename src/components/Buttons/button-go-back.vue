<script setup lang="ts"></script>

<template>
  <div class="mb-8 mt-4 w-4/5 max-w-6xl lg:mt-10"> <!-- reduced top margin -->
    <a
      @click="$router.go(-1)"
      class="cursor-pointer text-start font-semibold text-black opacity-60 hover:opacity-100 active:translate-y-0.5"
    >
      Go Back
    </a>
  </div>
</template>
