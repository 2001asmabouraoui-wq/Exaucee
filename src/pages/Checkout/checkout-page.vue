<script setup lang="ts">
import { onMounted } from 'vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Navigation from '../../components/navigation-global.vue'
import Footer from '../../components/footer-global.vue'
import Grid from './Components/checkout-grid.vue'
import Banner from './Components/checkout-success-modal.vue'
import { useFormStore } from '../../pinia/formStore'
import { useAuthStore } from '../../pinia/authStore'

const formStore = useFormStore()
const auth      = useAuthStore()

// Pre-fill email & name from account when logged in
onMounted(() => {
  if (auth.isLoggedIn) {
    if (!formStore.email) formStore.email = auth.user?.email ?? ''
    if (!formStore.name)  formStore.name  = auth.displayName ?? ''
  }
})
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope" style="background-color:#ffffff;">
    <AnnouncementBar />
    <Navigation color="k-black" />
    <Banner v-if="formStore.showBanner" />
    <main class="w-full flex flex-col items-center py-12 px-4 flex-grow">
      <Grid />
    </main>
    <Footer />
  </div>
</template>
