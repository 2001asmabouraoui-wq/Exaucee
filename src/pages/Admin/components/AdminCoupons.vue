<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed' | 'free_shipping'
  value: number
  min_purchase: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  active: boolean
}

const coupons    = ref<Coupon[]>([])
const loading    = ref(false)
const actionMsg  = ref('')
const actionErr  = ref('')
const confirmDeleteId = ref<string | null>(null)

// Form state
const form = ref({
  code: '',
  type: 'percent' as 'percent' | 'fixed' | 'free_shipping',
  value: 0,
  min_purchase: 0,
  max_uses: '' as string | number,
  expires_at: '',
  active: true,
})
const formErr    = ref('')
const formLoad   = ref(false)

const headers = computed(() => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${props.authToken}`,
}))

const typeLabel = (type: string) => {
  if (type === 'percent')      return '% Off'
  if (type === 'fixed')        return 'TND Off'
  if (type === 'free_shipping') return 'Free Shipping'
  return type
}

async function load() {
  loading.value = true
  actionMsg.value = actionErr.value = ''
  const res = await fetch(`${props.apiUrl}/api/coupons`, { headers: headers.value })
  coupons.value = res.ok ? await res.json() : []
  loading.value = false
}

function handleCodeInput() {
  form.value.code = form.value.code.toUpperCase()
}

async function createCoupon() {
  formErr.value = ''
  if (!form.value.code.trim()) { formErr.value = 'Code is required.'; return }
  if (form.value.type !== 'free_shipping' && form.value.value <= 0) {
    formErr.value = 'Value must be greater than 0.'; return
  }

  formLoad.value = true
  const body: Record<string, any> = {
    code: form.value.code.trim(),
    type: form.value.type,
    value: form.value.value,
    min_purchase: form.value.min_purchase,
    active: form.value.active,
  }
  if (form.value.max_uses !== '' && form.value.max_uses !== null) {
    body.max_uses = Number(form.value.max_uses)
  }
  if (form.value.expires_at) {
    body.expires_at = form.value.expires_at
  }

  const res = await fetch(`${props.apiUrl}/api/coupons`, {
    method: 'POST',
    headers: headers.value,
    body: JSON.stringify(body),
  })
  const data = await res.json()
  formLoad.value = false

  if (!res.ok) { formErr.value = data.error || 'Failed to create coupon.'; return }

  actionMsg.value = `✓ Coupon "${data.code}" created.`
  form.value = { code: '', type: 'percent', value: 0, min_purchase: 0, max_uses: '', expires_at: '', active: true }
  await load()
}

async function toggleActive(coupon: Coupon) {
  const res = await fetch(`${props.apiUrl}/api/coupons/${coupon.id}`, {
    method: 'PATCH',
    headers: headers.value,
    body: JSON.stringify({ active: !coupon.active }),
  })
  if (res.ok) {
    coupon.active = !coupon.active
  } else {
    actionErr.value = 'Failed to update coupon.'
  }
}

async function deleteCoupon(id: string) {
  await fetch(`${props.apiUrl}/api/coupons/${id}`, {
    method: 'DELETE',
    headers: headers.value,
  })
  confirmDeleteId.value = null
  actionMsg.value = '✓ Coupon deleted.'
  await load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl mx-auto">

    <!-- Feedback -->
    <p v-if="actionMsg" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#F0FFF8; color:#5A9E8A; border:1px solid #b6f0d8;">{{ actionMsg }}</p>
    <p v-if="actionErr" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#FFF5F5; color:#C4828A; border:1px solid #f0c4c4;">{{ actionErr }}</p>

    <!-- Create Coupon Form -->
    <h3 class="section-title mb-3">Create Coupon</h3>
    <div class="form-box mb-8">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">

        <div>
          <label class="form-label">Code</label>
          <input
            v-model="form.code"
            type="text"
            class="form-input"
            placeholder="SUMMER20"
            @input="handleCodeInput"
          />
        </div>

        <div>
          <label class="form-label">Type</label>
          <select v-model="form.type" class="form-input">
            <option value="percent">% Off</option>
            <option value="fixed">TND Off</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>

        <div>
          <label class="form-label">Value</label>
          <input
            v-model.number="form.value"
            type="number"
            class="form-input"
            :placeholder="form.type === 'free_shipping' ? '0' : 'e.g. 10'"
            :disabled="form.type === 'free_shipping'"
            min="0"
          />
        </div>

        <div>
          <label class="form-label">Min Purchase (TND)</label>
          <input
            v-model.number="form.min_purchase"
            type="number"
            class="form-input"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label class="form-label">Max Uses</label>
          <input
            v-model="form.max_uses"
            type="number"
            class="form-input"
            placeholder="Unlimited"
            min="1"
          />
        </div>

        <div>
          <label class="form-label">Expires At</label>
          <input
            v-model="form.expires_at"
            type="date"
            class="form-input"
          />
        </div>

      </div>

      <!-- Active toggle + Submit -->
      <div class="flex items-center justify-between mt-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <span class="toggle-track" :class="{ 'toggle-on': form.active }" @click="form.active = !form.active">
            <span class="toggle-thumb" :class="{ 'toggle-thumb-on': form.active }"></span>
          </span>
          <span class="text-xs font-semibold" style="color:#3D2B1F;">Active</span>
        </label>
        <div class="flex items-center gap-3">
          <p v-if="formErr" class="text-xs" style="color:#f87171;">{{ formErr }}</p>
          <button @click="createCoupon" :disabled="formLoad" class="create-btn">
            {{ formLoad ? 'Creating…' : 'Create Coupon' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Coupons List -->
    <h3 class="section-title mb-3">All Coupons</h3>

    <div v-if="loading" class="text-center py-16 text-sm opacity-30" style="color:#3D2B1F;">Loading…</div>

    <div v-else-if="coupons.length === 0" class="empty-state">No coupons yet.</div>

    <div v-else class="table-wrap">
      <table class="coupon-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Min Purchase</th>
            <th>Max Uses</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id">
            <td><span class="code-chip">{{ c.code }}</span></td>
            <td>{{ typeLabel(c.type) }}</td>
            <td>
              <span v-if="c.type === 'percent'">{{ c.value }}%</span>
              <span v-else-if="c.type === 'fixed'">{{ c.value }} TND</span>
              <span v-else>—</span>
            </td>
            <td>{{ c.min_purchase > 0 ? c.min_purchase + ' TND' : '—' }}</td>
            <td>{{ c.max_uses != null ? c.max_uses : '∞' }}</td>
            <td>{{ c.uses_count }}</td>
            <td>{{ c.expires_at ? formatDate(c.expires_at) : '—' }}</td>
            <td>
              <span class="toggle-track small" :class="{ 'toggle-on': c.active }" @click="toggleActive(c)" style="cursor:pointer;">
                <span class="toggle-thumb" :class="{ 'toggle-thumb-on': c.active }"></span>
              </span>
            </td>
            <td>
              <button @click="confirmDeleteId = c.id" class="del-btn">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="confirmDeleteId" class="modal-overlay" @click.self="confirmDeleteId = null">
      <div class="confirm-box">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Delete this coupon?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="confirmDeleteId = null" class="cancel-btn">Cancel</button>
          <button @click="deleteCoupon(confirmDeleteId!)" class="confirm-btn">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.section-title {
  font-size: 12px; font-weight: 800; color: #3D2B1F;
  text-transform: uppercase; letter-spacing: 0.1em;
}
.empty-state {
  text-align: center; padding: 28px 0;
  font-size: 12px; color: #9B86A8; opacity: 0.6;
}
.form-box {
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 14px; padding: 20px;
}
.form-label {
  display: block; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.15em;
  color: #9B86A8; margin-bottom: 4px;
}
.form-input {
  width: 100%; border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 9px 12px; font-size: 12px; color: #3D2B1F;
  background: #fff; outline: none; box-sizing: border-box;
  appearance: none;
}
.form-input:focus { border-color: #C4828A; }
.form-input:disabled { opacity: 0.4; cursor: not-allowed; }

.create-btn {
  padding: 9px 20px; border-radius: 20px; flex-shrink: 0;
  border: none; background: #3D2B1F;
  color: #fff; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: background 0.2s;
}
.create-btn:hover:not(:disabled) { background: #C4828A; }
.create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toggle switch */
.toggle-track {
  display: inline-flex; align-items: center;
  width: 34px; height: 20px; border-radius: 20px;
  background: #e5e0da; transition: background 0.2s;
  position: relative; flex-shrink: 0;
}
.toggle-track.small { width: 28px; height: 16px; }
.toggle-track.toggle-on { background: #5A9E8A; }
.toggle-thumb {
  position: absolute; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle-track.small .toggle-thumb { width: 12px; height: 12px; }
.toggle-thumb.toggle-thumb-on { left: calc(100% - 18px); }
.toggle-track.small .toggle-thumb.toggle-thumb-on { left: calc(100% - 14px); }

/* Table */
.table-wrap {
  overflow-x: auto; border: 1px solid #f0ebe3; border-radius: 14px;
}
.coupon-table {
  width: 100%; border-collapse: collapse; font-size: 12px; color: #3D2B1F;
}
.coupon-table thead tr {
  border-bottom: 1px solid #f0ebe3; background: #FFF9F4;
}
.coupon-table th {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; color: #9B86A8;
  padding: 10px 14px; text-align: left; white-space: nowrap;
}
.coupon-table td {
  padding: 11px 14px; border-bottom: 1px solid #f9f5f1;
  vertical-align: middle;
}
.coupon-table tbody tr:last-child td { border-bottom: none; }
.coupon-table tbody tr:hover { background: #FFFDF9; }

.code-chip {
  font-size: 11px; font-weight: 800; letter-spacing: 0.05em;
  background: #3D2B1F12; color: #3D2B1F;
  padding: 3px 8px; border-radius: 6px;
}
.del-btn {
  padding: 5px 12px; border-radius: 16px; cursor: pointer;
  border: 1.5px solid #f0c4c4; background: #fff;
  color: #C4828A; font-size: 10px; font-weight: 700;
  transition: all 0.2s;
}
.del-btn:hover { background: #C4828A; color: #fff; border-color: #C4828A; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.confirm-box {
  background: #fff; border-radius: 16px; padding: 28px 32px;
  max-width: 300px; width: 90%; text-align: center; border: 1px solid #f0ebe3;
}
.cancel-btn  { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #f0ebe3; background: #fff; font-size: 12px; font-weight: 600; color: #3D2B1F; cursor: pointer; }
.confirm-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: #C4828A; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; }
</style>
