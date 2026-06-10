<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import cartIcon from '/icons/market-cart.png'
import Cart      from './Cart/cart-modal.vue'
import AuthModal from './AuthModal.vue'
import { useCartStore } from '../pinia/cartStore.ts'
import { useAuthStore } from '../pinia/authStore'
import { useLangStore } from '../pinia/langStore'
import { useProductStore } from '../pinia/productStore'

interface Props {
  color?: 'black' | 'transparent' | 'k-black'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'transparent',
})

const cartStore      = useCartStore()
const auth           = useAuthStore()
const langStore      = useLangStore()
const productStore   = useProductStore()
const router         = useRouter()
const hamburgerState = ref<'show' | 'hide'>('hide')
const isScrolled     = ref(false)
const showAuth       = ref(false)
const showUserMenu   = ref(false)

// ── Search ───────────────────────────────────────────
const showSearch     = ref(false)
const searchQuery    = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const activeIndex    = ref(-1)

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return productStore.flatList
    .filter(p =>
      p.header.toLowerCase().includes(q) ||
      p.subheader.toLowerCase().includes(q) ||
      (p.shades ?? []).some(s => s.name.toLowerCase().includes(q))
    )
    .slice(0, 8)
})

watch(searchQuery, () => { activeIndex.value = -1 })

watch(showSearch, (open) => {
  if (open) nextTick(() => searchInputRef.value?.focus())
  else { searchQuery.value = ''; activeIndex.value = -1 }
})

function closeSearch() {
  showSearch.value  = false
  searchQuery.value = ''
  activeIndex.value = -1
}

function goToProduct(p: typeof searchResults.value[0]) {
  router.push({ name: p.category, params: { id: p.id } })
  closeSearch()
}

function onSearchKeydown(e: KeyboardEvent) {
  const len = searchResults.value.length
  if (!len) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % len
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + len) % len
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    goToProduct(searchResults.value[activeIndex.value])
  }
}
// ────────────────────────────────────────────────────

const navInitials = computed(() =>
  (auth.displayName || '?').slice(0, 1).toUpperCase()
)

