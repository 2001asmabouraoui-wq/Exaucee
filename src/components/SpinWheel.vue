<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useLangStore } from '../pinia/langStore'

const langStore = useLangStore()

const PALETTE    = ['#FDEEF1', '#F7D9E0', '#D6E9DC', '#FFF9F4', '#C6B7CC']
const PRIZE_COLORS = [PALETTE[0], PALETTE[2], PALETTE[4], PALETTE[1], PALETTE[3], PALETTE[0], PALETTE[2], PALETTE[4]]
const PRIZE_ICONS  = ['🚚', '🌸', '✨', '🎀', '🧁', '🚚', '🌸', '✨']

const GOLD    = '#BFC4CC'
const GOLD_LT = '#E4E8ED'
const GOLD_DK = '#8890A0'
const GOLD_VDK= '#545C6C'

const prizes = computed(() =>
  langStore.t.spin.prizes.map((label: string, i: number) => ({ label, color: PRIZE_COLORS[i] }))
)

const NUM     = PRIZE_COLORS.length
const SEG_DEG = 360 / NUM

const canvasRef  = ref<HTMLCanvasElement | null>(null)
const visible    = ref(false)
const step       = ref<'form' | 'spinning' | 'won'>('form')
const email      = ref('')
const name       = ref('')
const rotation   = ref(0)
const winnerIdx  = ref<number | null>(null)
const error      = ref('')
const submitting = ref(false)
const sparkles   = ref<{ id: number; char: string; style: Record<string, string> }[]>([])

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function drawWheel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = 260, H = 260, cx = 130, cy = 130
  const R_RIM = 126   // outer edge of decorative gold rim
  const R_SEG = 116   // inner edge of gold rim / outer edge of segments
  const R_HUB = 22    // center hub radius

  ctx.clearRect(0, 0, W, H)

  // ── Drop shadow ──
  ctx.save()
  ctx.shadowColor   = 'rgba(80,40,10,0.30)'
  ctx.shadowBlur    = 24
  ctx.shadowOffsetY = 6
  ctx.beginPath()
  ctx.arc(cx, cy, R_RIM, 0, Math.PI * 2)
  ctx.fillStyle = GOLD
  ctx.fill()
  ctx.restore()

  // ── Segments ──
  for (let i = 0; i < NUM; i++) {
    const s = (i * SEG_DEG - 90) * Math.PI / 180
    const e = ((i + 1) * SEG_DEG - 90) * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R_SEG, s, e)
    ctx.closePath()
    ctx.fillStyle = prizes.value[i].color
    ctx.fill()
  }

  // Porcelain / enamel sheen overlay
  const sheen = ctx.createRadialGradient(cx - 20, cy - 20, 6, cx, cy, R_SEG)
  sheen.addColorStop(0,   'rgba(255,255,255,0.22)')
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  sheen.addColorStop(1,   'rgba(0,0,0,0.04)')
  ctx.beginPath()
  ctx.arc(cx, cy, R_SEG, 0, Math.PI * 2)
  ctx.fillStyle = sheen
  ctx.fill()

  // ── Gold spokes ──
  for (let i = 0; i < NUM; i++) {
    const a  = (i * SEG_DEG - 90) * Math.PI / 180
    const x1 = cx + R_HUB * Math.cos(a), y1 = cy + R_HUB * Math.sin(a)
    const x2 = cx + R_SEG  * Math.cos(a), y2 = cy + R_SEG  * Math.sin(a)
    const sg = ctx.createLinearGradient(x1, y1, x2, y2)
    sg.addColorStop(0, GOLD_LT)
    sg.addColorStop(1, GOLD_DK)
    ctx.beginPath()
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
    ctx.strokeStyle = sg
    ctx.lineWidth   = 2.5
    ctx.stroke()

    // Jewel dot where spoke meets the rim
    ctx.beginPath()
    ctx.arc(x2, y2, 3.5, 0, Math.PI * 2)
    const dg = ctx.createRadialGradient(x2 - 1, y2 - 1, 0.5, x2, y2, 3.5)
    dg.addColorStop(0, GOLD_LT); dg.addColorStop(1, GOLD)
    ctx.fillStyle   = dg
    ctx.fill()
    ctx.strokeStyle = GOLD_VDK
    ctx.lineWidth   = 0.7
    ctx.stroke()
  }

  // ── Text on segments ──
  for (let i = 0; i < NUM; i++) {
    const mid = (i * SEG_DEG + SEG_DEG / 2 - 90) * Math.PI / 180
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(mid)
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'middle'
    ctx.shadowColor  = 'rgba(255,255,255,0.7)'
    ctx.shadowBlur   = 2
    ctx.fillStyle    = '#3D2B1F'
    ctx.font         = '700 8.5px Manrope, Arial'
    ctx.fillText(prizes.value[i].label, R_SEG - 7, 0)
    ctx.restore()
  }

  // ── Outer decorative gold rim ──
  const rimG = ctx.createLinearGradient(cx - R_RIM, cy, cx + R_RIM, cy)
  rimG.addColorStop(0,    GOLD_VDK)
  rimG.addColorStop(0.15, GOLD_DK)
  rimG.addColorStop(0.4,  GOLD_LT)
  rimG.addColorStop(0.6,  GOLD)
  rimG.addColorStop(0.85, GOLD_LT)
  rimG.addColorStop(1,    GOLD_VDK)
  ctx.beginPath()
  ctx.arc(cx, cy, R_RIM, 0, Math.PI * 2)
  ctx.arc(cx, cy, R_SEG, 0, Math.PI * 2, true)
  ctx.fillStyle = rimG
  ctx.fill()

  // Clock-face tick marks on the rim
  for (let deg = 0; deg < 360; deg += 5) {
    const a      = (deg - 90) * Math.PI / 180
    const isMaj  = deg % SEG_DEG === 0
    const r1     = R_SEG + (isMaj ? 1 : 3)
    const r2     = R_RIM - 1
    ctx.beginPath()
    ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
    ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
    ctx.strokeStyle = isMaj ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)'
    ctx.lineWidth   = isMaj ? 1.2 : 0.6
    ctx.stroke()
  }

  // Rim border rings
  ctx.beginPath(); ctx.arc(cx, cy, R_RIM, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD_VDK; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, R_SEG, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD_DK;  ctx.lineWidth = 1;   ctx.stroke()

  // ── Center hub — three concentric rings ──
  const hubG = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, R_HUB)
  hubG.addColorStop(0, GOLD_LT); hubG.addColorStop(0.6, GOLD); hubG.addColorStop(1, GOLD_DK)
  ctx.beginPath(); ctx.arc(cx, cy, R_HUB, 0, Math.PI * 2)
  ctx.fillStyle = hubG; ctx.fill()
  ctx.strokeStyle = GOLD_VDK; ctx.lineWidth = 1.5; ctx.stroke()

  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fill()
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke()

  const innerDot = ctx.createRadialGradient(cx - 1, cy - 1, 1, cx, cy, 5)
  innerDot.addColorStop(0, GOLD_LT); innerDot.addColorStop(1, GOLD)
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = innerDot; ctx.fill()

  ctx.fillStyle       = GOLD_VDK
  ctx.font            = '700 8px Arial'
  ctx.textAlign       = 'center'
  ctx.textBaseline    = 'middle'
  ctx.shadowColor     = 'rgba(0,0,0,0)'
  ctx.shadowBlur      = 0
  ctx.fillText('✦', cx, cy)
}

