<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../pinia/authStore'
import { useLangStore } from '../../pinia/langStore'
import { useWishlistStore } from '../../pinia/wishlistStore'
import { useProductStore } from '../../pinia/productStore'
import NavigationGlobal from '../../components/navigation-global.vue'
import FooterGlobal     from '../../components/footer-global.vue'

const auth          = useAuthStore()
const langStore     = useLangStore()
const wishlistStore = useWishlistStore()
const productStore  = useProductStore()
const router        = useRouter()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  items: any[]
}

const orders   = ref<Order[]>([])
const loading  = ref(true)
const expanded = ref<string | null>(null)

// ── Profile editing ──
const editing      = ref(false)
const editName     = ref('')
const avatarFile   = ref<File | null>(null)
const avatarPreview= ref('')
const saving       = ref(false)
const saveError    = ref('')
const saveSuccess  = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)

function openEdit() {
  editName.value     = auth.displayName
  avatarPreview.value= auth.avatarUrl
  avatarFile.value   = null
  saveError.value    = ''
  saveSuccess.value  = false
  editing.value      = true
}

function cancelEdit() {
  editing.value = false
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value    = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function saveProfile() {
  saving.value    = true
  saveError.value = ''

  let newAvatarUrl = auth.avatarUrl

  if (avatarFile.value) {
    const res = await auth.uploadAvatar(avatarFile.value)
    if (!res.success) {
      saveError.value = res.error ?? 'Avatar upload failed.'
      saving.value    = false
      return
    }
    newAvatarUrl = res.url!
  }

  const res = await auth.updateProfile({
    name:       editName.value.trim() || undefined,
    avatar_url: newAvatarUrl || undefined,
  })

  saving.value = false
  if (!res.success) { saveError.value = res.error ?? 'Could not save.'; return }
  saveSuccess.value = true
  setTimeout(() => { editing.value = false; saveSuccess.value = false }, 1200)
}

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/'); return }
  await Promise.all([fetchOrders(), wishlistStore.load(auth.authHeaders())])
})

