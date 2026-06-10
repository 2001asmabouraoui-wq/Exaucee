<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '../../pinia/productStore'
import type { DBProduct } from '../../pinia/productStore'
import JournalSide from './JournalSide.vue'
import type { JPage } from './JournalSide.vue'

const store = useProductStore()

// ── Sound ─────────────────────────────────────────────────────────────────────
const soundOn = ref(true)

function playFlip() {
  if (!soundOn.value) return
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC() as AudioContext
    const dur = 0.2
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const ch  = buf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.8) * 0.6
    }
    const src  = ctx.createBufferSource()
    src.buffer = buf
    const bpf  = ctx.createBiquadFilter()
    bpf.type = 'bandpass'; bpf.frequency.value = 1100; bpf.Q.value = 1.2
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, 0)
    gain.gain.exponentialRampToValueAtTime(0.001, dur)
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination)
    src.start()
    setTimeout(() => ctx.close(), 600)
  } catch { /* silent fail if AudioContext blocked */ }
}

// ── Spreads ───────────────────────────────────────────────────────────────────
type Spread = { l: JPage; r: JPage }

const spreads = computed<Spread[]>(() => {
  const prods = [...store.rawProducts].sort((a, b) => a.sort_order - b.sort_order)
  const s: Spread[] = [{ l: { type: 'cover-l' }, r: { type: 'cover-r', num: 1 } }]
  prods.forEach((p: DBProduct, i: number) => {
    s.push({
      l: { type: 'img', product: p, num: i * 2 + 2 },
      r: { type: 'txt', product: p, num: i * 2 + 3 },
    })
  })
  s.push({ l: { type: 'fin-l' }, r: { type: 'fin-r' } })
  return s
})

// ── Responsive ────────────────────────────────────────────────────────────────
const mobile = ref(false)
const checkM = () => { mobile.value = window.innerWidth < 640 }

// ── Flip state ────────────────────────────────────────────────────────────────
const cur    = ref(0)
const flip   = ref(false)
const fDir   = ref<'fwd' | 'bwd'>('fwd')
const fTgt   = ref(0)
const fFront = ref<JPage>({ type: 'cover-r' })
const fBack  = ref<JPage>({ type: 'cover-l' })

// Static pages: the "holding" side doesn't change; the "destination" side shows target
const showL = computed<JPage>(() => {
  if (!flip.value) return spreads.value[cur.value]?.l ?? { type: 'cover-l' }
  // Forward flip: left stays on current (flipper sweeps from right)
  // Backward flip: left switches to target (flipper sweeps from left, reveals target.l)
  return fDir.value === 'fwd'
    ? spreads.value[cur.value]?.l ?? { type: 'cover-l' }
    : spreads.value[fTgt.value]?.l ?? { type: 'cover-l' }
})

const showR = computed<JPage>(() => {
  if (!flip.value) return spreads.value[cur.value]?.r ?? { type: 'cover-r' }
  if (mobile.value) return spreads.value[fTgt.value]?.r ?? { type: 'cover-r' }
  // Forward flip: right switches to target (hidden under flipper → revealed)
  // Backward flip: right stays on current
  return fDir.value === 'fwd'
    ? spreads.value[fTgt.value]?.r ?? { type: 'cover-r' }
    : spreads.value[cur.value]?.r ?? { type: 'cover-r' }
})

function go(to: number) {
  if (flip.value || to < 0 || to >= spreads.value.length) return
  const dir = to > cur.value ? 'fwd' : 'bwd'
  fDir.value = dir
  fTgt.value = to
  if (!mobile.value) {
    // Desktop: the flipper covers either the right half (fwd) or left half (bwd)
    fFront.value = dir === 'fwd'
      ? spreads.value[cur.value]?.r ?? { type: 'cover-r' }
      : spreads.value[cur.value]?.l ?? { type: 'cover-l' }
    fBack.value = dir === 'fwd'
      ? spreads.value[to]?.l ?? { type: 'cover-l' }
      : spreads.value[to]?.r ?? { type: 'cover-r' }
  } else {
    // Mobile: single-page flip
    fFront.value = spreads.value[cur.value]?.r ?? { type: 'cover-r' }
    fBack.value  = spreads.value[to]?.r ?? { type: 'cover-r' }
  }
  playFlip()
  flip.value = true
}

