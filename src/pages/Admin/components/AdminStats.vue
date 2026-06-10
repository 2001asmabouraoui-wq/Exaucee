<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  stats: {
    total_orders: number
    total_revenue: string
    today_orders: number
    subscribers: number
    status_counts: Record<string, number>
  } | null
  apiUrl: string
  authToken: string
}>()

const STATUS_COLORS: Record<string, string> = {
  pending:    '#C9A45A',
  processing: '#9B86A8',
  shipped:    '#5A9E8A',
  delivered:  '#5A9E8A',
  cancelled:  '#C4828A',
}

const chartData = computed(() => {
  if (!props.stats || props.stats.total_orders === 0) return []
  const entries = Object.entries(props.stats.status_counts).filter(([, v]) => v > 0)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return entries.map(([status, count]) => ({
    status, count,
    width: Math.round((count / max) * 100),
    color: STATUS_COLORS[status] ?? '#9B86A8',
  }))
})

// ── Revenue sparkline ──────────────────────────────
interface DayPoint { date: string; revenue: number; orders: number }
const revenueData  = ref<DayPoint[]>([])
const revPeriod    = ref<30 | 7>(30)
const revLoading   = ref(false)

const SVG_W = 600
const SVG_H = 80

const sparkPath = computed(() => {
  const pts = revenueData.value
  if (!pts.length) return ''
  const max = Math.max(...pts.map(p => p.revenue), 1)
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * SVG_W)
  const ys = pts.map(p => SVG_H - (p.revenue / max) * SVG_H * 0.9)
  let d = `M ${xs[0]} ${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2
    d += ` C ${cx} ${ys[i-1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`
  }
  return d
})

const fillPath = computed(() => {
  if (!sparkPath.value) return ''
  const pts = revenueData.value
  if (!pts.length) return ''
  const max = Math.max(...pts.map(p => p.revenue), 1)
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * SVG_W)
  const ys = pts.map(p => SVG_H - (p.revenue / max) * SVG_H * 0.9)
  let d = `M ${xs[0]} ${SVG_H} L ${xs[0]} ${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2
    d += ` C ${cx} ${ys[i-1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`
  }
  d += ` L ${xs[xs.length - 1]} ${SVG_H} Z`
  return d
})

const totalRevInPeriod = computed(() =>
  revenueData.value.reduce((s, p) => s + p.revenue, 0).toFixed(2)
)
const totalOrdersInPeriod = computed(() =>
  revenueData.value.reduce((s, p) => s + p.orders, 0)
)

async function loadRevenue() {
  revLoading.value = true
  try {
    const res = await fetch(`${props.apiUrl}/api/orders/revenue-chart?days=${revPeriod.value}`, {
      headers: { Authorization: `Bearer ${props.authToken}` },
    })
    if (res.ok) revenueData.value = await res.json()
  } catch { /* ignore */ }
  revLoading.value = false
}

function setPeriod(p: 7 | 30) {
  revPeriod.value = p
  loadRevenue()
}

// ── Top products ────────────────────────────────────
interface TopProduct { name: string; category: string; total_sold: number; revenue: number }
const topProducts = ref<TopProduct[]>([])
const topPeriod   = ref<30 | 7>(30)
const topLoading  = ref(false)

const topMax = computed(() => Math.max(...topProducts.value.map(p => p.total_sold), 1))

async function loadTopProducts() {
  topLoading.value = true
  try {
    const res = await fetch(`${props.apiUrl}/api/orders/top-products?days=${topPeriod.value}`, {
      headers: { Authorization: `Bearer ${props.authToken}` },
    })
    if (res.ok) topProducts.value = await res.json()
  } catch { /* ignore */ }
  topLoading.value = false
}

function setTopPeriod(p: 7 | 30) {
  topPeriod.value = p
  loadTopProducts()
}
// ────────────────────────────────────────────────────

onMounted(() => {
  loadRevenue()
  loadTopProducts()
})
</script>

<template>
  <div v-if="stats" class="flex flex-col gap-4 mb-8">

    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="stat-card">
        <p class="stat-label">Revenue (TND)</p>
        <p class="stat-value" style="color:#C4828A;">{{ stats.total_revenue }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Orders</p>
        <p class="stat-value">{{ stats.total_orders }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Today</p>
        <p class="stat-value">{{ stats.today_orders }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Subscribers</p>
        <p class="stat-value" style="color:#9B86A8;">{{ stats.subscribers }}</p>
      </div>
    </div>

    <!-- Status breakdown pills -->
    <div class="flex flex-wrap gap-2">
      <span v-for="(count, status) in stats.status_counts" :key="status" class="status-pill">
        {{ status }}: <strong>{{ count }}</strong>
      </span>
    </div>

    <!-- Revenue sparkline -->
    <div class="chart-card">
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p class="chart-title">Revenue Over Time</p>
          <p class="text-[11px] mt-0.5" style="color:#3D2B1F;">
            <strong>{{ totalRevInPeriod }} TND</strong>
            <span class="opacity-50 ml-1">· {{ totalOrdersInPeriod }} orders · last {{ revPeriod }} days</span>
          </p>
        </div>
        <div class="flex gap-1">
          <button
            @click="setPeriod(7)"
            class="period-btn" :class="{ 'period-btn--active': revPeriod === 7 }"
          >7d</button>
          <button
            @click="setPeriod(30)"
            class="period-btn" :class="{ 'period-btn--active': revPeriod === 30 }"
          >30d</button>
        </div>
      </div>

      <div v-if="revLoading" class="text-xs opacity-40 py-6 text-center" style="color:#3D2B1F;">Loading…</div>
      <div v-else-if="revenueData.length">
        <svg :viewBox="`0 0 ${600} ${80}`" class="w-full h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#C4828A" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#C4828A" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path :d="fillPath" fill="url(#revGrad)" />
          <path :d="sparkPath" fill="none" stroke="#C4828A" stroke-width="2" stroke-linecap="round" />
        </svg>
        <!-- X-axis dates -->
        <div class="flex justify-between mt-1">
          <span class="text-[9px] opacity-40" style="color:#3D2B1F;">{{ revenueData[0]?.date }}</span>
          <span class="text-[9px] opacity-40" style="color:#3D2B1F;">{{ revenueData[revenueData.length - 1]?.date }}</span>
        </div>
      </div>
      <div v-else class="text-xs opacity-40 py-4 text-center" style="color:#3D2B1F;">No data yet</div>
    </div>

    <!-- Order status bar chart -->
    <div v-if="chartData.length > 0" class="chart-card">
      <p class="chart-title mb-3">Order Status Breakdown</p>
      <div class="flex flex-col gap-2.5">
        <div v-for="item in chartData" :key="item.status" class="chart-row">
          <span class="chart-label">{{ item.status }}</span>
          <div class="chart-track">
            <div class="chart-bar" :style="{ width: item.width + '%', background: item.color }"></div>
          </div>
          <span class="chart-count">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- Top products chart -->
    <div class="chart-card">
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p class="chart-title">Top Products</p>
        <div class="flex gap-1">
          <button @click="setTopPeriod(7)"  class="period-btn" :class="{ 'period-btn--active': topPeriod === 7 }">7d</button>
          <button @click="setTopPeriod(30)" class="period-btn" :class="{ 'period-btn--active': topPeriod === 30 }">30d</button>
        </div>
      </div>
      <div v-if="topLoading" class="text-xs opacity-40 py-4 text-center" style="color:#3D2B1F;">Loading…</div>
      <div v-else-if="topProducts.length === 0" class="text-xs opacity-40 py-4 text-center" style="color:#3D2B1F;">No sales data yet</div>
      <div v-else class="flex flex-col gap-2.5">
        <div
          v-for="(p, idx) in topProducts"
          :key="p.name"
          class="chart-row items-center"
        >
          <span class="text-[10px] font-black opacity-40 w-5 flex-shrink-0" style="color:#3D2B1F;">{{ idx + 1 }}</span>
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-[11px] font-bold truncate" style="color:#3D2B1F;">{{ p.name }}</span>
            <div class="chart-track">
              <div
                class="chart-bar transition-all duration-500"
                :style="{
                  width: Math.round((p.total_sold / topMax) * 100) + '%',
                  background: idx === 0 ? '#C4828A' : idx === 1 ? '#9B86A8' : '#C9A45A',
                }"
              ></div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-2">
            <p class="text-[11px] font-bold" style="color:#3D2B1F;">{{ p.total_sold }} sold</p>
            <p class="text-[9px] opacity-50" style="color:#3D2B1F;">{{ p.revenue }} TND</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.stat-card { background:#ffffff; border:1px solid #f0ebe3; border-radius:14px; padding:16px 20px; }
.stat-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:#9B86A8; margin-bottom:6px; }
.stat-value { font-size:26px; font-weight:800; color:#3D2B1F; }
.status-pill { background:#FFF9F4; border:1px solid #f0ebe3; border-radius:20px; padding:4px 12px; font-size:11px; color:#3D2B1F; text-transform:capitalize; }
.chart-card { background:#ffffff; border:1px solid #f0ebe3; border-radius:14px; padding:16px 20px; }
.chart-title { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.15em; color:#9B86A8; }
.chart-row { display:flex; align-items:center; gap:10px; }
.chart-label { font-size:10px; font-weight:600; color:#3D2B1F; text-transform:capitalize; width:80px; flex-shrink:0; }
.chart-track { flex-grow:1; height:10px; background:#f0ebe3; border-radius:10px; overflow:hidden; }
.chart-bar { height:100%; border-radius:10px; transition:width 0.4s ease; min-width:4px; }
.chart-count { font-size:11px; font-weight:700; color:#3D2B1F; width:24px; text-align:right; flex-shrink:0; }
.period-btn { padding:4px 10px; border-radius:20px; border:1px solid #f0ebe3; background:#fff; font-size:10px; font-weight:700; color:#9B86A8; cursor:pointer; transition:all .2s; }
.period-btn--active { background:#C4828A; border-color:#C4828A; color:#fff; }
</style>