async function fetchOrders() {
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/api/orders/my`, { headers: auth.authHeaders() })
    if (res.ok) orders.value = await res.json()
  } catch { /* non-critical */ } finally { loading.value = false }
}

function toggleOrder(id: string) {
  expanded.value = expanded.value === id ? null : id
}

const STATUS_COLORS: Record<string, string> = {
  pending:    '#C9A45A',
  processing: '#9B86A8',
  shipped:    '#5A9E8A',
  delivered:  '#5A9E8A',
  cancelled:  '#C4828A',
}

const initials = computed(() => (auth.displayName || '?').slice(0, 1).toUpperCase())

// Wishlist
const wishlistProducts = computed(() =>
  wishlistStore.items
    .map(name => productStore.flatList.find(p => p.header === name))
    .filter(Boolean) as typeof productStore.flatList
)

const shareTooltip = ref(false)

function shareWishlist() {
  const names = wishlistStore.items.map(n => encodeURIComponent(n)).join('|')
  const from  = encodeURIComponent(auth.displayName || 'My')
  const url   = `${window.location.origin}/wishlist-share?items=${names}&from=${from}`
  navigator.clipboard.writeText(url).catch(() => {})
  shareTooltip.value = true
  setTimeout(() => { shareTooltip.value = false }, 2000)
}

function wishlistProductRoute(p: typeof productStore.flatList[0]) {
  return { name: p.category, params: { id: p.id } }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col min-h-screen" style="background:#FDF6EE; font-family:'Manrope',sans-serif;">
    <NavigationGlobal color="black" />

    <main class="flex-grow w-full max-w-3xl mx-auto px-4 py-12">

      <!-- ── Profile header ── -->
      <div class="rounded-3xl overflow-hidden mb-8" style="background:#fff; border:1px solid #f0ebe3;">

        <!-- View mode -->
        <div v-if="!editing" class="flex items-center gap-5 px-7 py-6">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <div
              class="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
              style="background:linear-gradient(135deg,#C4828A,#9B86A8);"
            >
              <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
              <span v-else>{{ initials }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-grow min-w-0">
            <h1 class="text-lg font-bold truncate" style="color:#3D2B1F;">{{ auth.displayName || 'My Account' }}</h1>
            <p class="text-xs truncate" style="color:#9B86A8;">{{ auth.user?.email }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="openEdit"
              class="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition"
              style="background:#FDF6EE; color:#C4828A; border:1.5px solid rgba(196,130,138,0.3);"
              onmouseover="this.style.background='#C4828A';this.style.color='#fff'"
              onmouseout="this.style.background='#FDF6EE';this.style.color='#C4828A'"
            >{{ langStore.t.account.editProfile }}</button>
            <button
              @click="auth.signOut(); router.push('/')"
              class="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition"
              style="background:#FDF6EE; color:#9B86A8; border:1.5px solid #f0ebe3;"
              onmouseover="this.style.background='#9B86A8';this.style.color='#fff'"
              onmouseout="this.style.background='#FDF6EE';this.style.color='#9B86A8'"
            >{{ langStore.t.account.signOut }}</button>
          </div>
        </div>

        <!-- Edit mode -->
        <Transition name="fade-slide">
          <div v-if="editing" class="px-7 py-6">
            <p class="text-[10px] font-bold uppercase tracking-widest mb-5" style="color:#9B86A8;">{{ langStore.t.account.editTitle }}</p>

            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <!-- Avatar upload -->
              <div class="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  class="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold"
                  style="background:linear-gradient(135deg,#C4828A,#9B86A8);"
                >
                  <img v-if="avatarPreview" :src="avatarPreview" alt="preview" class="h-full w-full object-cover" />
                  <span v-else>{{ initials }}</span>
                </div>
                <button
                  type="button"
                  @click="fileInput?.click()"
                  class="text-[10px] font-bold underline underline-offset-2 transition hover:opacity-60"
                  style="color:#C4828A; background:none; border:none; cursor:pointer; padding:0;"
                >{{ langStore.t.account.changePhoto }}</button>
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
              </div>

              <!-- Name input -->
              <div class="flex-grow w-full">
                <label class="block text-[10px] font-bold uppercase tracking-widest mb-2" style="color:#9B86A8;">{{ langStore.t.account.displayName }}</label>
                <input
                  v-model="editName"
                  type="text"
                  placeholder="Your name"
                  class="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style="background:#FDF6EE; border:1.5px solid #f0ebe3; color:#3D2B1F; font-family:'Manrope',sans-serif;"
                  @focus="($event.target as HTMLInputElement).style.borderColor='#C4828A'"
                  @blur="($event.target as HTMLInputElement).style.borderColor='#f0ebe3'"
                  @keyup.enter="saveProfile"
                />
                <p class="text-[10px] mt-1.5" style="color:#C8BEB8;">This is the name shown on your account.</p>

                <p v-if="saveError" class="text-xs mt-3" style="color:#f87171;">{{ saveError }}</p>

                <div class="flex gap-2 mt-4">
                  <button
                    @click="saveProfile"
                    :disabled="saving"
                    class="flex-grow py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white transition"
                    :style="saveSuccess ? 'background:#5A9E8A;' : 'background:linear-gradient(135deg,#C4828A,#9B86A8);'"
                  >
                    {{ saveSuccess ? langStore.t.account.saved : saving ? langStore.t.account.saving : langStore.t.account.saveChanges }}
                  </button>
                  <button
                    @click="cancelEdit"
                    :disabled="saving"
                    class="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition"
                    style="background:#FDF6EE; color:#9B86A8; border:1.5px solid #f0ebe3;"
                  >{{ langStore.t.account.cancel }}</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── Orders ── -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-bold uppercase tracking-widest" style="color:#3D2B1F;">{{ langStore.t.account.myOrders }}</h2>
        <button @click="fetchOrders" class="text-[10px] uppercase tracking-widest font-bold transition hover:opacity-70" style="color:#9B86A8;">{{ langStore.t.account.refresh }}</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col gap-3">
        <div v-for="i in 3" :key="i" class="h-16 rounded-2xl animate-pulse" style="background:#f0ebe3;" />
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">🛍️</div>
        <p class="text-sm font-semibold" style="color:#3D2B1F;">{{ langStore.t.account.noOrders }}</p>
        <p class="text-xs mt-1 mb-6" style="color:#9B86A8;">{{ langStore.t.account.noOrdersText }}</p>
        <router-link to="/" class="inline-block px-8 py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest" style="background:#3D2B1F;">{{ langStore.t.account.shopNow }}</router-link>
      </div>

      <!-- Order list -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="rounded-2xl border cursor-pointer overflow-hidden"
          style="background:#fff; border-color:#f0ebe3;"
          @click="toggleOrder(order.id)"
        >
          <div class="flex items-center gap-4 px-5 py-4">
            <div class="flex-grow">
              <p class="text-xs font-bold" style="color:#3D2B1F;">#{{ order.id.slice(0, 8).toUpperCase() }}</p>
              <p class="text-[10px] mt-0.5" style="color:#9B86A8;">{{ formatDate(order.created_at) }}</p>
            </div>
            <span
              class="text-[10px] font-bold uppercase px-3 py-1 rounded-full"
              :style="{ background: (STATUS_COLORS[order.status] || '#9B86A8') + '20', color: STATUS_COLORS[order.status] || '#9B86A8' }"
            >{{ order.status }}</span>
            <span class="text-sm font-bold ml-2" style="color:#3D2B1F;">{{ order.total }} TND</span>
            <span class="text-[10px]" style="color:#C4C4C4;">{{ expanded === order.id ? '▲' : '▼' }}</span>
          </div>
          <Transition name="slide">
            <div v-if="expanded === order.id" class="border-t px-5 py-4" style="border-color:#f0ebe3;">
              <div
                v-for="(item, i) in (order.items || [])"
                :key="i"
                class="flex items-center justify-between py-1.5 text-xs"
                style="color:#3D2B1F;"
              >
                <span>{{ item.name }}</span>
                <span style="color:#9B86A8;">× {{ item.quantity }}</span>
                <span>{{ item.price * item.quantity }} TND</span>
              </div>
              <div v-if="!order.items?.length" class="text-xs" style="color:#9B86A8;">No item details available.</div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- ── Wishlist ── -->
      <div class="mt-10">
        <div class="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-sm font-bold uppercase tracking-widest" style="color:#3D2B1F;">My Wishlist</h2>
          <div class="relative">
            <button
              v-if="wishlistProducts.length"
              @click="shareWishlist"
              class="text-[10px] uppercase tracking-widest font-bold transition hover:opacity-70 inline-flex items-center gap-1.5"
              style="color:#9B86A8;"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-3.5 w-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share link
            </button>
            <Transition name="fade-slide">
              <span
                v-if="shareTooltip"
                class="absolute -top-8 right-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold shadow"
                style="background:#3D2B1F; color:#FDF6EE;"
              >Link copied!</span>
            </Transition>
          </div>
        </div>

        <div v-if="!wishlistStore.loaded" class="flex gap-3">
          <div v-for="i in 3" :key="i" class="h-36 flex-1 rounded-2xl animate-pulse" style="background:#f0ebe3;" />
        </div>
        <div v-else-if="wishlistProducts.length === 0" class="text-center py-10">
          <p class="text-4xl mb-3">♡</p>
          <p class="text-sm font-semibold" style="color:#3D2B1F;">No saved items yet</p>
          <p class="text-xs mt-1 mb-5" style="color:#9B86A8;">Tap the heart on any product to save it here.</p>
          <router-link to="/" class="inline-block px-7 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-widest" style="background:#3D2B1F;">Shop now</router-link>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <router-link
            v-for="p in wishlistProducts"
            :key="p.header"
            :to="wishlistProductRoute(p)"
            class="flex flex-col gap-2 rounded-2xl overflow-hidden bg-white p-3 hover:shadow-md transition group"
            style="border:1px solid #f0ebe3;"
          >
            <div class="rounded-xl overflow-hidden flex items-center justify-center h-28" style="background:#FFF9F4;">
              <img :src="p.src" :alt="p.header" class="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
            <p class="font-great-vibes text-xl leading-tight" style="color:#3D2B1F;">{{ p.header }}</p>
            <p class="text-xs font-bold" style="color:#C4828A;">{{ p.finalPrice ?? p.price }} TND</p>
          </router-link>
        </div>
      </div>

    </main>

    <FooterGlobal />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.22s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