// Called by @animationend.self on the flipper — fires at the exact right moment
function onFlipEnd() {
  cur.value  = fTgt.value
  flip.value = false
}

const next = () => go(cur.value + 1)
const prev = () => go(cur.value - 1)

// ── Keyboard ──────────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft')  prev()
}

// ── Wheel ─────────────────────────────────────────────────────────────────────
let wAcc = 0
let wTimer: ReturnType<typeof setTimeout> | null = null

function onWheel(e: WheelEvent) {
  e.preventDefault()
  wAcc += e.deltaX + e.deltaY
  if (wTimer) clearTimeout(wTimer)
  wTimer = setTimeout(() => { wAcc = 0 }, 350)
  if (wAcc > 90)  { next(); wAcc = 0 }
  if (wAcc < -90) { prev(); wAcc = 0 }
}

// ── Touch ─────────────────────────────────────────────────────────────────────
let tx0 = 0
function onTouchStart(e: TouchEvent) { tx0 = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - tx0
  if (dx < -48) next()
  if (dx > 48)  prev()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  checkM()
  if (!store.loaded) store.fetchProducts()
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', checkM)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', checkM)
})
</script>

<template>
  <div
    class="journal-root"
    @wheel.prevent="onWheel"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- Dark wood desk background -->
    <div class="desk" aria-hidden="true"></div>

    <!-- Top bar -->
    <header class="jnl-header">
      <router-link to="/" class="back-link">← Retour</router-link>
      <div class="header-center">
        <span class="header-star">✦</span>
        <span class="header-title">Le Journal Exaucée</span>
        <span class="header-star">✦</span>
      </div>
      <button
        class="sound-btn"
        @click="soundOn = !soundOn"
        :title="soundOn ? 'Son activé — cliquer pour désactiver' : 'Son désactivé'"
      >{{ soundOn ? '🔊' : '🔇' }}</button>
    </header>

    <!-- Stage: arrows + book -->
    <div class="stage">
      <button
        class="arrow arrow-l"
        :class="{ 'arrow--disabled': cur === 0 || flip }"
        :disabled="cur === 0 || flip"
        @click="prev"
        aria-label="Page précédente"
      >&#8249;</button>

      <!-- Shadow wrapper (separate from perspective to avoid 3D rendering glitch) -->
      <div class="book-outer" :class="{ 'book-outer--mobile': mobile }">
      <!-- Perspective wrapper (no filter/transform allowed here — would flatten 3D children) -->
      <div class="book-wrap" :class="{ 'book-wrap--mobile': mobile }">
        <div class="book" :class="{ 'book--mobile': mobile }">

          <!-- Left static page (desktop only) -->
          <div v-if="!mobile" class="page page--left">
            <JournalSide :page="showL" />
            <div class="shade shade--left" aria-hidden="true"></div>
          </div>

          <!-- Spine (desktop) -->
          <div v-if="!mobile" class="spine" aria-hidden="true"></div>

          <!-- Right static page -->
          <div class="page" :class="mobile ? 'page--single' : 'page--right'">
            <JournalSide :page="showR" :mobile="mobile" />
            <div v-if="!mobile" class="shade shade--right" aria-hidden="true"></div>
            <!-- Page-turn corner curl (right page only) -->
            <div v-if="!mobile" class="corner-curl" aria-hidden="true"></div>
          </div>

          <!-- Flipper: @animationend.self fires when the flip CSS animation completes -->
          <div
            v-if="flip"
            class="flipper"
            :class="mobile
              ? 'flipper--mobile'
              : (fDir === 'fwd' ? 'flipper--fwd' : 'flipper--bwd')"
            @animationend.self="onFlipEnd"
          >
            <div class="face face--front">
              <JournalSide :page="fFront" :mobile="mobile" />
            </div>
            <div class="face face--back">
              <JournalSide :page="fBack" :mobile="mobile" />
            </div>
          </div>

        </div>
      </div>
      </div><!-- /.book-outer -->

      <button
        class="arrow arrow-r"
        :class="{ 'arrow--disabled': cur === spreads.length - 1 || flip }"
        :disabled="cur === spreads.length - 1 || flip"
        @click="next"
        aria-label="Page suivante"
      >&#8250;</button>
    </div>

    <!-- Progress dots -->
    <nav class="dots" aria-label="Sections du journal">
      <button
        v-for="(_, i) in spreads"
        :key="i"
        class="dot"
        :class="{ 'dot--on': i === cur }"
        :aria-label="`Aller à la section ${i + 1}`"
        @click="go(i)"
      />
    </nav>

    <!-- Keyboard/swipe hint -->
    <p class="hint">← → clavier · swipe · molette pour tourner les pages</p>
  </div>
