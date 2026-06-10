<script setup lang="ts">
// delete later
const props = defineProps<{
	topSrc: string
	botSrc: string
	rightSrc: string
}>()
</script>

<template>
	<section
		v-if="props.topSrc && props.botSrc && props.rightSrc"
		class="mt-16 flex h-full w-full flex-col items-center bg-white lg:mt-32"
	>
	
	</section>
</template>
