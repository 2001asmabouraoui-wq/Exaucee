<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

const SEGMENTS = [
  { key: 'all',      label: 'All Subscribers',    desc: 'Everyone in your subscriber list' },
  { key: 'lipgloss', label: 'Lip Gloss Buyers',   desc: 'Customers who ordered a lip gloss' },
  { key: 'inactive', label: 'Inactive (60+ days)', desc: 'Customers with no order in the last 60 days' },
] as const

type SegmentKey = typeof SEGMENTS[number]['key']

const segment      = ref<SegmentKey>('all')
const segmentCount = ref<number | null>(null)
const segmentEmails= ref<string[]>([])
const segLoading   = ref(false)

const subject   = ref('')
const body      = ref('')
const sending   = ref(false)
const result    = ref<{ success: boolean; message: string } | null>(null)

async function loadSegment() {
  segLoading.value   = true
  segmentCount.value = null
  segmentEmails.value= []
  try {
    const res = await fetch(`${props.apiUrl}/api/emails/segment/${segment.value}`, {
      headers: { Authorization: `Bearer ${props.authToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      segmentCount.value  = data.count
      segmentEmails.value = data.emails
    }
  } catch { /* non-critical */ } finally {
    segLoading.value = false
  }
}

watch(segment, loadSegment, { immediate: true })

async function send() {
  if (!subject.value.trim() || !body.value.trim()) return
  sending.value = true
  result.value  = null
  try {
    const payload: Record<string, unknown> = { subject: subject.value, body: body.value }
    if (segment.value !== 'all') payload.target_emails = segmentEmails.value
    const res = await fetch(`${props.apiUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.authToken}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      result.value = { success: true, message: `Sent to ${data.sent_to} recipient${data.sent_to !== 1 ? 's' : ''}!` }
      subject.value = ''
      body.value    = ''
    } else {
      result.value = { success: false, message: data.error || 'Send failed.' }
    }
  } catch {
    result.value = { success: false, message: 'Network error.' }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto">

    <!-- Segment picker -->
    <div class="mb-5">
      <label class="form-label mb-2 block">Audience segment</label>
      <div class="flex flex-col gap-2">
        <label
          v-for="s in SEGMENTS"
          :key="s.key"
          class="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition"
          :style="segment === s.key ? 'border:1.5px solid #C4828A; background:#FFF9F4;' : 'border:1px solid #f0ebe3; background:#fff;'"
        >
          <input type="radio" :value="s.key" v-model="segment" class="mt-0.5 accent-rose-400 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold" style="color:#3D2B1F;">{{ s.label }}</p>
            <p class="text-[10px] opacity-60" style="color:#3D2B1F;">{{ s.desc }}</p>
          </div>
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 self-center"
            :style="segment === s.key ? 'background:#C4828A20; color:#C4828A;' : 'background:#f0ebe3; color:#9B86A8;'"
          >
            {{ segLoading && segment === s.key ? '…' : (segment === s.key && segmentCount !== null ? segmentCount : '') }}
          </span>
        </label>
      </div>
      <p v-if="!segLoading && segmentCount !== null" class="text-[10px] mt-2 opacity-60" style="color:#3D2B1F;">
        This campaign will be sent to <strong>{{ segmentCount }}</strong> recipient{{ segmentCount !== 1 ? 's' : '' }}.
      </p>
    </div>

    <div class="h-px w-full mb-5" style="background:#f0ebe3;"></div>

    <div class="form-group mb-4">
      <label class="form-label">Subject *</label>
      <input v-model="subject" class="form-input" placeholder="✦ New collection from Exaucée" />
    </div>

    <div class="form-group mb-5">
      <label class="form-label">Message *</label>
      <textarea v-model="body" class="form-input" rows="10" placeholder="Write your message here…&#10;&#10;Blank lines become paragraph breaks." style="resize:vertical;" />
    </div>

    <!-- Preview of brand wrapper -->
    <div class="preview-box mb-5">
      <p class="text-[9px] font-bold uppercase tracking-widest mb-2" style="color:#9B86A8;">Preview (brand wrapper)</p>
      <div style="background:#C4828A; padding:12px; border-radius:8px 8px 0 0; text-align:center;">
        <span style="color:#fff; font-size:14px; font-weight:800;">✦ Exaucée</span>
      </div>
      <div style="background:#FFF9F4; padding:16px; font-size:13px; color:#3D2B1F; line-height:1.7; white-space:pre-wrap; border-radius:0 0 8px 8px;">{{ body || 'Your message will appear here.' }}</div>
    </div>

    <p v-if="result" class="text-xs text-center mb-4 font-semibold" :style="{ color: result.success ? '#5A9E8A' : '#f87171' }">
      {{ result.message }}
    </p>

    <button
      @click="send"
      :disabled="sending || !subject.trim() || !body.trim() || (segmentCount === 0)"
      class="send-btn w-full"
    >
      <svg v-if="sending" class="animate-spin inline-block mr-2 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      {{ sending ? 'Sending…' : `Send to ${SEGMENTS.find(s => s.key === segment)?.label}` }}
    </button>
    <p v-if="segmentCount === 0" class="text-[10px] text-center mt-2 opacity-60" style="color:#3D2B1F;">
      No recipients in this segment yet.
    </p>
  </div>
</template>

<style scoped>
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.15em; color: #9B86A8;
}
.form-input {
  border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; color: #3D2B1F;
  background: #fff; outline: none;
}
.form-input:focus { border-color: #C4828A; }
.preview-box {
  border: 1px solid #f0ebe3; border-radius: 10px; overflow: hidden;
  padding: 12px;
}
.send-btn {
  background: #3D2B1F; color: #fff;
  padding: 13px; border-radius: 30px; border: none;
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.2s;
}
.send-btn:hover:not(:disabled) { background: #C4828A; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