</template>

<style scoped>
/* ── Root & desk ─────────────────────────────────────────────────────────── */
.journal-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.desk {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(ellipse at 50% 35%, #3a2212 0%, #1d0d05 65%, #0e0602 100%);
}
/* subtle grain on the desk */
.desk::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.45;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.05'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  pointer-events: none;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.jnl-header {
  position: relative;
  z-index: 20;
  width: 100%;
  max-width: 920px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 0;
  flex-shrink: 0;
}

.back-link {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.38);
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}
.back-link:hover { color: #C9A45A; }

.header-center {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}
.header-title { color: rgba(255,255,255,0.6); }
.header-star  { color: #C9A45A; font-size: 9px; }

.sound-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 17px;
  opacity: 0.55;
  transition: opacity 0.2s;
  padding: 4px;
  line-height: 1;
}
.sound-btn:hover { opacity: 1; }

/* ── Stage (arrows + book) ───────────────────────────────────────────────── */
.stage {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  flex: 1;
  padding: 28px 0 20px;
  width: 100%;
}

/* ── Shadow outer wrapper (NEVER put filter on perspective containers) ─────── */
.book-outer {
  flex-shrink: 0;
  /* Use a blurred pseudo-element shadow so the perspective container stays clean */
  position: relative;
}
.book-outer::after {
  content: '';
  position: absolute;
  left: 8%; right: 8%;
  bottom: -18px;
  height: 48px;
  background: rgba(0,0,0,0.55);
  filter: blur(22px);
  border-radius: 50%;
  z-index: -1;
  pointer-events: none;
}

/* ── Book perspective wrapper (NO filter, NO transform — only perspective) ─── */
.book-wrap {
  perspective: 2400px;
}
.book-wrap--mobile { perspective: 1400px; }

/* ── Book ─────────────────────────────────────────────────────────────────── */
.book {
  position: relative;
  width: 820px;
  height: 556px;
  display: flex;
  transform-style: preserve-3d;
}

.book--mobile {
  width: 320px;
  height: 480px;
}

/* ── Pages ────────────────────────────────────────────────────────────────── */
.page {
  position: relative;
  width: 410px;
  height: 556px;
  background: #faf7f0;
  overflow: hidden;
  flex-shrink: 0;
}
.page--left  { background: #f6f1e6; }
.page--right { background: #faf7f0; }
.page--single { width: 320px; height: 480px; background: #faf7f0; }

/* Paper line texture */
.page::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 30px,
    rgba(0,0,0,0.013) 30px,
    rgba(0,0,0,0.013) 31px
  );
  pointer-events: none;
  z-index: 3;
}

/* Inner gutter shadow (depth at the spine) */
.shade {
  position: absolute;
  top: 0; bottom: 0;
  width: 72px;
  pointer-events: none;
  z-index: 4;
}
.shade--left  { right: 0; background: linear-gradient(to right, transparent, rgba(0,0,0,0.10)); }
.shade--right { left: 0;  background: linear-gradient(to left,  transparent, rgba(0,0,0,0.10)); }

/* Page-turn curl hint at bottom-right corner */
.corner-curl {
  position: absolute;
  bottom: 0; right: 0;
  z-index: 5;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 0 20px 20px;
  border-color: transparent transparent #ede7d9 transparent;
  filter: drop-shadow(-2px -2px 4px rgba(0,0,0,0.13));
}

/* ── Spine ────────────────────────────────────────────────────────────────── */
.spine {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 100%;
  z-index: 6;
  pointer-events: none;
  background: linear-gradient(to right,
    rgba(0,0,0,0.22) 0%,
    rgba(255,255,255,0.10) 45%,
    rgba(0,0,0,0.22) 100%
  );
}

/* ── Flipper ──────────────────────────────────────────────────────────────── */
.flipper {
  position: absolute;
  top: 0;
  transform-style: preserve-3d;
  z-index: 10;
}

/* Forward: right half flips left (rotateY 0 → -180, origin = left edge = spine) */
.flipper--fwd {
  right: 0;
  width: 410px; height: 556px;
  transform-origin: 0% 50%;
  animation: flip-fwd 0.68s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}

/* Backward: left half flips right (rotateY 0 → +180, origin = right edge = spine) */
.flipper--bwd {
  left: 0;
  width: 410px; height: 556px;
  transform-origin: 100% 50%;
  animation: flip-bwd 0.68s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}

/* Mobile: single page flips with a slight perspective */
.flipper--mobile {
  left: 0;
  width: 320px; height: 480px;
  transform-origin: 50% 50%;
  animation: flip-mobile 0.62s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}

@keyframes flip-fwd {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-180deg); }
}
@keyframes flip-bwd {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(180deg); }
}
@keyframes flip-mobile {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-180deg); }
}

