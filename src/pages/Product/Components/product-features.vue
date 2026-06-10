<script setup lang="ts">
import arrowIcon from '/icons/right-arrow.svg'

// Define the type locally for "In the Box" items
type Contents = {
  count: number
  content: string
}

const props = defineProps<{
  features: string
  inthebox: Contents[]
}>()
</script>

