<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface ReferralCode {
  id: string; created_at: string; code: string; owner_email: string; owner_name: string
  discount_type: 'percent' | 'fixed'; discount_value: number; uses_count: number; active: boolean
}

const codes   = ref<ReferralCode[]>([])
const loading = ref(false)
const showForm = ref(false)
const saveError = ref('')

const form = ref({ owner_email: '', owner_name: '', discount_type: 'percent' as 'percent' | 'fixed', discount_value: 10 })

async function fetchCodes() {
  loading.value = true
  const res = await fetch(`${props.apiUrl}/api/referral`, { headers: { Authorization: `Bearer ${props.authToken}` } })
  codes.value = res.ok ? await res.json() : []
  loading.value = false
}

async function create() {
  saveError.value = ''
  if (!form.value.owner_email.trim()) { saveError.value = 'Email is required.'; return }
  const res = await fetch(`${props.apiUrl}/api/referral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
    body: JSON.stringify(form.value),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); saveError.value = (e as any).error || 'Failed'; return }
  showForm.value = false
  form.value = { owner_email: '', owner_name: '', discount_type: 'percent', discount_value: 10 }
  await fetchCodes()
}

async function toggleActive(c: ReferralCode) {
  await fetch(`${props.apiUrl}/api/referral/${c.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
    body: JSON.stringify({ active: !c.active }),
  })
  await fetchCodes()
}

async function deleteCode(id: string) {
  await fetch(`${props.apiUrl}/api/referral/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${props.authToken}` } })
  await fetchCodes()
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
}

onMounted(fetchCodes)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <p class="text-xs opacity-50" style="color:#3D2B1F;">{{ codes.length }} referral codes</p>
      <button @click="showForm = !showForm" class="add-btn">+ Generate Code</button>
    </div>

    <!-- Create form inline -->
    <div v-if="showForm" class="rounded-xl p-5 mb-5 bg-white" style="border:1px solid #f0ebe3;">
      <h3 class="text-sm font-bold mb-4" style="color:#3D2B1F;">New Referral Code</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="form-group">
          <label class="form-label">Owner Email *</label>
          <input v-model="form.owner_email" class="form-input" placeholder="customer@email.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Owner Name</label>
          <input v-model="form.owner_name" class="form-input" placeholder="Fatma B." />
        </div>
        <div class="form-group">
          <label class="form-label">Discount Type</label>
          <select v-model="form.discount_type" class="form-input">
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (TND)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Discount Value</label>
          <input v-model.number="form.discount_value" type="number" min="1" class="form-input" />
        </div>
      </div>
      <p v-if="saveError" class="text-xs mt-2" style="color:#f87171;">{{ saveError }}</p>
      <div class="flex gap-3 mt-4">
        <button @click="showForm = false" class="cancel-btn">Cancel</button>
        <button @click="create" class="save-btn">Generate Code</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>
    <div v-else-if="!codes.length" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">No referral codes yet.</div>

    <div v-else class="overflow-x-auto rounded-xl" style="border:1px solid #f0ebe3;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#FFF9F4; border-bottom:1px solid #f0ebe3;">
            <th class="th">Code</th>
            <th class="th">Owner</th>
            <th class="th">Discount</th>
            <th class="th">Uses</th>
            <th class="th">Status</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in codes" :key="c.id" class="ref-row">
            <td class="td">
              <div class="flex items-center gap-2">
                <code class="rounded px-2 py-0.5 text-xs font-mono font-bold" style="background:#FFF9F4; color:#C4828A;">{{ c.code }}</code>
                <button @click="copyCode(c.code)" title="Copy" class="text-xs opacity-40 hover:opacity-80 transition" style="color:#3D2B1F;">⧉</button>
              </div>
            </td>
            <td class="td">
              <p class="font-semibold text-xs" style="color:#3D2B1F;">{{ c.owner_name || '—' }}</p>
              <p class="text-[10px] opacity-50" style="color:#3D2B1F;">{{ c.owner_email }}</p>
            </td>
            <td class="td font-bold" style="color:#3D2B1F;">
              {{ c.discount_value }}{{ c.discount_type === 'percent' ? '%' : ' TND' }}
            </td>
            <td class="td font-bold" style="color:#3D2B1F;">{{ c.uses_count }}</td>
            <td class="td">
              <span :class="c.active ? 'badge-green' : 'badge-red'">{{ c.active ? 'Active' : 'Off' }}</span>
            </td>
            <td class="td">
              <div class="flex gap-2">
                <button @click="toggleActive(c)" class="action-btn" :title="c.active ? 'Deactivate' : 'Activate'">
                  {{ c.active ? '⏸' : '▶' }}
                </button>
                <button @click="deleteCode(c.id)" class="action-btn action-btn--danger" title="Delete">✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.add-btn { background:#C4828A; color:#fff; border:none; padding:8px 18px; border-radius:20px; font-size:11px; font-weight:700; cursor:pointer; transition:background .2s; }
.add-btn:hover { background:#A85560; }
.th { padding:10px 14px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:#9B86A8; text-align:left; white-space:nowrap; }
.td { padding:10px 14px; border-bottom:1px solid #f0ebe3; color:#3D2B1F; font-size:12px; vertical-align:middle; }
.ref-row:last-child .td { border-bottom:none; }
.badge-green { background:#D6E9DC; color:#5A9E8A; border-radius:20px; padding:2px 8px; font-size:10px; font-weight:700; }
.badge-red   { background:#FDEEF1; color:#C4828A; border-radius:20px; padding:2px 8px; font-size:10px; font-weight:700; }
.action-btn { width:28px; height:28px; border-radius:8px; border:1px solid #f0ebe3; background:#fff; color:#9B86A8; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.action-btn:hover { background:#FFF9F4; border-color:#C4828A; color:#C4828A; }
.action-btn--danger:hover { background:#C4828A; border-color:#C4828A; color:#fff; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.form-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:#9B86A8; }
.form-input { border:1px solid #f0ebe3; border-radius:10px; padding:8px 12px; font-size:12px; color:#3D2B1F; background:#fff; outline:none; width:100%; }
.form-input:focus { border-color:#C4828A; }
.cancel-btn { flex:1; padding:10px; border-radius:10px; border:1px solid #f0ebe3; background:#fff; font-size:12px; font-weight:600; color:#3D2B1F; cursor:pointer; }
.save-btn   { flex:1; padding:10px; border-radius:10px; border:none; background:#3D2B1F; font-size:12px; font-weight:700; color:#fff; cursor:pointer; transition:background .2s; }
.save-btn:hover { background:#C4828A; }
</style>
