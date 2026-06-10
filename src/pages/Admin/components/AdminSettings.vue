<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

const packagingPrice = ref(2)
const loading = ref(false)
const saving  = ref(false)
const saved   = ref(false)
const error   = ref('')

async function fetchSettings() {
  loading.value = true
  try {
    const res = await fetch(`${props.apiUrl}/api/settings`)
    if (res.ok) {
      const data = await res.json()
      if (data.packaging_price != null) packagingPrice.value = Number(data.packaging_price)
    }
  } catch { /* keep default */ } finally {
    loading.value = false
  }
}

async function savePackagingPrice() {
  saving.value = true
  error.value  = ''
  saved.value  = false
  try {
    const res = await fetch(`${props.apiUrl}/api/settings/packaging_price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
      body: JSON.stringify({ value: String(packagingPrice.value) }),
    })
    if (res.ok) { saved.value = true; setTimeout(() => saved.value = false, 2500) }
    else error.value = 'Save failed.'
  } catch { error.value = 'Network error.' } finally { saving.value = false }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="max-w-md">
    <p class="text-xs opacity-50 mb-6" style="color:#3D2B1F;">
      Global store settings. Changes take effect immediately for new sessions.
    </p>

    <div v-if="loading" class="text-sm opacity-40" style="color:#3D2B1F;">Loading…</div>

    <div v-else class="flex flex-col gap-6">

      <!-- Packaging price -->
      <div class="settings-card">
        <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest" style="color:#3D2B1F;">🎀 Packaging Price</h3>
            <p class="text-[10px] opacity-50 mt-1" style="color:#3D2B1F;">
              The fee charged when a customer chooses to add gift packaging to their order. Products marked "Always included" are always free regardless of this price.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="saved"  class="text-[10px] font-bold uppercase tracking-widest" style="color:#5A9E8A;">✓ Saved</span>
            <span v-if="error" class="text-[10px]" style="color:#f87171;">{{ error }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <input
              v-model.number="packagingPrice"
              type="number"
              min="0"
              step="0.5"
              class="form-input"
              style="width:90px;"
            />
            <span class="text-xs font-bold opacity-50" style="color:#3D2B1F;">TND</span>
          </div>
          <button @click="savePackagingPrice" :disabled="saving" class="save-btn">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>

        <p class="text-[10px] opacity-40 mt-2" style="color:#3D2B1F;">
          Currently: {{ packagingPrice }} TND per order
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.settings-card {
  border: 1px solid #f0ebe3;
  border-radius: 16px;
  background: #fff;
  padding: 20px 22px;
}

.form-input {
  border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 7px 10px; font-size: 13px; color: #3D2B1F;
  background: #fff; outline: none;
}
.form-input:focus { border-color: #C4828A; }

.save-btn {
  padding: 8px 20px; border-radius: 20px; border: none;
  background: #3D2B1F; color: #fff;
  font-size: 10px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.save-btn:hover:not(:disabled) { background: #C4828A; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
