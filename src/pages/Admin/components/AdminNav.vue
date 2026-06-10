<script setup lang="ts">
defineProps<{
  adminLabel?: string
  onLogout: () => void
}>()
</script>

<template>
  <header class="admin-nav">
    <div class="nav-inner">

      <!-- Brand -->
      <div class="brand">
        <router-link to="/" class="brand-logo" title="View storefront">
          <span class="brand-star">✦</span>
          <span class="brand-name">Exaucée</span>
        </router-link>
        <span class="brand-sep">/</span>
        <span class="brand-tag">Admin</span>
      </div>

      <!-- Right side -->
      <div class="right-side">
        <!-- Admin badge -->
        <div class="admin-badge">
          <span class="badge-dot"></span>
          <span class="badge-label">{{ adminLabel || 'Super Admin' }}</span>
        </div>

        <!-- Storefront link -->
        <router-link to="/" class="nav-link" title="Open storefront in new tab" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-3.5 w-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Store
        </router-link>

        <!-- Logout -->
        <button @click="onLogout" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="h-3.5 w-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </div>

    </div>
  </header>
</template>

<style scoped>
.admin-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: #3D2B1F;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* Brand */
.brand { display: flex; align-items: center; gap: 8px; }
.brand-logo {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none;
  transition: opacity 0.2s;
}
.brand-logo:hover { opacity: 0.8; }
.brand-star  { color: #C9A45A; font-size: 14px; }
.brand-name  { color: #ffffff; font-family: 'Great Vibes', cursive; font-size: 22px; line-height: 1; }
.brand-sep   { color: rgba(255,255,255,0.2); font-size: 14px; margin: 0 2px; }
.brand-tag   { color: rgba(255,255,255,0.45); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; }

/* Right */
.right-side { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.admin-badge {
  display: flex; align-items: center; gap-x: 6px; gap: 6px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 4px 12px;
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #5A9E8A;
  flex-shrink: 0;
}
.badge-label { color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600; white-space: nowrap; }

.nav-link {
  display: flex; align-items: center; gap: 4px;
  color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  text-decoration: none; transition: color 0.2s;
}
.nav-link:hover { color: #C9A45A; }

.logout-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(196,130,138,0.15);
  border: 1px solid rgba(196,130,138,0.3);
  border-radius: 20px; padding: 6px 14px;
  color: #C4828A; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.logout-btn:hover {
  background: #C4828A; color: #fff; border-color: #C4828A;
}
</style>
