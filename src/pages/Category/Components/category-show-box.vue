<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { product } from '../../../data/product-types.ts'
import { useCartStore } from '../../../pinia/cartStore.ts'

import ButtonSolid from '../../../components/Buttons/button-solid.vue'
import ButtonQuickAdd from '../../../components/Buttons/button-quick-add.vue'

const cartStore = useCartStore()

const props = defineProps<{
	category: string
	item: product
}>()

const flip = computed(() => props.item.id % 2 === 0 ? false : true)

let show = ref(false)
onMounted(() => { show.value = true })
</script>

<template>
	<div
		class="mt-16 flex w-4/5 max-w-6xl flex-col items-center gap-10 md:mt-32 md:grid md:w-11/12 md:grid-cols-2 md:grid-rows-1 md:gap-10 lg:w-4/5 lg:gap-20"
	>
		<!-- Text block -->
		<div
			class="flex flex-col items-center md:col-span-1 md:row-start-1 md:block lg:pb-6"
			:class="flip ? 'md:col-start-1' : 'md:col-start-2'"
		>
			<p v-if="props.item.nu" class="text-xs font-semibold uppercase tracking-widest text-ex-sage">
				new product
			</p>
			<h1 class="font-great-vibes mt-4 text-center text-5xl text-ex-rose drop-shadow-sm md:text-start md:text-6xl">
				{{ props.item.header }}
				<span v-if="props.item.subheader" class="block">{{ props.item.subheader }}</span>
			</h1>
			<div class="my-4 flex items-center gap-3 justify-center md:justify-start">
				<div class="h-px w-8 bg-ex-gold opacity-50"></div>
				<span class="text-ex-gold text-xs">✦</span>
				<div class="h-px w-8 bg-ex-gold opacity-50"></div>
			</div>
			<p class="mb-10 text-center text-sm leading-relaxed text-ex-brown opacity-65 md:pr-20 md:text-start">
				{{ props.item.text }}
			</p>
			<div class="flex flex-row items-center justify-center gap-4 md:justify-normal">
				<ButtonSolid
					:to="{ name: props.category, params: { id: props.item.id } }"
					color="light"
					add="font-bold !bg-ex-rose !text-white hover:!bg-ex-sage border-0"
				/>
				<ButtonQuickAdd
					v-if="cartStore.showQuickAdd"
					@add-to-cart="cartStore.addToCart(props.item)"
					:data-test="`quick-add-${props.item.category}-${props.item.id}`"
				/>
			</div>
		</div>

		<!-- Product image -->
		<router-link
			:to="{ name: props.category, params: { id: props.item.id } }"
			class="group order-first col-span-1 cursor-pointer overflow-hidden rounded-2xl border border-ex-gold border-opacity-20 bg-ex-cream-dark shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-md active:translate-y-1 md:-order-none"
			:class="flip ? 'col-start-2' : 'col-start-1'"
		>
			<img
				loading="lazy"
				class="relative aspect-square w-full object-contain p-8 transition duration-700 group-hover:scale-105"
				:src="props.item.src"
				alt=""
			/>
		</router-link>
	</div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
