<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface DBProduct {
  id: string
  name: string
  subheader: string
  category: string
  src: string
  featured: boolean
  sort_order: number
  in_stock: boolean
}

const products = ref<DBProduct[]>([])
const loading  = ref(false)
const saving   = ref<string | null>(null)

const ACCENT_COLORS = ['#EEF4FB', '#FDEEF1', '#FDF0E2', '#EEF9F4', '#FBF0F9']

const slides = computed(() =>
  products.value.filter(p => p.featured).sort((a, b) => a.sort_order - b.sort_order)
)

const available = computed(() =>
  products.value.filter(p => !p.featured).sort((a, b) => a.sort_order - b.sort_order)
)

async function fetchProducts() {
  loading.value = true
  const res = await fetch(`${props.apiUrl}/api/products/all`, {
    headers: { Authorization: `Bearer ${props.authToken}` },
  })
  products.value = await res.json()
  loading.value = false
}

async function patch(id: string, updates: object) {
  saving.value = id
  await fetch(`${props.apiUrl}/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
    body: JSON.stringify(updates),
  })
  saving.value = null
}

async function addToCarousel(p: DBProduct) {
  // Give it the next sort_order after the last slide
  const maxOrder = slides.value.length > 0
    ? Math.max(...slides.value.map(s => s.sort_order))
    : -1
  await patch(p.id, { featured: true, sort_order: maxOrder + 1 })
  p.featured   = true
  p.sort_order = maxOrder + 1
}

async function removeFromCarousel(p: DBProduct) {
  await patch(p.id, { featured: false })
  p.featured = false
}

async function moveUp(p: DBProduct) {
  const list = slides.value
  const idx  = list.findIndex(s => s.id === p.id)
  if (idx <= 0) return
  const other = list[idx - 1]
  const tmp   = p.sort_order
  await patch(p.id,    { sort_order: other.sort_order })
  await patch(other.id, { sort_order: tmp })
  p.sort_order     = other.sort_order
  other.sort_order = tmp
}

async function moveDown(p: DBProduct) {
  const list = slides.value
  const idx  = list.findIndex(s => s.id === p.id)
  if (idx >= list.length - 1) return
  const other = list[idx + 1]
  const tmp   = p.sort_order
  await patch(p.id,    { sort_order: other.sort_order })
  await patch(other.id, { sort_order: tmp })
  p.sort_order     = other.sort_order
  other.sort_order = tmp
}

onMounted(fetchProducts)
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-xs opacity-50 mt-1" style="color:#3D2B1F;">
        The hero carousel on the home page shows products marked as <strong>Featured</strong>, in order. Add, remove, or reorder them below.
      </p>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <div v-else class="flex flex-col gap-8">

      <!-- Current carousel slides -->
      <div>
        <h3 class="section-title">In Carousel <span class="section-count">{{ slides.length }}</span></h3>

        <div v-if="slides.length === 0" class="empty-state">
          No products in the carousel. Add one below.
        </div>

        <div v-else class="slides-list">
          <div
            v-for="(slide, i) in slides"
            :key="slide.id"
            class="slide-card"
          >
            <!-- Accent strip -->
            <div class="slide-accent" :style="{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }"></div>

            <!-- Product image -->
            <div class="slide-img-wrap" :style="{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }">
              <img v-if="slide.src" :src="slide.src" :alt="slide.name" class="slide-img" />
              <div v-else class="slide-img-placeholder"></div>
            </div>

            <!-- Info -->
            <div class="slide-info">
              <p class="slide-name">{{ slide.name }}</p>
              <p class="slide-sub">{{ slide.subheader }}</p>
              <span class="slide-pos">Slide {{ i + 1 }}</span>
            </div>

            <!-- Actions -->
            <div class="slide-actions">
              <button
                @click="moveUp(slide)"
                :disabled="i === 0 || saving === slide.id"
                class="icon-btn"
                title="Move up"
              >↑</button>
              <button
                @click="moveDown(slide)"
                :disabled="i === slides.length - 1 || saving === slide.id"
                class="icon-btn"
                title="Move down"
              >↓</button>
              <button
                @click="removeFromCarousel(slide)"
                :disabled="saving === slide.id"
                class="icon-btn icon-btn--danger"
                title="Remove from carousel"
              >✕</button>
            </div>

            <div v-if="saving === slide.id" class="saving-badge">Saving…</div>
          </div>
        </div>
      </div>

      <!-- Available products -->
      <div v-if="available.length > 0">
        <h3 class="section-title">Add to Carousel</h3>
        <div class="available-list">
          <div
            v-for="p in available"
            :key="p.id"
            class="available-card"
          >
            <img v-if="p.src" :src="p.src" :alt="p.name" class="avail-img" />
            <div v-else class="avail-img-placeholder"></div>
            <div class="avail-info">
              <p class="avail-name">{{ p.name }}</p>
              <p class="avail-sub">{{ p.subheader }}</p>
            </div>
            <button
              @click="addToCarousel(p)"
              :disabled="saving === p.id"
              class="add-slide-btn"
            >{{ saving === p.id ? '…' : '+ Add' }}</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.18em; color: #9B86A8; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.section-count {
  background: #f0ebe3; color: #9B86A8;
  border-radius: 20px; padding: 1px 8px;
  font-size: 10px; font-weight: 700;
}

.empty-state {
  border: 1.5px dashed #f0ebe3; border-radius: 14px;
  padding: 24px; text-align: center;
  font-size: 12px; color: #9B86A8;
}

.slides-list { display: flex; flex-direction: column; gap: 10px; }

.slide-card {
  display: flex; align-items: center; gap: 14px;
  border: 1px solid #f0ebe3; border-radius: 14px;
  padding: 12px 16px; background: #fff;
  position: relative; overflow: hidden;
}
.slide-accent {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 4px; border-radius: 4px 0 0 4px;
}
.slide-img-wrap {
  width: 56px; height: 56px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.slide-img { width: 100%; height: 100%; object-fit: contain; }
.slide-img-placeholder { width: 100%; height: 100%; background: #f0ebe3; border-radius: 10px; }

.slide-info { flex: 1; min-width: 0; }
.slide-name { font-size: 13px; font-weight: 800; color: #3D2B1F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slide-sub  { font-size: 11px; color: #9B86A8; margin-top: 2px; }
.slide-pos  {
  display: inline-block; margin-top: 4px;
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 20px; padding: 1px 8px;
  font-size: 9px; font-weight: 700; color: #C9A45A; text-transform: uppercase; letter-spacing: 0.1em;
}

.slide-actions { display: flex; gap: 6px; flex-shrink: 0; }

.icon-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid #f0ebe3; background: #fff;
  color: #9B86A8; cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover:not(:disabled) { border-color: #C4828A; color: #C4828A; background: #FFF9F4; }
.icon-btn--danger:hover:not(:disabled) { background: #C4828A; border-color: #C4828A; color: #fff; }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.saving-badge {
  position: absolute; right: 12px; top: 8px;
  font-size: 9px; font-weight: 700; color: #C9A45A; text-transform: uppercase; letter-spacing: 0.1em;
}

.available-list { display: flex; flex-direction: column; gap: 8px; }
.available-card {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid #f0ebe3; border-radius: 12px;
  padding: 10px 14px; background: #FAFAF9;
}
.avail-img { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: #f0ebe3; }
.avail-img-placeholder { width: 40px; height: 40px; background: #f0ebe3; border-radius: 8px; flex-shrink: 0; }
.avail-info { flex: 1; }
.avail-name { font-size: 12px; font-weight: 700; color: #3D2B1F; }
.avail-sub  { font-size: 10px; color: #9B86A8; }

.add-slide-btn {
  padding: 6px 16px; border-radius: 20px; border: none;
  background: #3D2B1F; color: #fff;
  font-size: 10px; font-weight: 700; cursor: pointer;
  transition: background 0.2s; flex-shrink: 0;
}
.add-slide-btn:hover:not(:disabled) { background: #C4828A; }
.add-slide-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
