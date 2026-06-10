<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Subscriber { id: string; subscribed_at: string; email: string; name: string }
interface Admin      { id: string; created_at: string; email: string; label: string }

const subscribers   = ref<Subscriber[]>([])
const admins        = ref<Admin[]>([])
const loading       = ref(false)
const actionMsg     = ref('')
const actionErr     = ref('')
const confirmRevokeId = ref<string | null>(null)

// "Add by email" form (for non-subscribers)
const byEmailOpen   = ref(false)
const byEmail       = ref('')
const byLabel       = ref('')
const byEmailErr    = ref('')

const headers = computed(() => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${props.authToken}`,
}))

const adminEmailSet = computed(() => new Set(admins.value.map(a => a.email)))

async function load() {
  loading.value = true
  actionMsg.value = actionErr.value = ''
  const [subRes, admRes] = await Promise.all([
    fetch(`${props.apiUrl}/api/subscribers`, { headers: headers.value }),
    fetch(`${props.apiUrl}/api/admins`,      { headers: headers.value }),
  ])
  subscribers.value = subRes.ok  ? await subRes.json()  : []
  admins.value      = admRes.ok  ? await admRes.json()  : []
  loading.value = false
}

async function grantAdmin(sub: Subscriber) {
  actionMsg.value = actionErr.value = ''
  const res = await fetch(`${props.apiUrl}/api/admins`, {
    method: 'POST',
    headers: headers.value,
    body: JSON.stringify({ email: sub.email, label: sub.name || sub.email }),
  })
  const data = await res.json()
  if (!res.ok) { actionErr.value = data.error || 'Failed to grant access'; return }
  actionMsg.value = `✓ ${sub.email} is now an admin.`
  await load()
}

async function revokeAdmin(id: string) {
  await fetch(`${props.apiUrl}/api/admins/${id}`, {
    method: 'DELETE', headers: headers.value,
  })
  confirmRevokeId.value = null
  actionMsg.value = '✓ Admin access revoked.'
  await load()
}

async function addByEmail() {
  byEmailErr.value = ''
  if (!byEmail.value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(byEmail.value)) {
    byEmailErr.value = 'Enter a valid email address.'; return
  }
  const res = await fetch(`${props.apiUrl}/api/admins`, {
    method: 'POST',
    headers: headers.value,
    body: JSON.stringify({ email: byEmail.value.trim(), label: byLabel.value.trim() || byEmail.value.trim() }),
  })
  const data = await res.json()
  if (!res.ok) { byEmailErr.value = data.error || 'Failed'; return }
  byEmail.value = byLabel.value = ''
  byEmailOpen.value = false
  actionMsg.value = `✓ ${data.email} granted admin access.`
  await load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <div class="max-w-2xl mx-auto">

    <!-- Feedback -->
    <p v-if="actionMsg" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#F0FFF8; color:#5A9E8A; border:1px solid #b6f0d8;">{{ actionMsg }}</p>
    <p v-if="actionErr" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#FFF5F5; color:#C4828A; border:1px solid #f0c4c4;">{{ actionErr }}</p>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-sm opacity-30" style="color:#3D2B1F;">Loading…</div>

    <template v-else>
      <!-- ── Section: Subscribers ──────────────────────────── -->
      <h3 class="section-title mb-1">Grant Admin Access</h3>
      <p class="text-[10px] mb-4 opacity-50" style="color:#3D2B1F;">Choose any subscriber and make them an admin. They can log in with their email and password to access this panel.</p>

      <div v-if="subscribers.length === 0" class="empty-state">No subscribers yet.</div>

      <div v-else class="flex flex-col gap-2 mb-6">
        <div
          v-for="s in subscribers"
          :key="s.id"
          class="subscriber-row"
          :class="{ 'is-admin': adminEmailSet.has(s.email) }"
        >
          <div class="flex-grow min-w-0">
            <p class="text-sm font-semibold truncate" style="color:#3D2B1F;">{{ s.name || '—' }}</p>
            <p class="text-[10px] opacity-60 truncate" style="color:#3D2B1F;">{{ s.email }}</p>
            <p class="text-[9px] opacity-40" style="color:#3D2B1F;">Subscribed {{ formatDate(s.subscribed_at) }}</p>
          </div>

          <!-- Already admin -->
          <template v-if="adminEmailSet.has(s.email)">
            <span class="admin-badge">Admin ✦</span>
            <button
              @click="confirmRevokeId = admins.find(a => a.email === s.email)!.id"
              class="revoke-btn"
            >Remove</button>
          </template>

          <!-- Not yet admin -->
          <button v-else @click="grantAdmin(s)" class="grant-btn">
            Grant Access
          </button>
        </div>
      </div>

      <!-- ── Add by email (for non-subscribers) ─────────────── -->
      <button
        @click="byEmailOpen = !byEmailOpen"
        class="text-[10px] font-bold uppercase tracking-widest mb-4 transition hover:opacity-70"
        style="color:#9B86A8; background:none; border:none; cursor:pointer; padding:0;"
      >
        {{ byEmailOpen ? '▲ Cancel' : '＋ Add someone not in the subscriber list' }}
      </button>

      <Transition name="slide">
        <div v-if="byEmailOpen" class="by-email-form mb-6">
          <div class="flex flex-col gap-3">
            <div>
              <label class="form-label">Email</label>
              <input v-model="byEmail" type="email" class="form-input" placeholder="sara@example.com" @keyup.enter="addByEmail" />
            </div>
            <div>
              <label class="form-label">Label (optional)</label>
              <input v-model="byLabel" type="text" class="form-input" placeholder="e.g. Sara — Assistant" @keyup.enter="addByEmail" />
            </div>
            <p v-if="byEmailErr" class="text-xs" style="color:#f87171;">{{ byEmailErr }}</p>
            <button @click="addByEmail" class="grant-btn self-start">Grant Access</button>
          </div>
        </div>
      </Transition>

      <!-- ── Section: Active admins ──────────────────────────── -->
      <h3 class="section-title mb-3">Active Admins</h3>
      <div class="info-box mb-4">
        <p class="text-[10px]" style="color:#3D2B1F;">
          Your super admin account (<strong>{{ props.apiUrl.includes('localhost') ? 'env ADMIN_EMAILS' : 'store owner' }}</strong>) is always active and cannot be removed here.
        </p>
      </div>

      <div v-if="admins.length === 0" class="empty-state">No extra admins yet.</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="a in admins" :key="a.id" class="admin-row-item">
          <div class="flex-grow min-w-0">
            <p class="text-sm font-semibold truncate" style="color:#3D2B1F;">{{ a.label || a.email }}</p>
            <p class="text-[10px] opacity-60 truncate" style="color:#3D2B1F;">{{ a.email }}</p>
            <p class="text-[9px] opacity-40" style="color:#3D2B1F;">Since {{ formatDate(a.created_at) }}</p>
          </div>
          <button @click="confirmRevokeId = a.id" class="revoke-btn">Remove</button>
        </div>
      </div>
    </template>

    <!-- Revoke confirm modal -->
    <div v-if="confirmRevokeId" class="modal-overlay" @click.self="confirmRevokeId = null">
      <div class="confirm-box">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Remove admin access?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">They will lose access to this panel immediately.</p>
        <div class="flex gap-3">
          <button @click="confirmRevokeId = null" class="cancel-btn">Cancel</button>
          <button @click="revokeAdmin(confirmRevokeId!)" class="confirm-btn">Remove</button>
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
.info-box {
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 10px; padding: 12px 16px;
}
.empty-state {
  text-align: center; padding: 28px 0;
  font-size: 12px; color: #9B86A8; opacity: 0.6;
}
.subscriber-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border: 1px solid #f0ebe3;
  border-radius: 12px; background: #fff;
  transition: border-color 0.2s;
}
.subscriber-row.is-admin {
  border-color: #C9A45A40; background: #FFFDF7;
}
.admin-row-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border: 1px solid #f0ebe3;
  border-radius: 12px; background: #fff;
}
.admin-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #C9A45A;
  background: #C9A45A18; border: 1px solid #C9A45A40;
  padding: 3px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0;
}
.grant-btn {
  padding: 7px 14px; border-radius: 20px; flex-shrink: 0;
  border: 1.5px solid #C4828A; background: #fff;
  color: #C4828A; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.grant-btn:hover { background: #C4828A; color: #fff; }
.revoke-btn {
  padding: 7px 14px; border-radius: 20px; flex-shrink: 0;
  border: 1.5px solid #f0ebe3; background: #fff;
  color: #9B86A8; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.revoke-btn:hover { background: #9B86A8; color: #fff; border-color: #9B86A8; }

/* Add by email form */
.by-email-form {
  background: #FFF9F4; border: 1px solid #f0ebe3;
  border-radius: 12px; padding: 16px;
}
.form-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #9B86A8; margin-bottom: 4px; }
.form-input {
  width: 100%; border: 1px solid #f0ebe3; border-radius: 10px;
  padding: 9px 12px; font-size: 12px; color: #3D2B1F;
  background: #fff; outline: none; box-sizing: border-box;
}
.form-input:focus { border-color: #C4828A; }

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

.slide-enter-active, .slide-leave-active { transition: all 0.22s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