function spawnSparkles() {
  const chars  = ['✦', '✧', '✩', '★', '✱', '⋆', '✸', '✺']
  const colors = ['#C9A45A', '#E8C97A', '#C4828A', '#C6B7CC', '#ffffff', '#F7D9E0', '#D6E9DC']
  sparkles.value = Array.from({ length: 24 }, (_, i) => ({
    id:   i,
    char: chars[Math.floor(Math.random() * chars.length)],
    style: {
      left:             `${4 + Math.random() * 92}%`,
      top:              `${6 + Math.random() * 60}%`,
      color:            colors[Math.floor(Math.random() * colors.length)],
      fontSize:         `${9 + Math.random() * 20}px`,
      animationDuration:`${1.8 + Math.random() * 2.8}s`,
      animationDelay:   `${Math.random() * 1.5}s`,
      textShadow:       '0 0 8px currentColor, 0 0 18px currentColor',
    },
  }))
  setTimeout(() => { sparkles.value = [] }, 5500)
}

function open()  { step.value = 'form'; error.value = ''; visible.value = true }
function close() {
  visible.value  = false
  step.value     = 'form'
  error.value    = ''
  email.value    = ''
  name.value     = ''
  sparkles.value = []
}

async function spin() {
  if (!email.value.trim())                                   { error.value = langStore.t.spin.emailPlaceholder; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value))  { error.value = langStore.t.spin.emailPlaceholder; return }
  error.value      = ''
  submitting.value = true

  const idx    = Math.floor(Math.random() * NUM)
  const offset = (NUM - idx) * SEG_DEG - SEG_DEG / 2
  rotation.value = rotation.value + 1800 + offset
  step.value     = 'spinning'

  fetch(`${apiUrl}/api/spin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: email.value.trim(), name: name.value.trim(), prize: prizes.value[idx].label }),
  }).catch(() => {})

  setTimeout(() => {
    winnerIdx.value  = idx
    step.value       = 'won'
    submitting.value = false
    localStorage.setItem('exaucee_spun', '1')
    spawnSparkles()
  }, 4100)
}

watch(visible, async (v) => { if (v) { await nextTick(); drawWheel() } })
watch(() => langStore.lang, async () => { if (visible.value) { await nextTick(); drawWheel() } })

if (!localStorage.getItem('exaucee_spun')) {
  setTimeout(() => { visible.value = true }, 8000)
}
</script>

<template>
  <!-- ── Floating trigger ── -->
  <button @click="open" class="sw-trigger">
    <span style="font-size:14px;">🎡</span>
    <span>{{ langStore.t.spin.trigger }}</span>
  </button>

  <Teleport to="body">
    <Transition name="sw-pop">
      <div v-if="visible" @click.self="close" class="sw-overlay">
        <div class="sw-modal">

          <!-- Shimmer sparkles (win) -->
          <div class="sw-sparkle-layer">
            <span v-for="s in sparkles" :key="s.id" class="sw-sparkle" :style="s.style">
              {{ s.char }}
            </span>
          </div>

          <!-- Top accent stripe -->
          <div class="sw-stripe" />

          <!-- Close -->
          <button @click="close" class="sw-close" aria-label="Close">✕</button>

          <!-- ── Header ── -->
          <div class="sw-header">
            <p class="sw-ornament">── ✦ ──</p>
            <h2 class="sw-title">{{ langStore.t.spin.trigger }}</h2>
            <p class="sw-tagline">{{ langStore.t.spin.tagline }}</p>
          </div>

          <!-- ── Wheel ── -->
          <div class="sw-wheel-area">
            <!-- Ornate pin pointer -->
            <div class="sw-pointer-wrap">
              <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
                <defs>
                  <linearGradient id="sw-pg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="#E4E8ED"/>
                    <stop offset="100%" stop-color="#8890A0"/>
                  </linearGradient>
                </defs>
                <path d="M9 28L1 12L9 0L17 12Z" fill="url(#sw-pg)" opacity="0.35"/>
                <path d="M9 28L3 14L9 3L15 14Z" fill="url(#sw-pg)"/>
                <circle cx="9" cy="11" r="6" fill="#E4E8ED" stroke="#8890A0" stroke-width="1"/>
                <circle cx="9" cy="11" r="3" fill="#BFC4CC"/>
              </svg>
            </div>
            <canvas
              ref="canvasRef"
              width="260"
              height="260"
              class="sw-canvas"
              :style="{
                transform:  `rotate(${rotation}deg)`,
                transition: step === 'spinning' ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
              }"
            />
          </div>

          <!-- ── Form ── -->
          <Transition name="sw-fade">
            <div v-if="step === 'form'" class="sw-form">
              <input v-model="email" type="email" :placeholder="langStore.t.spin.emailPlaceholder" class="sw-input" @keyup.enter="spin" />
              <p v-if="error" class="sw-error">{{ error }}</p>
              <button @click="spin" :disabled="submitting" class="sw-btn">
                {{ langStore.t.spin.spin }} &nbsp;✦
              </button>
            </div>
          </Transition>

          <!-- ── Spinning ── -->
          <Transition name="sw-fade">
            <div v-if="step === 'spinning'" class="sw-spin-wait">
              <div class="sw-dots"><span/><span/><span/></div>
              <p class="sw-spin-txt">Bonne chance… ✨</p>
            </div>
          </Transition>

          <!-- ── Won ── -->
          <Transition name="sw-fade">
            <div v-if="step === 'won' && winnerIdx !== null" class="sw-won">
              <div class="sw-prize-card">
                <p class="sw-prize-pre">── ✦ ──</p>
                <div class="sw-prize-icon">{{ PRIZE_ICONS[winnerIdx] }}</div>
                <p class="sw-prize-eyebrow">{{ langStore.t.spin.youWon }}</p>
                <p class="sw-prize-value">{{ prizes[winnerIdx].label }}</p>
              </div>
              <p class="sw-won-note">{{ langStore.t.spin.checkEmail }}</p>
              <button @click="close" class="sw-btn">{{ langStore.t.spin.close }} &nbsp;✦</button>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* ── Trigger ── */
.sw-trigger {
  position: fixed; bottom: 24px; left: 24px; z-index: 60;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 30px;
  background: linear-gradient(135deg, #FDEEF1, #D6E9DC);
  border: 1.5px solid rgba(191,196,204,0.55);
  color: #4A6340; font-family: 'Manrope', sans-serif;
  font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer;
  box-shadow: 0 6px 22px rgba(196,130,138,0.18), 0 2px 6px rgba(0,0,0,0.04);
  transition: transform 0.22s, box-shadow 0.22s;
}
.sw-trigger:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(196,130,138,0.25), 0 4px 10px rgba(0,0,0,0.06);
}

/* ── Overlay ── */
.sw-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(40,24,12,0.60);
  backdrop-filter: blur(10px);
}

/* ── Modal ── */
.sw-modal {
  position: relative; overflow: hidden;
  width: 100%; max-width: 340px;
  background: #FFFEF9;
  border-radius: 28px;
  font-family: 'Manrope', sans-serif;
  box-shadow:
    0 36px 90px rgba(61,43,31,0.24),
    0 8px 24px rgba(0,0,0,0.08),
    inset 0 0 0 1px rgba(201,164,90,0.22),
    inset 0 0 0 3px rgba(201,164,90,0.06);
}

.sw-stripe {
  height: 5px;
  background: linear-gradient(90deg, #F7D9E0, #C6B7CC, #C9A45A, #D6E9DC, #FFF9F4, #F7D9E0);
}

.sw-close {
  position: absolute; top: 13px; right: 15px; z-index: 22;
  background: none; border: none; cursor: pointer; line-height: 1;
  font-size: 13px; color: rgba(196,130,138,0.35);
  transition: color 0.15s;
}
.sw-close:hover { color: #C4828A; }

/* ── Header ── */
.sw-header { text-align: center; padding: 14px 28px 6px; }
.sw-ornament {
  font-size: 10px; color: #C9A45A; letter-spacing: 0.28em;
  margin: 0 0 2px; opacity: 0.75;
}
.sw-title {
  font-family: 'Great Vibes', cursive;
  font-size: 2.9rem; color: #C4828A; line-height: 1;
  margin: 0 0 4px;
  text-shadow: 0 1px 10px rgba(196,130,138,0.18);
}
.sw-tagline {
  font-size: 9px; font-weight: 700; letter-spacing: 0.22em;
  text-transform: uppercase; color: #9B86A8; margin: 0;
}

/* ── Wheel ── */
.sw-wheel-area {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  padding: 16px 0 8px;
}
.sw-pointer-wrap {
  position: absolute; top: 2px; left: 50%;
  transform: translateX(-50%); z-index: 10;
  filter: drop-shadow(0 2px 5px rgba(100,60,10,0.35));
}
.sw-canvas {
  display: block; border-radius: 50%;
  filter: drop-shadow(0 8px 20px rgba(90,50,10,0.20));
}

/* ── Form ── */
.sw-form {
  display: flex; flex-direction: column; gap: 8px;
  padding: 6px 24px 20px;
}
.sw-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 14px; border-radius: 12px;
  border: 1.5px solid rgba(201,164,90,0.22);
  background: rgba(253,246,238,0.55);
  font-size: 12px; font-family: 'Manrope', sans-serif;
  color: #3D2B1F; outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.sw-input:focus { border-color: #C9A45A; background: #fff; }
.sw-input::placeholder { color: #C8C0B8; }
.sw-error { font-size: 11px; text-align: center; color: #f87171; margin: 0; }

/* ── CTA Button ── */
.sw-btn {
  width: 100%; padding: 12px;
  border: none; border-radius: 30px;
  background: linear-gradient(135deg, #C4828A 0%, #9B86A8 100%);
  color: #fff; font-family: 'Manrope', sans-serif;
  font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.14em;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(196,130,138,0.3);
  transition: opacity 0.2s, transform 0.2s;
}
.sw-btn:hover:not(:disabled) { opacity: 0.91; transform: translateY(-1px); }
.sw-btn:disabled { opacity: 0.44; cursor: not-allowed; }

.sw-fine {
  font-size: 9px; text-align: center;
  color: #9B86A8; opacity: 0.5;
  margin: 0; letter-spacing: 0.06em;
}

/* ── Spinning state ── */
.sw-spin-wait { padding: 6px 24px 20px; text-align: center; }
.sw-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 6px; }
.sw-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: #C9A45A; opacity: 0.3;
  animation: sw-dot 1.2s ease-in-out infinite;
}
.sw-dots span:nth-child(2) { animation-delay: 0.2s; }
.sw-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes sw-dot {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1.2); }
}
.sw-spin-txt { font-size: 12px; font-weight: 700; color: #C9A45A; margin: 0; }

/* ── Won state ── */
.sw-won {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 4px 24px 22px;
  position: relative; z-index: 16;
}
.sw-prize-card {
  width: 100%; text-align: center; padding: 16px;
  background: linear-gradient(150deg, #FDEEF1 0%, #D6E9DC 100%);
  border-radius: 18px;
  border: 1.5px solid rgba(201,164,90,0.28);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.75);
}
.sw-prize-pre {
  font-size: 10px; color: #C9A45A; letter-spacing: 0.28em;
  margin: 0 0 8px; opacity: 0.7;
}
.sw-prize-icon { font-size: 2.8rem; line-height: 1; margin-bottom: 6px; }
.sw-prize-eyebrow {
  font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
  text-transform: uppercase; color: #9B86A8; margin: 0 0 3px;
}
.sw-prize-value {
  font-size: 1.7rem; font-weight: 900; color: #C4828A; margin: 0;
}
.sw-won-note {
  font-size: 11px; color: #3D2B1F; opacity: 0.6;
  text-align: center; line-height: 1.5; margin: 0;
}

/* ── Shimmer sparkles ── */
.sw-sparkle-layer {
  position: absolute; inset: 0;
  pointer-events: none; overflow: hidden; z-index: 15;
}
.sw-sparkle {
  position: absolute; line-height: 1;
  animation: sw-sparkle-rise ease-out forwards;
}
@keyframes sw-sparkle-rise {
  0%   { opacity: 0; transform: scale(0) translateY(0)    rotate(0deg);   }
  20%  { opacity: 1; transform: scale(1.4) translateY(-6px) rotate(60deg); }
  55%  { opacity: 0.85; transform: scale(1) translateY(-22px) rotate(150deg); }
  100% { opacity: 0; transform: scale(0.3) translateY(-50px) rotate(290deg); }
}

/* ── Pop-in transition ── */
.sw-pop-enter-active { transition: opacity 0.3s ease; }
.sw-pop-leave-active { transition: opacity 0.22s ease; }
.sw-pop-enter-from, .sw-pop-leave-to { opacity: 0; }
.sw-pop-enter-active .sw-modal { transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1); }
.sw-pop-enter-from   .sw-modal { transform: scale(0.86) translateY(20px); }

.sw-fade-enter-active, .sw-fade-leave-active { transition: opacity 0.2s; }
.sw-fade-enter-from,   .sw-fade-leave-to     { opacity: 0; }
</style>
