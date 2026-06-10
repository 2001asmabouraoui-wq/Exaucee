<script setup lang="ts">
import { product } from '../../../data/product-types.ts'

const props = defineProps<{
  cartItem: product & { finalPrice?: number }
  itemCount: number
}>()
</script>

<template>
  <div v-if="itemCount > 0" class="flex items-center gap-3">
    <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center" style="background-color:#FFF9F4;">
      <img class="w-10 h-10 object-contain" :src="props.cartItem.src" :alt="props.cartItem.header" />
    </div>
    <div class="flex flex-1 flex-col min-w-0">
      <p class="font-great-vibes text-lg leading-tight truncate" style="color:#3D2B1F;">{{ props.cartItem.header }}</p>
      <p class="text-xs font-bold opacity-60" style="color:#3D2B1F;">{{ props.cartItem.finalPrice ?? props.cartItem.price }} TND</p>
    </div>
    <span class="text-xs font-bold opacity-50 flex-shrink-0" style="color:#3D2B1F;">×{{ props.itemCount }}</span>
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
