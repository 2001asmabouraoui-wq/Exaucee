<script setup lang="ts">
import { computed } from 'vue'
import { useProductStore } from '../../pinia/productStore'
import { useLangStore }    from '../../pinia/langStore'
import { getProduct as staticGetProduct } from '../../data/product-utils'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Navigation from '../../components/navigation-global.vue'
import Footer from '../../components/footer-global.vue'
import ProductDetail from './Components/ProductDetail.vue'
import Ymal from '../../components/ymal-boxes.vue'

const props = defineProps<{ category: string; productId: number }>()
const store = useProductStore()
const lang  = useLangStore()

const item = computed(() =>
  store.getProduct(props.category, props.productId)
  ?? staticGetProduct(props.category, props.productId)
)

// While the store is still fetching, don't show "not found" — wait for it
const isLoading = computed(() => !item.value && !store.loaded)
</script>

<template>
  <main style="min-height:100vh; background:#ffffff; display:flex; flex-direction:column; align-items:center; width:100%;">
    <AnnouncementBar />
    <Navigation color="k-black" />
    <div style="width:100%; display:flex; flex-direction:column; align-items:center; flex:1;">

      <!-- Still fetching from DB — brief spinner -->
      <div v-if="isLoading" style="padding:8rem 1rem; display:flex; flex-direction:column; align-items:center; gap:12px;">
        <div class="spinner"></div>
        <p style="color:#C4828A; font-size:0.75rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase;">{{ lang.t.product.loading }}</p>
      </div>

      <!-- Product found -->
      <ProductDetail v-else-if="item" :item="item" />

      <!-- Genuinely not found -->
      <div v-else style="padding:8rem 1rem; text-align:center; color:#9B86A8; font-size:0.875rem;">
        {{ lang.t.product.notFound }}
      </div>

      <Ymal v-if="item" :productCategory="props.category" :productId="props.productId" />
    </div>
    <Footer />
  </main>
</template>

<style scoped>
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid #f0ebe3;
  border-top-color: #C4828A;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
