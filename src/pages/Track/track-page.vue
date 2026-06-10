<script setup lang="ts">
import { ref } from 'vue'
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const query   = ref('')
const loading = ref(false)
const error   = ref('')
const orders  = ref<any[]>([])
const searched = ref(false)

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}
const STATUS_ICONS: Record<string, string> = {
  pending:    '🕐',
  processing: '⚙️',
  shipped:    '🚚',
  delivered:  '✅',
  cancelled:  '❌',
}
const STATUS_COLORS: Record<string, string> = {
  pending:    '#C9A45A',
  processing: '#9B86A8',
  shipped:    '#5A9E8A',
  delivered:  '#5A9E8A',
  cancelled:  '#C4828A',
}

function stepIndex(status: string) {
  return STATUS_STEPS.indexOf(status)
}

async function track() {
  error.value = ''
  orders.value = []
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const isId = /^[0-9a-f-]{36}$/i.test(query.value.trim())
    const params = isId ? `order_id=${encodeURIComponent(query.value.trim())}` : `email=${encodeURIComponent(query.value.trim())}`
    const res = await fetch(`${apiUrl}/api/track?${params}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      error.value = (data as any).error || 'No orders found.'
    } else {
      orders.value = await res.json()
    }
  } catch {
    error.value = 'Could not connect. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none" style="background-color:#FFF9F4;">
    <AnnouncementBar />
    <Navigation color="k-black" />

    <main class="flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-16 gap-10 flex-grow">

      <!-- Header -->
      <div class="flex flex-col items-center text-center">
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-3" style="color:#9B86A8;">Exaucée</p>
        <h1 class="font-great-vibes text-6xl drop-shadow-sm" style="color:#3D2B1F;">Track Your Order</h1>
        <div class="mt-4 flex items-center gap-3">
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          <span class="text-ex-gold text-sm">✦</span>
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        </div>
        <p class="mt-4 text-sm opacity-60" style="color:#3D2B1F;">Enter your email address or order ID to check your order status.</p>
      </div>

      <!-- Search form -->
      <div class="w-full flex gap-3">
        <input
          v-model="query"
          type="text"
          placeholder="Email address or order ID…"
          @keyup.enter="track"
          class="flex-1 rounded-full border px-5 py-3 text-sm outline-none transition"
          style="border-color:#f0ebe3; color:#3D2B1F; background:#fff;"
          onfocus="this.style.borderColor='#C4828A'" onblur="this.style.borderColor='#f0ebe3'"
        />
        <button
          @click="track"
          :disabled="loading"
          class="rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest transition disabled:opacity-60"
          style="background:#C4828A; color:#fff;"
        >{{ loading ? '…' : 'Track' }}</button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-sm font-semibold" style="color:#C4828A;">{{ error }}</p>

      <!-- No results -->
      <div v-else-if="searched && !loading && orders.length === 0 && !error" class="text-center opacity-50 text-sm" style="color:#3D2B1F;">No orders found for that email / ID.</div>

      <!-- Orders list -->
      <div v-if="orders.length" class="w-full flex flex-col gap-6">
        <div
          v-for="order in orders"
          :key="order.id"
          class="rounded-2xl bg-white p-6"
          style="border:1px solid #f0ebe3;"
        >
          <!-- Order header -->
          <div class="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:#9B86A8;">Order ID</p>
              <p class="text-xs font-mono" style="color:#3D2B1F;">{{ order.id }}</p>
              <p class="text-[10px] opacity-50 mt-1" style="color:#3D2B1F;">{{ new Date(order.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) }}</p>
            </div>
            <div class="flex items-center gap-2 rounded-full px-4 py-1.5" :style="{ background: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status] }">
              <span>{{ STATUS_ICONS[order.status] }}</span>
              <span class="text-xs font-bold uppercase tracking-widest">{{ STATUS_LABELS[order.status] || order.status }}</span>
            </div>
          </div>

          <!-- Progress bar (not shown for cancelled) -->
          <div v-if="order.status !== 'cancelled'" class="mb-6">
            <div class="flex items-center gap-0">
              <template v-for="(step, i) in STATUS_STEPS" :key="step">
                <div class="flex flex-col items-center flex-1">
                  <div
                    class="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    :style="i <= stepIndex(order.status)
                      ? { background: '#C4828A', color: '#fff' }
                      : { background: '#f0ebe3', color: '#9B86A8' }"
                  >{{ i <= stepIndex(order.status) ? '✓' : i + 1 }}</div>
                  <p class="mt-1 text-[9px] font-bold uppercase tracking-wider text-center" :style="{ color: i <= stepIndex(order.status) ? '#C4828A' : '#9B86A8' }">{{ step }}</p>
                </div>
                <div v-if="i < STATUS_STEPS.length - 1" class="flex-1 h-0.5 mb-5 transition-all" :style="{ background: i < stepIndex(order.status) ? '#C4828A' : '#f0ebe3' }"></div>
              </template>
            </div>
          </div>

          <!-- Items -->
          <div class="flex flex-col gap-2 mb-4">
            <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color:#9B86A8;">Items</p>
            <div
              v-for="(item, i) in order.items"
              :key="i"
              class="flex items-center justify-between text-sm py-2 border-b"
              style="border-color:#f0ebe3;"
            >
              <span style="color:#3D2B1F;">{{ item.name }} <span class="opacity-50">× {{ item.quantity }}</span></span>
              <span style="color:#3D2B1F;">{{ item.price }} TND</span>
            </div>
          </div>

          <!-- Total -->
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-bold uppercase tracking-widest" style="color:#9B86A8;">Total</span>
            <span class="text-base font-bold" style="color:#C4828A;">{{ order.total }} TND</span>
          </div>
          <div v-if="order.gift_wrap" class="mt-2 text-xs" style="color:#9B86A8;">🎀 Gift wrapping included</div>
        </div>
      </div>

    </main>

    <Footer />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
