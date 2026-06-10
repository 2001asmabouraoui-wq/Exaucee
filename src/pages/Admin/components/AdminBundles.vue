<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Bundle {
  id: string; created_at: string; name: string; description: string
  original_price: number; bundle_price: number; image: string
  items: { name: string; quantity: number }[]
  active: boolean; featured: boolean; sort_order: number
}

const bundles = ref<Bundle[]>([])
const loading = ref(false)
const showForm = ref(false)
const editId   = ref<string | null>(null)
const saveError = ref('')
const confirmDelete = ref<string | null>(null)

const blank = () => ({
  name: '', description: '', original_price: 0, bundle_price: 0,
  image: '', items: [] as { name: string; quantity: number }[],
  active: true, featured: false, sort_order: 0,
})
const form = ref(blank())
const newItemName = ref('')
const newItemQty  = ref(1)

async function fetchBundles() {
  loading.value = true
  const res = await fetch(`${props.apiUrl}/api/bundles/all`, { headers: { Authorization: `Bearer ${props.authToken}` } })
  bundles.value = res.ok ? await res.json() : []
  loading.value = false
}

function openAdd() { form.value = blank(); editId.value = null; saveError.value = ''; showForm.value = true }
function openEdit(b: Bundle) { form.value = { ...b, items: [...b.items] }; editId.value = b.id; saveError.value = ''; showForm.value = true }

function addItem() {
  if (!newItemName.value.trim()) return
  form.value.items.push({ name: newItemName.value.trim(), quantity: newItemQty.value || 1 })
  newItemName.value = ''; newItemQty.value = 1
}
function removeItem(i: number) { form.value.items.splice(i, 1) }

async function save() {
  saveError.value = ''
  if (!form.value.name.trim() || !form.value.bundle_price) { saveError.value = 'Name and bundle price are required.'; return }
  const url = editId.value ? `${props.apiUrl}/api/bundles/${editId.value}` : `${props.apiUrl}/api/bundles`
  const res = await fetch(url, {
    method: editId.value ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
    body: JSON.stringify(form.value),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); saveError.value = (e as any).error || 'Save failed'; return }
  showForm.value = false; await fetchBundles()
}

async function deleteBundle(id: string) {
  await fetch(`${props.apiUrl}/api/bundles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${props.authToken}` } })
  confirmDelete.value = null; await fetchBundles()
}

