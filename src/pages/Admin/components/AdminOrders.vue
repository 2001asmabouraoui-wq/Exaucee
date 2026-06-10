<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()
const emit = defineEmits<{ (e: 'stats-changed'): void }>()

interface OrderItem { name: string; category: string; price: number; quantity: number }
interface Order {
  id: string; created_at: string; name: string; email: string; phone: string
  address: string; zip: string; city: string; country: string
  payment_method: string; comment: string; items: OrderItem[]
  subtotal: number; shipping: number; total: number; status: string
}

const orders = ref<Order[]>([])
const loading = ref(false)
const search  = ref('')
const statusFilter = ref('all')
const confirmDelete = ref<string | null>(null)

// ── Bulk selection ───────────────────────────────────
const selectedOrders = ref<Set<string>>(new Set())
const bulkLoading    = ref(false)

const allSelected = computed(() =>
  orders.value.length > 0 && orders.value.every(o => selectedOrders.value.has(o.id))
)

function toggleAll() {
  if (allSelected.value) selectedOrders.value = new Set()
  else selectedOrders.value = new Set(orders.value.map(o => o.id))
}

function toggleOrder(id: string) {
  const s = new Set(selectedOrders.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedOrders.value = s
}

async function bulkUpdateStatus(status: string) {
  bulkLoading.value = true
  await Promise.all(
    Array.from(selectedOrders.value).map(id => updateStatus(id, status))
  )
  selectedOrders.value = new Set()
  bulkLoading.value = false
}
// ────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending: '#F7D9E0', processing: '#D6E9DC', shipped: '#C6B7CC',
  delivered: '#FFF9F4', cancelled: '#f0ebe3',
}
const STATUS_TEXT: Record<string, string> = {
  pending: '#C4828A', processing: '#5A9E8A', shipped: '#7B6B8A',
  delivered: '#9B86A8', cancelled: '#9CA3AF',
}

async function fetchOrders() {
  loading.value = true
  const params = new URLSearchParams()
  if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
  if (search.value.trim()) params.set('search', search.value.trim())
  const res = await fetch(`${props.apiUrl}/api/orders?${params}`, {
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  orders.value = await res.json()
  loading.value = false
}

watch([statusFilter, search], fetchOrders, { immediate: true })

async function updateStatus(id: string, status: string) {
  await fetch(`${props.apiUrl}/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.authToken}` },
    body: JSON.stringify({ status }),
  })
  await fetchOrders()
  emit('stats-changed')
}