/* Flipper faces */
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  background: #faf7f0;
}
/* Paper line texture on faces too */
.face::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent, transparent 30px,
    rgba(0,0,0,0.013) 30px,
    rgba(0,0,0,0.013) 31px
  );
  pointer-events: none;
  z-index: 3;
}
/* Light shadow on face edges to sell the 3D depth */
.face--front::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to left, rgba(0,0,0,0.06) 0%, transparent 30%);
  z-index: 4;
  pointer-events: none;
}
.face--back {
  transform: rotateY(180deg);
  background: #f6f1e6;
}
.face--back::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.06) 0%, transparent 30%);
  z-index: 4;
  pointer-events: none;
}

/* ── Arrows ───────────────────────────────────────────────────────────────── */
.arrow {
  position: relative; z-index: 20;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.55);
  width: 46px; height: 46px;
  border-radius: 50%;
  font-size: 28px; font-weight: 200; line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
}
.arrow:hover:not(.arrow--disabled) {
  background: rgba(196,130,138,0.22);
  border-color: rgba(196,130,138,0.45);
  color: #fff;
}
.arrow--disabled { opacity: 0.18; cursor: not-allowed; }

/* ── Dots ─────────────────────────────────────────────────────────────────── */
.dots {
  position: relative; z-index: 20;
  display: flex; gap: 7px;
  margin-bottom: 10px;
}
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  border: none; cursor: pointer;
  padding: 0;
  transition: all 0.25s;
}
.dot--on {
  background: #C9A45A;
  transform: scale(1.4);
}

/* ── Hint ─────────────────────────────────────────────────────────────────── */
.hint {
  position: relative; z-index: 20;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.18);
  margin-bottom: 22px;
  text-align: center;
}

/* ── Responsive scale-down (tablet) ─────────────────────────────────────── */
@media (max-width: 900px) {
  /* Scale the outer wrapper, not the perspective container */
  .book-outer { transform: scale(0.78); transform-origin: center center; }
  .stage { padding: 10px 0 10px; }
}
@media (max-width: 640px) {
  .stage { gap: 12px; padding: 20px 0 12px; }
  .arrow { width: 38px; height: 38px; font-size: 22px; }
}
</style>
