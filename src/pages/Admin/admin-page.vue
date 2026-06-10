<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }    from '../../pinia/authStore'
import AdminNav         from './components/AdminNav.vue'
import AdminStats       from './components/AdminStats.vue'
import AdminOrders      from './components/AdminOrders.vue'
import AdminProducts    from './components/AdminProducts.vue'
import AdminSubscribers from './components/AdminSubscribers.vue'
import AdminEmails      from './components/AdminEmails.vue'
import AdminAccess      from './components/AdminAccess.vue'
import AdminCoupons    from './components/AdminCoupons.vue'
import AdminReviews    from './components/AdminReviews.vue'
import AdminBundles      from './components/AdminBundles.vue'
import AdminReferrals    from './components/AdminReferrals.vue'
import AdminAnnouncement from './components/AdminAnnouncement.vue'
import AdminCarousel     from './components/AdminCarousel.vue'
import AdminPerks       from './components/AdminPerks.vue'
import AdminSettings    from './components/AdminSettings.vue'

const auth   = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Auth state
const email    = ref('')
const password = ref('')
const showPass = ref(false)
const authErr  = ref('')
const authLoad = ref(false)

// Tab + stats
const activeTab = ref<'orders' | 'products' | 'carousel' | 'perks' | 'subscribers' | 'emails' | 'access' | 'coupons' | 'reviews' | 'bundles' | 'referrals' | 'announcement' | 'settings'>('orders')
const stats     = ref<any>(null)

// Computed: are we showing the dashboard?
const loggedIn   = computed(() => auth.isLoggedIn && auth.isAdmin)
const notAdmin   = computed(() => auth.isLoggedIn && !auth.isAdmin)
const authToken  = computed(() => auth.accessToken)

async function login() {
  authErr.value  = ''
  authLoad.value = true
  const result = await auth.signIn(email.value, password.value)
  authLoad.value = false
  if (!result.success) { authErr.value = result.error || 'Sign in failed.'; return }
  if (!auth.isAdmin)   { authErr.value = 'This email is not authorized as admin.'; await auth.signOut(); return }
  await loadStats()
}

async function logout() {
  await auth.signOut()
  stats.value = null
}

async function loadStats() {
  try {
    const res = await fetch(`${apiUrl}/api/orders/stats`, {
      headers: { 'Authorization': `Bearer ${auth.accessToken}` },
    })
    if (res.ok) stats.value = await res.json()
  } catch { /* non-critical */ }
}

const TABS = [
  { key: 'orders',      label: 'Orders'      },
  { key: 'products',    label: 'Products'    },
  { key: 'carousel',   label: 'Carousel'    },
  { key: 'perks',      label: 'Perks'       },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'emails',      label: 'Send Email'  },
  { key: 'access',      label: 'Admin Access'},
  { key: 'coupons',    label: 'Coupons'     },
  { key: 'reviews',    label: 'Reviews'     },
  { key: 'bundles',    label: 'Bundles'     },
  { key: 'referrals',    label: 'Referrals'     },
  { key: 'announcement', label: 'Announcement'  },
  { key: 'settings',    label: 'Settings'      },
] as const

onMounted(() => { if (loggedIn.value) loadStats() })
</script>