onMounted(fetchBundles)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <p class="text-xs opacity-50" style="color:#3D2B1F;">{{ bundles.length }} bundles</p>
      <button @click="openAdd" class="add-btn">+ Add Bundle</button>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>
    <div v-else-if="!bundles.length" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">No bundles yet.</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="b in bundles"
        :key="b.id"
        class="rounded-xl p-4 bg-white flex flex-col gap-2"
        style="border:1px solid #f0ebe3;"
      >
        <div class="flex items-start justify-between">
          <h3 class="font-semibold text-sm" style="color:#3D2B1F;">{{ b.name }}</h3>
          <span :class="b.active ? 'badge-green' : 'badge-red'">{{ b.active ? 'Active' : 'Off' }}</span>
        </div>
        <p v-if="b.description" class="text-xs opacity-60" style="color:#3D2B1F;">{{ b.description }}</p>
        <ul class="flex flex-col gap-0.5">
          <li v-for="(item, i) in b.items" :key="i" class="text-[10px] opacity-60" style="color:#3D2B1F;">
            ✦ {{ item.name }} × {{ item.quantity }}
          </li>
        </ul>
        <div class="flex items-center justify-between mt-1">
          <div>
            <p class="text-base font-bold" style="color:#C4828A;">{{ b.bundle_price }} TND</p>
            <p v-if="b.original_price > b.bundle_price" class="text-[10px] line-through opacity-40" style="color:#3D2B1F;">{{ b.original_price }} TND</p>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(b)" class="action-btn">✏</button>
            <button @click="confirmDelete = b.id" class="action-btn action-btn--danger">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box">
        <h3 class="modal-title">{{ editId ? 'Edit Bundle' : 'New Bundle' }}</h3>
        <div class="form-grid">
          <div class="form-group col-span-2">
            <label class="form-label">Bundle Name *</label>
            <input v-model="form.name" class="form-input" placeholder="Pâtisserie Box" />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Description</label>
            <input v-model="form.description" class="form-input" placeholder="A curated set for…" />
          </div>
          <div class="form-group">
            <label class="form-label">Original Price (TND)</label>
            <input v-model.number="form.original_price" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Bundle Price (TND) *</label>
            <input v-model.number="form.bundle_price" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Image URL</label>
            <input v-model="form.image" class="form-input" placeholder="/products/..." />
          </div>

          <!-- Items editor -->
          <div class="form-group col-span-2">
            <label class="form-label">Bundle Items</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <div
                v-for="(item, i) in form.items"
                :key="i"
                class="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold border"
                style="border-color:#f0ebe3; color:#3D2B1F;"
              >
                {{ item.name }} × {{ item.quantity }}
                <button type="button" @click="removeItem(i)" class="ml-1 opacity-50 hover:opacity-100" style="color:#C4828A;">✕</button>
              </div>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
              <input v-model="newItemName" class="form-input" style="max-width:180px;" placeholder="Product name" />
              <input v-model.number="newItemQty" type="number" min="1" class="form-input" style="max-width:70px;" />
              <button type="button" @click="addItem" class="add-btn" style="padding:6px 14px; font-size:10px;">+ Add</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Sort Order</label>
            <input v-model.number="form.sort_order" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex flex-col gap-2 justify-center">
            <label class="checkbox-label"><input type="checkbox" v-model="form.active" class="mr-2" /> Active (visible)</label>
            <label class="checkbox-label"><input type="checkbox" v-model="form.featured" class="mr-2" /> Featured</label>
          </div>
        </div>
        <p v-if="saveError" class="text-xs mt-2 mb-1" style="color:#f87171;">{{ saveError }}</p>
        <div class="flex gap-3 mt-4">
          <button @click="showForm = false" class="cancel-btn">Cancel</button>
          <button @click="save" class="save-btn">{{ editId ? 'Save Changes' : 'Create Bundle' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
      <div class="modal-box" style="max-width:300px; text-align:center;">
        <p class="text-sm font-bold mb-4" style="color:#3D2B1F;">Delete this bundle?</p>
        <div class="flex gap-3">
          <button @click="confirmDelete = null" class="cancel-btn">Cancel</button>
          <button @click="deleteBundle(confirmDelete!)" class="save-btn" style="background:#C4828A;">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-btn { background:#C4828A; color:#fff; border:none; padding:8px 18px; border-radius:20px; font-size:11px; font-weight:700; cursor:pointer; transition:background .2s; }
.add-btn:hover { background:#A85560; }
.badge-green { background:#D6E9DC; color:#5A9E8A; border-radius:20px; padding:2px 8px; font-size:10px; font-weight:700; }
.badge-red   { background:#FDEEF1; color:#C4828A; border-radius:20px; padding:2px 8px; font-size:10px; font-weight:700; }
.action-btn { width:28px; height:28px; border-radius:8px; border:1px solid #f0ebe3; background:#fff; color:#9B86A8; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.action-btn:hover { background:#FFF9F4; border-color:#C4828A; color:#C4828A; }
.action-btn--danger:hover { background:#C4828A; border-color:#C4828A; color:#fff; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:200; padding:16px; }
.modal-box { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; border:1px solid #f0ebe3; }
.modal-title { font-size:18px; font-weight:800; color:#3D2B1F; margin-bottom:20px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.col-span-2 { grid-column:span 2; }
.form-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.15em; color:#9B86A8; }
.form-input { border:1px solid #f0ebe3; border-radius:10px; padding:8px 12px; font-size:12px; color:#3D2B1F; background:#fff; outline:none; width:100%; }
.form-input:focus { border-color:#C4828A; }
.checkbox-label { font-size:12px; color:#3D2B1F; cursor:pointer; }
.cancel-btn { flex:1; padding:10px; border-radius:10px; border:1px solid #f0ebe3; background:#fff; font-size:12px; font-weight:600; color:#3D2B1F; cursor:pointer; }
.save-btn   { flex:1; padding:10px; border-radius:10px; border:none; background:#3D2B1F; font-size:12px; font-weight:700; color:#fff; cursor:pointer; transition:background .2s; }
.save-btn:hover { background:#C4828A; }
</style>