async function deleteOrder(id: string) {
  await fetch(`${props.apiUrl}/api/orders/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  confirmDelete.value = null
  await fetchOrders()
  emit('stats-changed')
}

function exportCSV() {
  const cols = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Payment', 'Subtotal', 'Shipping', 'Total', 'Status', 'Items']
  const rows = orders.value.map(o => [
    o.id, new Date(o.created_at).toLocaleString('fr-TN'), o.name, o.email, o.phone || '',
    o.address, o.city, o.country, o.payment_method,
    o.subtotal, o.shipping, o.total, o.status,
    o.items.map(i => `${i.name}×${i.quantity}`).join(' | '),
  ])
  const csv = [cols, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `exaucee-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-TN', { timeZone: 'Africa/Tunis', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <!-- Select all checkbox -->
      <label class="flex items-center gap-2 cursor-pointer" title="Select all">
        <input type="checkbox" :checked="allSelected" @change="toggleAll" class="h-4 w-4 accent-rose-400 flex-shrink-0" />
        <span class="text-[10px] font-bold uppercase tracking-widest opacity-50" style="color:#3D2B1F;">All</span>
      </label>
      <input
        v-model="search"
        type="text"
        placeholder="Search name or email…"
        class="search-input flex-1 min-w-48"
      />
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="s in STATUS_FILTERS"
          :key="s"
          @click="statusFilter = s"
          class="filter-btn"
          :class="{ 'filter-btn--active': statusFilter === s }"
        >{{ s }}</button>
      </div>
      <button @click="exportCSV" class="export-btn">⬇ CSV</button>
    </div>

    <!-- Bulk action bar -->
    <Transition name="bulk-slide">
      <div v-if="selectedOrders.size > 0" class="flex flex-wrap items-center gap-3 mb-4 rounded-xl px-4 py-3" style="background:#FFF9F4; border:1px solid #f0ebe3;">
        <span class="text-xs font-bold" style="color:#3D2B1F;">{{ selectedOrders.size }} selected</span>
        <div class="flex gap-2 ml-auto flex-wrap">
          <button @click="bulkUpdateStatus('processing')" :disabled="bulkLoading" class="bulk-btn bulk-btn--processing">Processing</button>
          <button @click="bulkUpdateStatus('shipped')"    :disabled="bulkLoading" class="bulk-btn bulk-btn--shipped">Shipped</button>
          <button @click="bulkUpdateStatus('delivered')"  :disabled="bulkLoading" class="bulk-btn bulk-btn--delivered">Delivered</button>
          <button @click="bulkUpdateStatus('cancelled')"  :disabled="bulkLoading" class="bulk-btn bulk-btn--cancel">Cancel</button>
          <button @click="selectedOrders = new Set()" class="bulk-btn">Clear</button>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <!-- Empty -->
    <div v-else-if="orders.length === 0" class="text-center py-16 opacity-40">
      <p class="text-sm" style="color:#3D2B1F;">No orders found.</p>
    </div>

    <!-- Orders -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <!-- Header -->
        <div class="order-header">
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              :checked="selectedOrders.has(order.id)"
              @change="toggleOrder(order.id)"
              class="h-4 w-4 accent-rose-400 mt-0.5 flex-shrink-0"
            />
            <div>
            <p class="order-meta">#{{ order.id.slice(0, 8).toUpperCase() }} · {{ formatDate(order.created_at) }}</p>
            <p class="order-name">{{ order.name }}</p>
            <p class="order-contact">{{ order.email }} · {{ order.phone }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="status-badge" :style="{ backgroundColor: STATUS_COLORS[order.status], color: STATUS_TEXT[order.status] }">
              {{ order.status }}
            </span>
            <select
              :value="order.status"
              @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)"
              class="status-select"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button @click="confirmDelete = order.id" class="delete-btn" title="Delete order">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="order-body">
          <div class="col-span-2 px-5 py-4">
            <p class="section-label">Items</p>
            <div class="flex flex-col gap-1.5">
              <div v-for="item in order.items" :key="item.name" class="flex justify-between text-sm" style="color:#3D2B1F;">
                <span>{{ item.name }} <span class="opacity-50">×{{ item.quantity }}</span></span>
                <span class="font-bold">{{ item.price * item.quantity }} TND</span>
              </div>
            </div>
            <div v-if="order.comment" class="mt-3">
              <p class="section-label">Note</p>
              <p class="text-xs italic opacity-60" style="color:#3D2B1F;">{{ order.comment }}</p>
            </div>
          </div>
          <div class="px-5 py-4" style="border-left:1px solid #f0ebe3;">
            <p class="section-label">Totals</p>
            <div class="flex justify-between text-xs mb-1" style="color:#3D2B1F;"><span class="opacity-60">Subtotal</span><span>{{ order.subtotal }} TND</span></div>
            <div class="flex justify-between text-xs mb-1" style="color:#3D2B1F;"><span class="opacity-60">Shipping</span><span>{{ order.shipping }} TND</span></div>
            <div class="flex justify-between text-sm font-black mt-2 pt-2" style="color:#C4828A; border-top:1px solid #f0ebe3;"><span>Total</span><span>{{ order.total }} TND</span></div>
            <p class="section-label mt-4">Address</p>
            <p class="text-xs leading-relaxed" style="color:#3D2B1F;">{{ order.address }}<br>{{ order.zip }} {{ order.city }}<br>{{ order.country }}</p>
            <p class="section-label mt-3">Payment</p>
            <p class="text-xs" style="color:#3D2B1F;">{{ order.payment_method === 'cash' ? 'Cash on Delivery' : 'e-Money' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirm overlay -->
    <div v-if="confirmDelete" class="confirm-overlay" @click.self="confirmDelete = null">
      <div class="confirm-box">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Delete this order?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">This cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="confirmDelete = null" class="cancel-btn">Cancel</button>
          <button @click="deleteOrder(confirmDelete!)" class="confirm-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-input {
  border: 1px solid #f0ebe3;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12px;
  color: #3D2B1F;
  outline: none;
  background: #ffffff;
}
.search-input:focus { border-color: #C4828A; }

.filter-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #f0ebe3;
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
  cursor: pointer;
  color: #3D2B1F;
  background: #ffffff;
  transition: all 0.2s;
}
.filter-btn--active { background: #C4828A; color: #fff; border-color: #C4828A; }

.export-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #C9A45A;
  font-size: 10px;
  font-weight: 700;
  color: #C9A45A;
  background: #ffffff;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.export-btn:hover { background: #C9A45A; color: #fff; }

.order-card {
  border: 1px solid #f0ebe3;
  border-radius: 16px;
  overflow: hidden;
}
.order-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: #FFF9F4;
  border-bottom: 1px solid #f0ebe3;
}
.order-meta   { font-size: 10px; opacity: 0.5; color: #3D2B1F; margin-bottom: 2px; }
.order-name   { font-size: 13px; font-weight: 700; color: #3D2B1F; }
.order-contact{ font-size: 11px; opacity: 0.6; color: #3D2B1F; }
.status-badge {
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.status-select {
  border: 1px solid #f0ebe3;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11px;
  color: #3D2B1F;
  background: #ffffff;
  cursor: pointer;
  outline: none;
}
.delete-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid #f0ebe3;
  background: #ffffff;
  color: #C4828A;
  font-size: 11px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.delete-btn:hover { background: #C4828A; color: #fff; border-color: #C4828A; }

.order-body { display: grid; grid-template-columns: 2fr 1fr; }
@media (max-width: 640px) { .order-body { grid-template-columns: 1fr; } }

.section-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #9B86A8;
  margin-bottom: 8px;
}

.confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.confirm-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px 32px;
  max-width: 300px;
  width: 90%;
  text-align: center;
  border: 1px solid #f0ebe3;
}
.cancel-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 12px; font-weight: 600; color: #3D2B1F; cursor: pointer;
}
.confirm-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: none; background: #C4828A;
  font-size: 12px; font-weight: 700; color: #fff; cursor: pointer;
}

.bulk-btn {
  padding: 5px 12px; border-radius: 20px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 10px; font-weight: 700; color: #3D2B1F;
  cursor: pointer; transition: all 0.15s;
}
.bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bulk-btn:hover:not(:disabled) { border-color: #C4828A; color: #C4828A; }
.bulk-btn--processing { border-color: #D6E9DC; color: #5A9E8A; }
.bulk-btn--shipped    { border-color: #C6B7CC; color: #7B6B8A; }
.bulk-btn--delivered  { border-color: #9B86A8; color: #9B86A8; }
.bulk-btn--cancel     { border-color: #FDEEF1; color: #C4828A; }
.bulk-btn--processing:hover:not(:disabled) { background: #D6E9DC; }
.bulk-btn--shipped:hover:not(:disabled)    { background: #C6B7CC; color: #fff; }
.bulk-btn--delivered:hover:not(:disabled)  { background: #9B86A8; color: #fff; }
.bulk-btn--cancel:hover:not(:disabled)     { background: #C4828A; color: #fff; }

.bulk-slide-enter-active, .bulk-slide-leave-active { transition: all 0.2s ease; }
.bulk-slide-enter-from, .bulk-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
