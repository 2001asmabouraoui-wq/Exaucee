<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Subscriber { id: string; subscribed_at: string; email: string; name: string }

const subscribers   = ref<Subscriber[]>([])
const loading       = ref(false)
const confirmDelete = ref<string | null>(null)

async function fetchSubscribers() {
  loading.value = true
  const res = await fetch(`${props.apiUrl}/api/subscribers`, {
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  subscribers.value = await res.json()
  loading.value = false
}

async function deleteSubscriber(id: string) {
  await fetch(`${props.apiUrl}/api/subscribers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  confirmDelete.value = null
  await fetchSubscribers()
}

function exportCSV() {
  const rows = subscribers.value.map(s => [s.email, s.name || '', new Date(s.subscribed_at).toLocaleDateString()])
  const csv = [['Email', 'Name', 'Date'], ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `exaucee-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(fetchSubscribers)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <p class="text-xs opacity-50" style="color:#3D2B1F;">{{ subscribers.length }} subscribers</p>
      <button @click="exportCSV" class="export-btn">⬇ CSV</button>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <div v-else-if="subscribers.length === 0" class="text-center py-16 opacity-40">
      <p class="text-sm" style="color:#3D2B1F;">No subscribers yet. Add the newsletter form to your site!</p>
    </div>

    <div v-else class="overflow-x-auto rounded-xl" style="border:1px solid #f0ebe3;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#FFF9F4; border-bottom:1px solid #f0ebe3;">
            <th class="th">Email</th>
            <th class="th">Name</th>
            <th class="th">Subscribed</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in subscribers" :key="s.id" class="sub-row">
            <td class="td font-medium" style="color:#3D2B1F;">{{ s.email }}</td>
            <td class="td opacity-60" style="color:#3D2B1F;">{{ s.name || '—' }}</td>
            <td class="td opacity-50" style="color:#3D2B1F;">{{ formatDate(s.subscribed_at) }}</td>
            <td class="td">
              <button @click="confirmDelete = s.id" class="del-btn" title="Remove">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirm -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
      <div class="confirm-box">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Remove this subscriber?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">They will no longer receive newsletters.</p>
        <div class="flex gap-3">
          <button @click="confirmDelete = null" class="cancel-btn">Cancel</button>
          <button @click="deleteSubscriber(confirmDelete!)" class="confirm-btn">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-btn {
  padding: 8px 16px; border-radius: 20px;
  border: 1px solid #C9A45A; font-size: 10px; font-weight: 700;
  color: #C9A45A; background: #ffffff; cursor: pointer;
  transition: all 0.2s;
}
.export-btn:hover { background: #C9A45A; color: #fff; }

.th {
  padding: 10px 16px; font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.15em; color: #9B86A8; text-align: left;
}
.td { padding: 10px 16px; border-bottom: 1px solid #f0ebe3; font-size: 12px; vertical-align: middle; }
.sub-row:last-child .td { border-bottom: none; }

.del-btn {
  width: 26px; height: 26px; border-radius: 50%;
  border: 1px solid #f0ebe3; background: #fff;
  color: #9CA3AF; cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.del-btn:hover { background: #C4828A; color: #fff; border-color: #C4828A; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.confirm-box {
  background: #fff; border-radius: 16px; padding: 28px 32px;
  max-width: 300px; width: 90%; text-align: center; border: 1px solid #f0ebe3;
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
</style>