function handleScroll() { isScrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const headerClass = computed(() => {
  if (isScrolled.value) return 'scrolled-nav'
  if (props.color === 'black' || props.color === 'k-black') return 'cream-nav'
  return ''
})

function showHamburger() { hamburgerState.value = 'show' }
function hideHamburger() { hamburgerState.value = 'hide' }

</script>

<template>
  <header
    id="navi"
    class="sticky top-0 z-50 flex w-full flex-col items-center transition-all duration-300"
    :class="headerClass"
    data-test="nav-desktop"
  >
    <div class="flex w-4/5 max-w-6xl flex-row items-center justify-between border-b border-ex-gold border-opacity-20 py-4 md:w-11/12 lg:w-4/5">

      <!-- HAMBURGER (mobile) -->
      <button
        class="lg:hidden transition hover:opacity-60"
        style="color:#C4828A;"
        @click="showHamburger()"
        data-test="hamburger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-6 w-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <!-- LOGO -->
      <router-link
        to="/"
        class="font-great-vibes text-3xl transition duration-300 hover:opacity-70"
        style="color:#C4828A;"
        data-test="nav-logo"
      >
        Exaucée
      </router-link>

      <!-- DESKTOP NAV -->
      <nav class="hidden lg:flex lg:gap-8 text-xs tracking-widest items-center">
        <router-link to="/"        class="nav-link" data-test="nav-home">{{ langStore.t.nav.home }}</router-link>
        <router-link to="/about"   class="nav-link" data-test="nav-about">{{ langStore.t.nav.about }}</router-link>
        <router-link to="/contact" class="nav-link" data-test="nav-contact">{{ langStore.t.nav.contact }}</router-link>
        <router-link to="/quiz"    class="nav-link" data-test="nav-quiz">{{ langStore.t.nav.quiz }}</router-link>
        <router-link to="/journal" class="nav-link nav-link--journal" data-test="nav-journal">Journal</router-link>
        <!-- Language selector -->
        <div class="flex items-center gap-0.5 ml-4 rounded-full overflow-hidden" style="border:1.5px solid rgba(155,134,168,0.3);">
          <button
            v-for="[l, flag] in ([['fr','🇫🇷'],['en','🇬🇧'],['ar','🇹🇳']] as const)"
            :key="l"
            @click="langStore.setLang(l)"
            class="px-1.5 py-0.5 text-base leading-none transition-all duration-200"
            :style="langStore.lang === l
              ? { background:'#9B86A8', opacity:'1' }
              : { background:'transparent', opacity:'0.45' }"
          >{{ flag }}</button>
        </div>
      </nav>

      <!-- RIGHT CLUSTER: search + cart + auth -->
      <div class="flex items-center gap-2">

        <!-- Search icon (desktop) -->
        <button
          @click="showSearch = true"
          class="hidden lg:flex items-center justify-center h-8 w-8 rounded-full transition hover:opacity-60"
          style="color:#C4828A;"
          title="Search products"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        <!-- Cart -->
        <div class="relative h-12 w-14 cursor-pointer transition hover:opacity-60" @click="cartStore.cartOn()" data-test="cart-button">
          <img class="h-full w-full object-contain" :src="cartIcon" alt="Cart" />
          <Transition>
            <div
              v-show="cartStore.cartLength !== 0"
              class="absolute right-0 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white"
              style="background:#C4828A;"
              data-test="cart-bubble"
            >
              {{ cartStore.cartLength }}
            </div>
          </Transition>
        </div>

        <!-- Sign In / Account — right of cart -->
        <button
          v-if="!auth.isLoggedIn"
          @click="showAuth = true"
          class="hidden lg:block text-[10px] font-bold uppercase tracking-widest transition hover:opacity-60 ml-6"
          style="color:#C4828A;"
        >{{ langStore.t.nav.signIn }}</button>

        <div v-else class="relative hidden lg:block ml-6">
          <button
            @click="showUserMenu = !showUserMenu"
            class="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] font-bold transition hover:opacity-80 flex-shrink-0"
            style="background:linear-gradient(135deg,#C4828A,#9B86A8);"
          >
            <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
            <span v-else>{{ navInitials }}</span>
          </button>
          <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false"></div>
          <Transition name="fade-down">
            <div v-if="showUserMenu" class="absolute right-0 top-9 w-44 bg-white rounded-2xl shadow-xl border py-2 z-50" style="border-color:#f0ebe3;">
              <p class="px-4 py-1 text-[10px] font-bold uppercase tracking-widest truncate" style="color:#9B86A8;">{{ auth.user?.email }}</p>
              <hr style="border-color:#f0ebe3;" class="my-1" />
              <router-link to="/account" @click="showUserMenu = false" class="flex items-center gap-2 px-4 py-2 text-xs font-semibold transition hover:bg-[#FDF6EE]" style="color:#3D2B1F;">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                {{ langStore.t.nav.myAccount }}
              </router-link>
              <button @click="auth.signOut(); showUserMenu = false" class="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold transition hover:bg-[#FDF6EE]" style="color:#C4828A;">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                {{ langStore.t.nav.signOut }}
              </button>
            </div>
          </Transition>
        </div>

      </div>
    </div>

    <!-- AUTH MODAL -->
    <AuthModal v-model="showAuth" initial-tab="signin" />

    <!-- CART MODAL -->
    <Cart />

    <!-- MOBILE NAV -->
    <transition>
      <nav
        v-if="hamburgerState === 'show'"
        class="absolute top-full left-0 z-50 flex w-full flex-col gap-5 px-8 py-6 text-sm font-semibold tracking-widest shadow-md"
        style="background:#FDF6EE; color:#C4828A;"
        data-test="nav-mobile"
      >
        <button class="self-end text-xs uppercase hover:opacity-60 transition" @click="hideHamburger()" data-test="close-hamburger">{{ langStore.t.nav.close }}</button>
        <router-link to="/"        class="uppercase hover:opacity-60 transition" @click="hideHamburger()">{{ langStore.t.nav.home }}</router-link>
        <router-link to="/about"   class="uppercase hover:opacity-60 transition" @click="hideHamburger()">{{ langStore.t.nav.about }}</router-link>
        <router-link to="/contact" class="uppercase hover:opacity-60 transition" @click="hideHamburger()">{{ langStore.t.nav.contact }}</router-link>
        <router-link to="/quiz"    class="uppercase hover:opacity-60 transition" @click="hideHamburger()">{{ langStore.t.nav.quiz }}</router-link>
        <router-link to="/journal" class="uppercase hover:opacity-60 transition" @click="hideHamburger()">Journal ✦</router-link>
        <!-- Mobile search -->
        <button @click="hideHamburger(); showSearch = true" class="flex items-center gap-2 uppercase hover:opacity-60 transition text-left">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Search
        </button>
        <div class="flex items-center gap-0.5 self-start rounded-full overflow-hidden" style="border:1.5px solid rgba(155,134,168,0.3);">
          <button
            v-for="[l, flag] in ([['fr','🇫🇷'],['en','🇬🇧'],['ar','🇹🇳']] as const)"
            :key="l"
            @click="langStore.setLang(l); hideHamburger()"
            class="px-2 py-1 text-base leading-none transition-all duration-200"
            :style="langStore.lang === l
              ? { background:'#9B86A8', opacity:'1' }
              : { background:'transparent', opacity:'0.45' }"
          >{{ flag }}</button>
        </div>
      </nav>
    </transition>
  </header>

  <!-- ── Search overlay (teleported to body) ─────────────── -->
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="showSearch"
        class="fixed inset-0 z-[300] flex flex-col items-center pt-20 px-4"
        style="background:rgba(61,43,31,0.55);"
        @click.self="closeSearch"
      >
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" style="border:1px solid #f0ebe3;">

          <!-- Input row -->
          <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom:1px solid #f0ebe3;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4 flex-shrink-0" style="color:#9B86A8;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search products, shades…"
              class="flex-1 text-sm outline-none bg-transparent"
              style="color:#3D2B1F;"
              @keydown="onSearchKeydown"
              @keyup.esc="closeSearch"
            />
            <span v-if="searchQuery" class="text-[10px] opacity-30 flex-shrink-0" style="color:#3D2B1F;">↑↓ · Enter</span>
            <button
              @click="closeSearch"
              class="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold transition hover:bg-[#f0ebe3]"
              style="color:#9B86A8;"
            >✕</button>
          </div>

          <!-- Results list -->
          <div v-if="searchResults.length" class="max-h-96 overflow-y-auto">
            <button
              v-for="(p, idx) in searchResults"
              :key="`${p.category}-${p.id}`"
              @click="goToProduct(p)"
              @mouseenter="activeIndex = idx"
              class="w-full flex items-center gap-3 px-4 py-3 transition text-left"
              :style="activeIndex === idx
                ? 'background:#FFF9F4;'
                : 'background:transparent;'"
              style="border-bottom:1px solid #f0ebe3;"
            >
              <div class="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style="background:#FFF9F4;">
                <img :src="p.src" :alt="p.header" class="h-full w-full object-contain" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate" style="color:#3D2B1F;">{{ p.header }}</p>
                <p class="text-[10px] capitalize mt-0.5" style="color:#9B86A8;">
                  {{ p.category }}
                  <span v-if="p.finalPrice" class="line-through opacity-50 ml-1">{{ p.price }}</span>
                  <span class="ml-1 font-bold" style="color:#C4828A;">{{ p.finalPrice ?? p.price }} TND</span>
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150" :style="activeIndex === idx ? 'color:#C4828A; transform:translateX(2px)' : 'color:#d1c7be;'">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <!-- No results -->
          <div v-else-if="searchQuery.length" class="px-4 py-8 text-center">
            <p class="text-sm opacity-50" style="color:#3D2B1F;">No results for <strong>"{{ searchQuery }}"</strong></p>
            <p class="text-[10px] mt-1 opacity-30" style="color:#3D2B1F;">Try a shade name or product type</p>
          </div>

          <!-- Empty prompt -->
          <div v-else class="px-4 py-6 text-center text-[10px] opacity-40" style="color:#3D2B1F;">
            Start typing to search products &amp; shades
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.cream-nav  { background: #FDF6EE; }
.scrolled-nav {
  background: rgba(253, 246, 238, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 16px rgba(196,130,138,0.08);
}

.nav-link {
  position: relative;
  text-transform: uppercase;
  color: #3D2B1F;
  transition: color 0.2s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #C4828A;
  transition: width 0.3s ease;
}
.nav-link:hover                  { color: #C4828A; }
.nav-link:hover::after           { width: 100%; }
.nav-link.router-link-active     { color: #C4828A; font-weight: 700; }
.nav-link.router-link-active::after { width: 100%; }
.nav-link--journal { color: #9B86A8; }
.nav-link--journal:hover { color: #C9A45A; }
.nav-link--journal.router-link-active { color: #C9A45A; }
.nav-link--journal.router-link-active::after { background: #C9A45A; }

.fade-down-enter-active, .fade-down-leave-active { transition: all 0.15s ease; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-6px); }

.search-fade-enter-active, .search-fade-leave-active { transition: all 0.2s ease; }
.search-fade-enter-from, .search-fade-leave-to { opacity: 0; }
</style>
