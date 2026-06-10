<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

const text    = ref('')
const saving  = ref(false)
const saved   = ref(false)
const error   = ref('')

onMounted(async () => {
  try {
    const res = await fetch(`${props.apiUrl}/api/settings`)
    if (res.ok) {
      const data = await res.json()
      text.value = data.announcement ?? ''
    }
  } catch { /* non-critical */ }
})

async function save() {
  if (!text.value.trim()) return
  saving.value = true
  error.value  = ''
  saved.value  = false
  try {
    const res = await fetch(`${props.apiUrl}/api/settings/announcement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${props.authToken}` },
      body: JSON.stringify({ value: text.value.trim() }),
    })
    if (res.ok) {
      saved.value = true
      setTimeout(() => { saved.value = false }, 2500)
    } else {
      error.value = 'Save failed.'
    }
  } catch {
    error.value = 'Network error.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <p class="text-xs mb-6 opacity-60 leading-relaxed" style="color:#3D2B1F;">
      Edit the scrolling announcement bar at the top of the site. Changes take effect immediately on next page load.
    </p>

    <div class="mb-4">
      <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:#9B86A8;">Announcement text</label>
      <input
        v-model="text"
        type="text"
        placeholder="✦ Free shipping on orders over 150 TND · New collection available now ✦"
        class="ann-input"
        @keyup.enter="save"
      />
      <p class="text-[10px] mt-1 opacity-50" style="color:#3D2B1F;">
        Use · as a separator between messages. The bar scrolls automatically.
      </p>
    </div>

    <!-- Live preview -->
    <div class="mb-5 rounded-xl overflow-hidden" style="border:1px solid #f0ebe3;">
      <p class="text-[9px] font-bold uppercase tracking-widest px-3 pt-2 pb-1" style="color:#9B86A8;">Preview</p>
      <div class="w-full overflow-hidden py-2.5" style="background-color:#C4828A; color:#ffffff;">
        <p class="text-xs font-bold uppercase tracking-widest text-center select-none">
          {{ text || '— empty —' }}
        </p>
      </div>
    </div>

    <p v-if="error" class="text-xs text-center mb-3" style="color:#f87171;">{{ error }}</p>
    <p v-if="saved" class="text-xs text-center mb-3 font-semibold" style="color:#5A9E8A;">Saved! Refresh the site to see it live.</p>

    <button @click="save" :disabled="saving || !text.trim()" class="save-ann-btn w-full">
      {{ saving ? 'Saving…' : 'Save Announcement' }}
    </button>
  </div>
</template>

<style scoped>
.ann-input {
  width: 100%; border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; color: #3D2B1F;
  background: #fff; outline: none;
}
.ann-input:focus { border-color: #C4828A; }

.save-ann-btn {
  background: #3D2B1F; color: #fff;
  padding: 13px; border-radius: 30px; border: none;
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.2s;
}
.save-ann-btn:hover:not(:disabled) { background: #C4828A; }
.save-ann-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
