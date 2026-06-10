<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface DBProduct {
  id: string; created_at: string; name: string; subheader: string; category: string
  price: number; final_price: number | null; description: string; features: string
  src: string; nu: boolean; in_stock: boolean; featured: boolean; sort_order: number
  quantity: number | null; shades: { name: string; hex: string }[]
  sale_start: string | null; sale_end: string | null
  alt_src: string | null
  packaging: 'included' | 'optional'
}

const products = ref<DBProduct[]>([])
const loading  = ref(false)
const showForm = ref(false)
const editId   = ref<string | null>(null)
const confirmDelete = ref<string | null>(null)
const saveError = ref('')

// ── Migration check ──────────────────────────────────────────────────────
const missingCols = ref<string[]>([])
const migrationOk = ref<boolean | null>(null)

const migrationSQL = `alter table products add column if not exists alt_src    text;
alter table products add column if not exists quantity   integer;
alter table products add column if not exists shades     jsonb default '[]';
alter table products add column if not exists sale_start timestamptz;
alter table products add column if not exists sale_end   timestamptz;`

async function checkMigration() {
  try {
    const res = await fetch(`${props.apiUrl}/api/products/migration-status`, {
      headers: { Authorization: `Bearer ${props.authToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      migrationOk.value = data.ok
      missingCols.value  = data.missingColumns
    }
  } catch { /* ignore — don't block the UI */ }
}

function copySql() {
  navigator.clipboard.writeText(migrationSQL).catch(() => {})
}
// ────────────────────────────────────────────────────────────────────────

const blank = (): Omit<DBProduct, 'id' | 'created_at'> => ({
  name: '', subheader: '', category: 'lipgloss', price: 0, final_price: null,
  description: '', features: '', src: '', alt_src: null,
  nu: false, in_stock: true, featured: false, sort_order: 0,
  quantity: null, shades: [], sale_start: null, sale_end: null, packaging: 'optional',
})

const newShadeName   = ref('')
const newShadeHex    = ref('#C4828A')
const uploadStatus    = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const uploadAltStatus = ref<'idle' | 'loading' | 'done' | 'error'>('idle')

async function uploadImage(file: File, field: 'src' | 'alt_src', statusRef: typeof uploadStatus) {
  statusRef.value = 'loading'
  const reader = new FileReader()
  reader.onload = async () => {
    const base64 = (reader.result as string).split(',')[1]
    const ext = file.name.split('.').pop() ?? 'jpg'
    try {
      const res = await fetch(`${props.apiUrl}/api/upload/product-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.authToken}` },
        body: JSON.stringify({ base64, contentType: file.type, ext }),
      })
      if (res.ok) {
        form.value[field] = (await res.json()).url
        statusRef.value = 'done'
      } else {
        statusRef.value = 'error'
      }
    } catch { statusRef.value = 'error' }
  }
  reader.readAsDataURL(file)
}

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) uploadImage(file, 'src', uploadStatus)
}

function handleAltImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) uploadImage(file, 'alt_src', uploadAltStatus)
}

function addShade() {
  if (!newShadeName.value.trim()) return
  form.value.shades = [...(form.value.shades ?? []), { name: newShadeName.value.trim(), hex: newShadeHex.value }]
  newShadeName.value = ''
  newShadeHex.value  = '#C4828A'
}
function removeShade(i: number) {
  form.value.shades = form.value.shades.filter((_, idx) => idx !== i)
}
const form = ref(blank())

const CATEGORY_OPTIONS = ['lipgloss']

async function fetchProducts() {
  loading.value = true
  const res = await fetch(`${props.apiUrl}/api/products/all`, {
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  products.value = await res.json()
  loading.value = false
}

function openAdd() {
  form.value = blank()
  editId.value = null
  saveError.value = ''
  uploadStatus.value = 'idle'
  uploadAltStatus.value = 'idle'
  showForm.value = true
}

function toDateTimeLocal(iso: string | null): string | null {
  if (!iso) return null
  return iso.slice(0, 16) // "YYYY-MM-DDTHH:mm" required by datetime-local
}

function openEdit(p: DBProduct) {
  form.value = {
    ...p,
    sale_start: toDateTimeLocal(p.sale_start),
    sale_end:   toDateTimeLocal(p.sale_end),
  }
  editId.value = p.id
  saveError.value = ''
  uploadStatus.value = 'idle'
  uploadAltStatus.value = 'idle'
  showForm.value = true
}

async function save() {
  saveError.value = ''
  if (!form.value.name.trim() || !form.value.category || !form.value.price) {
    saveError.value = 'Name, category and price are required.'
    return
  }
  const body = { ...form.value }
  if (!body.final_price) body.final_price = null
  if (!body.sale_start)  body.sale_start  = null
  if (!body.sale_end)    body.sale_end    = null

  const url = editId.value
    ? `${props.apiUrl}/api/products/${editId.value}`
    : `${props.apiUrl}/api/products`
  const method = editId.value ? 'PATCH' : 'POST'

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.authToken}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    saveError.value = (err as any).error || 'Save failed'
    return
  }
  showForm.value = false
  await fetchProducts()
}

async function deleteProduct(id: string) {
  await fetch(`${props.apiUrl}/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${props.authToken}` },
  })
  confirmDelete.value = null
  await fetchProducts()
}

const CATEGORY_LABELS: Record<string, string> = { lipgloss: 'Lip Gloss' }

// ── Bulk quantity edit ───────────────────────────────
const bulkEditMode  = ref(false)
const editQtys      = ref<Record<string, number | null>>({})
const bulkSaving    = ref(false)

function startBulkEdit() {
  editQtys.value = {}
  products.value.forEach(p => { editQtys.value[p.id] = p.quantity })
  bulkEditMode.value = true
}

function cancelBulkEdit() {
  bulkEditMode.value = false
  editQtys.value = {}
}

const changedIds = computed(() =>
  products.value.filter(p => editQtys.value[p.id] !== p.quantity).map(p => p.id)
)

async function saveBulkEdit() {
  bulkSaving.value = true
  await Promise.all(
    changedIds.value.map(id =>
      fetch(`${props.apiUrl}/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
        body: JSON.stringify({
          quantity: editQtys.value[id],
          in_stock: editQtys.value[id] === null || editQtys.value[id]! > 0,
        }),
      })
    )
  )
  bulkEditMode.value = false
  bulkSaving.value = false
  await fetchProducts()
}
// ────────────────────────────────────────────────────

