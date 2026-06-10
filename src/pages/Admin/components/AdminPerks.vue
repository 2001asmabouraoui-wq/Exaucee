<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Perk {
  id: number
  threshold: number
  topText: string
  subText: string
  giftName: string
  emoji: string
  active: boolean
}

const perks   = ref<Perk[]>([])
const loading = ref(false)
const saving  = ref(false)
const saved   = ref(false)
const error   = ref('')

const EMOJI_OPTIONS = ['🎀','✨','🌸','🐰','💝','🎁','💄','🛍️','⭐','🌟']

function blank(): Perk {
  return { id: Date.now(), threshold: 50, topText: '', subText: '', giftName: '', emoji: '🎀', active: true }
}

async function fetchPerks() {
  loading.value = true
  try {
    const res = await fetch(`${props.apiUrl}/api/perks`)
    if (res.ok) perks.value = await res.json()
  } catch { /* keep empty */ } finally {
    loading.value = false
  }
}

async function saveAll() {
  saving.value = true
  error.value  = ''
  saved.value  = false
  try {
    const res = await fetch(`${props.apiUrl}/api/perks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
      body: JSON.stringify(perks.value),
    })
    if (res.ok) { saved.value = true; setTimeout(() => saved.value = false, 2500) }
    else error.value = 'Save failed. Please try again.'
  } catch { error.value = 'Network error.' } finally { saving.value = false }
}

function addPerk() { perks.value = [...perks.value, blank()] }
function removePerk(id: number) { perks.value = perks.value.filter(p => p.id !== id) }

onMounted(fetchPerks)
</script>

<template>
  <div>
    <div class="mb-5 flex items-start justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs opacity-50 mt-1 max-w-lg" style="color:#3D2B1F;">
          These perks appear in the bar below the hero on the home page, in the cart panel, and in the checkout summary.
          Perks with a threshold &gt; 0 and a gift name are automatically shown as free gifts in the cart when the customer's total qualifies.
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <span v-if="saved" class="text-[10px] font-bold uppercase tracking-widest" style="color:#5A9E8A;">✓ Saved</span>
        <span v-if="error" class="text-[10px]" style="color:#f87171;">{{ error }}</span>
        <button @click="addPerk" class="add-btn">+ Add Perk</button>
        <button @click="saveAll" :disabled="saving" class="save-btn">{{ saving ? 'Saving…' : 'Save All' }}</button>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="perk in perks"
        :key="perk.id"
        class="perk-card"
        :class="{ 'perk-card--inactive': !perk.active }"
      >
        <!-- Active toggle -->
        <div class="perk-active-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="perk.active" class="mr-1.5" />
            {{ perk.active ? 'Active' : 'Hidden' }}
          </label>
          <button @click="removePerk(perk.id)" class="delete-btn" title="Remove perk">✕ Remove</button>
        </div>

        <div class="perk-grid">
          <!-- Emoji -->
          <div class="form-group">
            <label class="form-label">Emoji</label>
            <div class="emoji-picker">
              <button
                v-for="e in EMOJI_OPTIONS"
                :key="e"
                @click="perk.emoji = e"
                class="emoji-btn"
                :class="{ 'emoji-btn--active': perk.emoji === e }"
              >{{ e }}</button>
            </div>
            <input v-model="perk.emoji" class="form-input mt-1" placeholder="Or type any emoji" style="max-width:100px;" />
          </div>

          <!-- Threshold -->
          <div class="form-group">
            <label class="form-label">Cart Threshold (TND)</label>
            <input v-model.number="perk.threshold" type="number" min="0" class="form-input" />
            <p class="form-hint">Set to 0 to show always (no cart requirement)</p>
          </div>

          <!-- Top text -->
          <div class="form-group">
            <label class="form-label">Top Text (bold)</label>
            <input v-model="perk.topText" class="form-input" placeholder="Dès 50 TND" />
            <p class="form-hint">Shown in uppercase, bold. e.g. "Dès 50 TND"</p>
          </div>

          <!-- Sub text -->
          <div class="form-group">
            <label class="form-label">Sub Text</label>
            <input v-model="perk.subText" class="form-input" placeholder="Pochette ruban offerte" />
            <p class="form-hint">Shown below the top text, smaller.</p>
          </div>

          <!-- Gift name -->
          <div class="form-group col-span-2">
            <label class="form-label">Gift Name (for cart & checkout)</label>
            <input v-model="perk.giftName" class="form-input" placeholder="Pochette Ruban Exaucée" />
            <p class="form-hint">When a customer qualifies, this appears as a free item in their cart and checkout. Leave empty to make this a badge only (no cart gift).</p>
          </div>
        </div>

        <!-- Preview -->
        <div class="perk-preview">
          <span class="text-2xl">{{ perk.emoji }}</span>
          <div>
            <p class="preview-top">{{ perk.topText || 'Top text…' }}</p>
            <p class="preview-sub">{{ perk.subText || 'Sub text…' }}</p>
          </div>
          <div v-if="perk.giftName" class="flex items-center gap-2 ml-auto">
            <span class="text-xs font-bold" style="color:#3D2B1F;">🎁 {{ perk.giftName }}</span>
            <span class="text-[9px] font-black rounded-full px-2 py-0.5 uppercase tracking-widest" style="background:#D6E9DC; color:#5A9E8A;">Offert</span>
          </div>
        </div>
      </div>

      <div v-if="perks.length === 0" class="empty-state">
        No perks configured. Click "+ Add Perk" to get started.
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-btn {
  padding: 8px 16px; border-radius: 20px;
  border: 1.5px dashed #C4828A; background: transparent;
  color: #C4828A; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.add-btn:hover { background: #FFF0F2; }

.save-btn {
  padding: 8px 20px; border-radius: 20px; border: none;
  background: #3D2B1F; color: #fff;
  font-size: 10px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.save-btn:hover:not(:disabled) { background: #C4828A; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.perk-card {
  border: 1px solid #f0ebe3; border-radius: 16px;
  background: #fff; padding: 18px 20px;
  transition: opacity 0.2s;
}
.perk-card--inactive { opacity: 0.55; }

.perk-active-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.checkbox-label { font-size: 11px; font-weight: 700; color: #3D2B1F; cursor: pointer; }

.delete-btn {
  font-size: 10px; font-weight: 700; color: #C4828A;
  background: none; border: none; cursor: pointer; opacity: 0.6;
  transition: opacity 0.15s;
}
.delete-btn:hover { opacity: 1; }

.perk-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  margin-bottom: 16px;
}
.col-span-2 { grid-column: span 2; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9B86A8; }
.form-input {
  border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 7px 10px; font-size: 12px; color: #3D2B1F;
  background: #fff; outline: none; width: 100%;
}
.form-input:focus { border-color: #C4828A; }
.form-hint { font-size: 9px; color: #9B86A8; line-height: 1.4; }

.emoji-picker { display: flex; flex-wrap: wrap; gap: 4px; }
.emoji-btn {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 14px; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.emoji-btn:hover   { background: #FFF9F4; border-color: #C4828A; }
.emoji-btn--active { background: #FFF0F2; border-color: #C4828A; }

.perk-preview {
  display: flex; align-items: center; gap: 12px;
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 12px; padding: 10px 14px;
}
.preview-top { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #C4828A; }
.preview-sub { font-size: 11px; color: #3D2B1F; opacity: 0.6; }

.empty-state {
  border: 1.5px dashed #f0ebe3; border-radius: 14px;
  padding: 30px; text-align: center;
  font-size: 12px; color: #9B86A8;
}
</style>