<template>
  <div class="flex flex-col min-h-screen font-Manrope select-none" style="background:#f8f5f2;">

    <!-- Admin Navbar (only when logged in and is admin) -->
    <AdminNav
      v-if="loggedIn"
      :admin-label="auth.displayName || 'Admin'"
      :on-logout="logout"
    />

    <!-- ── Not an admin (wrong account) ── -->
    <div v-if="notAdmin" class="flex flex-col items-center justify-center min-h-screen gap-5 px-4" style="background:#fff;">
      <span class="text-5xl">🚫</span>
      <h2 class="text-lg font-bold" style="color:#3D2B1F;">Access Denied</h2>
      <p class="text-xs text-center max-w-xs" style="color:#9B86A8;">
        The account <strong>{{ auth.user?.email }}</strong> is not authorized to access the admin dashboard.
      </p>
      <button @click="auth.signOut()" class="login-btn w-64">Sign Out</button>
    </div>

    <!-- ── Login ── -->
    <div v-else-if="!loggedIn" class="flex flex-col items-center justify-center min-h-screen gap-6 px-4" style="background:#ffffff;">
      <div class="flex flex-col items-center gap-1 mb-2">
        <span class="text-ex-gold text-2xl">✦</span>
        <h1 class="font-great-vibes text-6xl" style="color:#3D2B1F;">Exaucée</h1>
        <p class="text-[10px] font-bold uppercase tracking-[0.3em] mt-1" style="color:#9B86A8;">Admin Dashboard</p>
      </div>
      <div class="w-full max-w-xs flex flex-col gap-3">
        <input
          v-model="email"
          type="email"
          placeholder="Admin email"
          @keyup.enter="login"
          class="login-input"
          autocomplete="email"
        />
        <div class="relative">
          <input
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            placeholder="Password"
            @keyup.enter="login"
            class="login-input pr-10"
            autocomplete="current-password"
          />
          <button
            type="button"
            @click="showPass = !showPass"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style="color:#C4828A;"
          >{{ showPass ? 'hide' : 'show' }}</button>
        </div>
        <p v-if="authErr" class="text-xs text-center" style="color:#f87171;">{{ authErr }}</p>
        <button @click="login" :disabled="authLoad" class="login-btn">
          {{ authLoad ? 'Signing in…' : 'Enter Dashboard' }}
        </button>
      </div>
    </div>

    <!-- ── Dashboard ── -->
    <main v-else class="flex-grow w-full max-w-7xl mx-auto px-4 py-8">

      <!-- Stats bar -->
      <AdminStats :stats="stats" :api-url="apiUrl" :auth-token="authToken" />

      <!-- Tab bar + refresh -->
      <div class="flex items-end justify-between mb-0 flex-wrap gap-3">
        <div class="tab-bar">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === tab.key }"
          >{{ tab.label }}</button>
        </div>
        <button @click="loadStats" class="refresh-btn mb-px">↻ Refresh</button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <AdminOrders
          v-if="activeTab === 'orders'"
          :api-url="apiUrl"
          :auth-token="authToken"
          @stats-changed="loadStats"
        />
        <AdminProducts
          v-else-if="activeTab === 'products'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminCarousel
          v-else-if="activeTab === 'carousel'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminPerks
          v-else-if="activeTab === 'perks'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminSubscribers
          v-else-if="activeTab === 'subscribers'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminEmails
          v-else-if="activeTab === 'emails'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminAccess
          v-else-if="activeTab === 'access'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminCoupons
          v-else-if="activeTab === 'coupons'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminReviews
          v-else-if="activeTab === 'reviews'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminBundles
          v-else-if="activeTab === 'bundles'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminReferrals
          v-else-if="activeTab === 'referrals'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminAnnouncement
          v-else-if="activeTab === 'announcement'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
        <AdminSettings
          v-else-if="activeTab === 'settings'"
          :api-url="apiUrl"
          :auth-token="authToken"
        />
      </div>
    </main>

  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.login-input {
  border: 1px solid #f0ebe3; border-radius: 12px;
  padding: 12px 16px; font-size: 13px; color: #3D2B1F;
  outline: none; background: #fff; width: 100%;
  transition: border-color 0.2s;
}
.login-input:focus { border-color: #C4828A; }

.login-btn {
  background: #3D2B1F; color: #fff; border: none;
  padding: 13px; border-radius: 30px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover:not(:disabled) { background: #C4828A; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.tab-bar {
  display: flex; flex-wrap: wrap; gap: 4px;
  border-bottom: 2px solid #f0ebe3;
}
.tab-btn {
  padding: 8px 18px;
  border-radius: 10px 10px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #9B86A8; background: transparent; cursor: pointer;
  transition: all 0.15s; position: relative; bottom: -2px;
}
.tab-btn--active {
  background: #ffffff;
  border-color: #f0ebe3;
  border-bottom-color: #ffffff;
  color: #C4828A;
}
.tab-btn:hover:not(.tab-btn--active) { color: #3D2B1F; }

.tab-content {
  background: #ffffff;
  border: 1px solid #f0ebe3;
  border-top: none;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  min-height: 400px;
}

.refresh-btn {
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid #f0ebe3; background: #fff;
  font-size: 10px; font-weight: 700; color: #9B86A8;
  cursor: pointer; transition: all 0.2s;
}
.refresh-btn:hover { color: #C4828A; border-color: #C4828A; }
</style>