onMounted(() => { fetchProducts(); checkMigration() })
</script>

<template>
  <div>
    <!-- Migration warning -->
    <div v-if="migrationOk === false" class="migration-banner">
      <div class="migration-top">
        <span class="migration-icon">⚠</span>
        <div>
          <p class="migration-title">Database needs migration</p>
          <p class="migration-sub">
            Columns missing: <strong>{{ missingCols.join(', ') }}</strong>.<br />
            Until you run this SQL, the lifestyle image (2nd slide) and other fields will not save.
          </p>
        </div>
      </div>
      <details class="migration-details">
        <summary>Show SQL to run in Supabase</summary>
        <pre class="migration-pre">{{ migrationSQL }}</pre>
        <div class="flex gap-2 mt-2 flex-wrap items-center">
          <button @click="copySql" class="migration-copy-btn">Copy SQL</button>
          <a href="https://supabase.com/dashboard/project/hwkgxkpzbbzoturspxur/editor" target="_blank" rel="noopener" class="migration-link">
            Open Supabase SQL Editor →
          </a>
        </div>
        <p class="text-[10px] mt-2 opacity-60" style="color:#92400e;">
          After running, refresh this page and the warning will disappear.
        </p>
      </details>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <p class="text-xs opacity-50" style="color:#3D2B1F;">{{ products.length }} products</p>
      <div class="flex gap-2 flex-wrap">
        <!-- Bulk edit controls -->
        <template v-if="bulkEditMode">
          <span class="text-[10px] font-bold uppercase tracking-widest self-center opacity-50" style="color:#3D2B1F;">{{ changedIds.length }} changed</span>
          <button @click="cancelBulkEdit" class="cancel-bulk-btn">Cancel</button>
          <button @click="saveBulkEdit" :disabled="bulkSaving || changedIds.length === 0" class="save-bulk-btn">
            {{ bulkSaving ? 'Saving…' : 'Save Quantities' }}
          </button>
        </template>
        <button v-else @click="startBulkEdit" class="bulk-qty-btn">✏ Edit Quantities</button>
        <button @click="openAdd" class="add-btn">+ Add Product</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <!-- Product table -->
    <div v-else class="overflow-x-auto rounded-xl" style="border:1px solid #f0ebe3;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#FFF9F4; border-bottom:1px solid #f0ebe3;">
            <th class="th">Image</th>
            <th class="th">Name</th>
            <th class="th">Category</th>
            <th class="th">Price</th>
            <th class="th">Sale</th>
            <th class="th">Qty</th>
            <th class="th">Stock</th>
            <th class="th">New</th>
            <th class="th">Featured</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in products"
            :key="p.id"
            class="product-row"
            :style="p.quantity !== null && p.quantity <= 5 && p.in_stock ? 'background:#FFF5F5;' : ''"
          >
            <td class="td">
              <img v-if="p.src" :src="p.src" :alt="p.name" class="w-10 h-10 object-contain rounded" style="background:#FFF9F4;" />
              <div v-else class="w-10 h-10 rounded" style="background:#f0ebe3;"></div>
            </td>
            <td class="td font-semibold" style="color:#3D2B1F;">
              {{ p.name }}<br>
              <span class="text-[10px] opacity-50">{{ p.subheader }}</span>
            </td>
            <td class="td">
              <span class="category-tag">{{ CATEGORY_LABELS[p.category] || p.category }}</span>
            </td>
            <td class="td font-bold" style="color:#3D2B1F;">{{ p.price }} TND</td>
            <td class="td" style="color:#C4828A;">
              {{ p.final_price != null ? p.final_price + ' TND' : '—' }}
              <span v-if="p.sale_start || p.sale_end" class="block text-[9px] opacity-60" style="color:#C9A45A;">
                {{ p.sale_start ? new Date(p.sale_start).toLocaleDateString('fr-FR') : '∞' }}–{{ p.sale_end ? new Date(p.sale_end).toLocaleDateString('fr-FR') : '∞' }}
              </span>
            </td>
            <td class="td">
              <input
                v-if="bulkEditMode"
                v-model.number="editQtys[p.id]"
                type="number"
                min="0"
                placeholder="∞"
                class="qty-inline-input"
                :style="editQtys[p.id] !== p.quantity ? 'border-color:#C9A45A; background:#FFFBF4;' : ''"
              />
              <template v-else>
                <span :style="p.quantity !== null && p.quantity <= 5 ? 'color:#C4828A; font-weight:800;' : 'color:#3D2B1F;'">
                  {{ p.quantity ?? '∞' }}
                </span>
                <span v-if="p.quantity !== null && p.quantity <= 5" class="ml-1 text-[9px]">⚠️</span>
              </template>
            </td>
            <td class="td"><span :class="p.in_stock ? 'badge-green' : 'badge-red'">{{ p.in_stock ? 'Yes' : 'No' }}</span></td>
            <td class="td"><span :class="p.nu ? 'badge-rose' : 'badge-gray'">{{ p.nu ? 'Yes' : 'No' }}</span></td>
            <td class="td"><span :class="p.featured ? 'badge-gold' : 'badge-gray'">{{ p.featured ? 'Yes' : 'No' }}</span></td>
            <td class="td">
              <div class="flex gap-2">
                <button @click="openEdit(p)" class="action-btn" title="Edit">✏</button>
                <button @click="confirmDelete = p.id" class="action-btn action-btn--danger" title="Delete">✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box">
        <h3 class="modal-title">{{ editId ? 'Edit Product' : 'Add Product' }}</h3>

        <div class="form-grid">
          <div class="form-group col-span-2">
            <label class="form-label">Name *</label>
            <input v-model="form.name" class="form-input" placeholder="Chantilly" />
          </div>
          <div class="form-group">
            <label class="form-label">Subheader</label>
            <input v-model="form.subheader" class="form-input" placeholder="Blush" />
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select v-model="form.category" class="form-input">
              <option v-for="c in CATEGORY_OPTIONS" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Price (TND) *</label>
            <input v-model.number="form.price" type="number" min="0" class="form-input" placeholder="28" />
          </div>
          <div class="form-group">
            <label class="form-label">Sale Price (TND)</label>
            <input v-model.number="form.final_price" type="number" min="0" class="form-input" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label class="form-label">Sale Start (optional)</label>
            <input v-model="form.sale_start" type="datetime-local" class="form-input" :disabled="!form.final_price" />
            <p class="text-[9px] opacity-40 mt-0.5" style="color:#3D2B1F;">Leave blank for immediate</p>
          </div>
          <div class="form-group">
            <label class="form-label">Sale End (optional)</label>
            <input v-model="form.sale_end" type="datetime-local" class="form-input" :disabled="!form.final_price" />
            <p class="text-[9px] opacity-40 mt-0.5" style="color:#3D2B1F;">Leave blank for no expiry</p>
          </div>
          <!-- Main product image -->
          <div class="form-group">
            <label class="form-label">Product Image (main)</label>
            <label class="upload-img-btn">
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
              <span v-if="uploadStatus === 'loading'">Uploading…</span>
              <span v-else>↑ Upload</span>
            </label>
            <span v-if="uploadStatus === 'done'"  class="block text-[10px] font-semibold mt-1" style="color:#5A9E8A;">✓ Uploaded</span>
            <span v-if="uploadStatus === 'error'" class="block text-[10px] mt-1" style="color:#f87171;">Upload failed</span>
            <img v-if="form.src" :src="form.src" class="mt-2 h-20 object-contain rounded" style="background:#FFF9F4; border:1px solid #f0ebe3;" />
            <input v-model="form.src" class="form-input mt-2" placeholder="Or paste URL / path" />
          </div>

          <!-- Lifestyle / second image -->
          <div class="form-group">
            <label class="form-label">Lifestyle Image (2nd slide)</label>
            <label class="upload-img-btn">
              <input type="file" accept="image/*" class="hidden" @change="handleAltImageUpload" />
              <span v-if="uploadAltStatus === 'loading'">Uploading…</span>
              <span v-else>↑ Upload</span>
            </label>
            <span v-if="uploadAltStatus === 'done'"  class="block text-[10px] font-semibold mt-1" style="color:#5A9E8A;">✓ Uploaded</span>
            <span v-if="uploadAltStatus === 'error'" class="block text-[10px] mt-1" style="color:#f87171;">Upload failed</span>
            <img v-if="form.alt_src" :src="form.alt_src" class="mt-2 h-20 object-contain rounded" style="background:#FFF9F4; border:1px solid #f0ebe3;" />
            <input v-model="form.alt_src" class="form-input mt-2" placeholder="Or paste URL / path" />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-input" rows="3" placeholder="Product description…" style="resize:none;"></textarea>
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Features</label>
            <input v-model="form.features" class="form-input" placeholder="Long-wearing · Cruelty-free" />
          </div>
          <div class="form-group">
            <label class="form-label">Sort Order</label>
            <input v-model.number="form.sort_order" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Quantity in Stock</label>
            <input v-model.number="form.quantity" type="number" min="0" class="form-input" placeholder="Leave empty for unlimited" />
            <p class="text-[10px] opacity-50 mt-1" style="color:#3D2B1F;">Auto marks out-of-stock when it hits 0</p>
          </div>
          <div class="form-group flex flex-col gap-2 justify-center">
            <label class="checkbox-label"><input type="checkbox" v-model="form.in_stock" class="mr-2" /> In Stock</label>
            <label class="checkbox-label"><input type="checkbox" v-model="form.nu" class="mr-2" /> New badge</label>
            <label class="checkbox-label"><input type="checkbox" v-model="form.featured" class="mr-2" /> Featured on homepage</label>
          </div>

          <!-- Packaging behaviour -->
          <div class="form-group">
            <label class="form-label">Packaging</label>
            <div class="flex flex-col gap-2 mt-1">
              <label class="checkbox-label">
                <input
                  type="radio"
                  v-model="form.packaging"
                  value="optional"
                  class="mr-2 accent-rose-400"
                />
                <span>🎀 <strong>Optional</strong> — customer can add gift packaging for a fee</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="radio"
                  v-model="form.packaging"
                  value="included"
                  class="mr-2 accent-rose-400"
                />
                <span>🎀 <strong>Always included (free)</strong> — packaging is automatic, no charge</span>
              </label>
            </div>
            <p class="form-hint mt-1">Use "Always included" for sets and bundles.</p>
          </div>

          <!-- Shades editor -->
          <div class="form-group col-span-2">
            <label class="form-label">Colour Shades</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <div
                v-for="(s, i) in form.shades"
                :key="i"
                class="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold border"
                style="border-color:#f0ebe3; color:#3D2B1F;"
              >
                <span class="inline-block h-4 w-4 rounded-full border" :style="{ background: s.hex }" style="border-color:#e0d9d0;"></span>
                {{ s.name }}
                <button type="button" @click="removeShade(i)" class="ml-1 text-xs opacity-50 hover:opacity-100" style="color:#C4828A;">✕</button>
              </div>
              <span v-if="!form.shades?.length" class="text-[10px] opacity-40" style="color:#3D2B1F;">No shades added yet</span>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
              <input v-model="newShadeName" class="form-input" style="max-width:140px;" placeholder="Shade name" />
              <input type="color" v-model="newShadeHex" class="h-9 w-12 rounded-lg border cursor-pointer" style="border-color:#f0ebe3; padding:2px;" />
              <span class="text-[10px] opacity-60" style="color:#3D2B1F;">{{ newShadeHex }}</span>
              <button type="button" @click="addShade" class="add-btn" style="padding:6px 14px; font-size:10px;">+ Add</button>
            </div>
          </div>
        </div>

        <p v-if="saveError" class="text-xs mt-2 mb-1" style="color:#f87171;">{{ saveError }}</p>
        <div class="flex gap-3 mt-4">
          <button @click="showForm = false" class="cancel-btn">Cancel</button>
          <button @click="save" class="save-btn">{{ editId ? 'Save Changes' : 'Add Product' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
      <div class="modal-box" style="max-width:300px; text-align:center;">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Delete this product?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">It will be removed from the store.</p>
        <div class="flex gap-3">
          <button @click="confirmDelete = null" class="cancel-btn">Cancel</button>
          <button @click="deleteProduct(confirmDelete!)" class="save-btn" style="background:#C4828A;">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-btn {
  background: #C4828A; color: #fff; border: none;
  padding: 8px 18px; border-radius: 20px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.add-btn:hover { background: #A85560; }

.th {
  padding: 10px 14px;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.15em; color: #9B86A8; text-align: left;
  white-space: nowrap;
}
.td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0ebe3;
  color: #3D2B1F; font-size: 12px; vertical-align: middle;
}
.product-row:last-child .td { border-bottom: none; }

.category-tag {
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 20px; padding: 2px 8px;
  font-size: 10px; font-weight: 600; color: #3D2B1F;
}
.badge-green  { background: #D6E9DC; color: #5A9E8A; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; }
.badge-red    { background: #FDEEF1; color: #C4828A; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; }
.badge-rose   { background: #F7D9E0; color: #C4828A; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; }
.badge-gold   { background: #FFF9F4; color: #C9A45A; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; border: 1px solid #f0ebe3; }
.badge-gray   { background: #f0ebe3; color: #9CA3AF; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 700; }

.action-btn {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid #f0ebe3; background: #fff;
  color: #9B86A8; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.action-btn:hover { background: #FFF9F4; border-color: #C4828A; color: #C4828A; }
.action-btn--danger:hover { background: #C4828A; border-color: #C4828A; color: #fff; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal-box {
  background: #fff; border-radius: 20px;
  padding: 28px; width: 100%; max-width: 560px;
  max-height: 90vh; overflow-y: auto;
  border: 1px solid #f0ebe3;
}
.modal-title {
  font-size: 18px; font-weight: 800; color: #3D2B1F; margin-bottom: 20px;
}
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.form-group { display: flex; flex-direction: column; gap: 4px; }
.col-span-2 { grid-column: span 2; }
.form-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.15em; color: #9B86A8;
}
.form-input {
  border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 8px 12px; font-size: 12px; color: #3D2B1F;
  background: #fff; outline: none; width: 100%;
}
.form-input:focus { border-color: #C4828A; }
.checkbox-label { font-size: 12px; color: #3D2B1F; cursor: pointer; }
.cancel-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 12px; font-weight: 600; color: #3D2B1F; cursor: pointer;
}
.save-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: none; background: #3D2B1F;
  font-size: 12px; font-weight: 700; color: #fff; cursor: pointer;
  transition: background 0.2s;
}
.save-btn:hover { background: #C4828A; }

.bulk-qty-btn {
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 10px; font-weight: 700; color: #9B86A8;
  cursor: pointer; transition: all 0.2s;
}
.bulk-qty-btn:hover { color: #C4828A; border-color: #C4828A; }

.cancel-bulk-btn {
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 10px; font-weight: 700; color: #3D2B1F;
  cursor: pointer;
}
.save-bulk-btn {
  padding: 7px 14px; border-radius: 20px;
  border: none; background: #3D2B1F;
  font-size: 10px; font-weight: 700; color: #fff;
  cursor: pointer; transition: background 0.2s;
}
.save-bulk-btn:hover:not(:disabled) { background: #C4828A; }
.save-bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.upload-img-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px; cursor: pointer;
  border: 1.5px dashed #C4828A; color: #C4828A;
  font-size: 11px; font-weight: 700;
  transition: background 0.2s;
}
.upload-img-btn:hover { background: #FFF0F2; }

.qty-inline-input {
  width: 64px; border: 1px solid #f0ebe3; border-radius: 8px;
  padding: 4px 8px; font-size: 12px; color: #3D2B1F;
  background: #fff; outline: none; text-align: center;
  transition: border-color 0.2s;
}
.qty-inline-input:focus { border-color: #C4828A; }

.migration-banner {
  background: #FFFBEB; border: 1.5px solid #F59E0B;
  border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;
}
.migration-top { display: flex; gap: 12px; align-items: flex-start; }
.migration-icon { font-size: 20px; flex-shrink: 0; line-height: 1; color: #D97706; }
.migration-title { font-size: 13px; font-weight: 800; color: #92400E; margin-bottom: 4px; }
.migration-sub { font-size: 11px; color: #92400E; line-height: 1.5; }
.migration-details { margin-top: 14px; }
.migration-details summary {
  font-size: 11px; font-weight: 700; color: #B45309; cursor: pointer; user-select: none;
}
.migration-pre {
  margin-top: 10px; background: #1C1917; color: #FDE68A;
  border-radius: 10px; padding: 12px 14px;
  font-size: 11px; line-height: 1.7; overflow-x: auto; white-space: pre;
}
.migration-copy-btn {
  padding: 6px 14px; border-radius: 20px; border: none;
  background: #D97706; color: #fff;
  font-size: 10px; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.migration-copy-btn:hover { background: #B45309; }
.migration-link {
  font-size: 10px; font-weight: 700; color: #B45309; text-decoration: underline;
}
</style>
