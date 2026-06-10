<script setup lang="ts">
import cartIcon from '/icons/cart-icon.svg'
import type { ProductOption } from '../../data/product-types.ts'

const props = defineProps<{
  itemId: number
  category: string
  options?: Record<string, boolean>
  finalPrice?: number
}>
</script>

<template>
	<button
		@click="$emit('addToCart', { itemId: props.itemId, options: props.options, finalPrice: props.finalPrice })"
		class="flex aspect-square h-full cursor-pointer flex-row items-center justify-center transition hover:translate-y-0.5"
		data-test="button-quick-add"
	>
		<img
			loading="lazy"
			class="aspect-square h-6 invert active:translate-y-0.5"
			src="/icons/cart-icon.svg"
			alt=""
		/>
		<p class="font-bold text-black">+</p>
	</button>
</template>
