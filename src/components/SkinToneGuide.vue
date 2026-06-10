<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>()

const GUIDE = [
  {
    tone: 'Fair · Light',
    hex: '#F5DEB3',
    description: 'Porcelain to light beige',
    shades: [
      { name: 'Petal Pink', hex: '#F7D9E0' },
      { name: 'Vanilla Nude', hex: '#F5CEAE' },
      { name: 'Soft Coral', hex: '#F4A57E' },
      { name: 'Baby Rose', hex: '#F2ADB8' },
    ],
    tip: 'Opt for peachy pinks and soft nudes that add warmth without overwhelming.',
  },
  {
    tone: 'Medium · Warm',
    hex: '#C68642',
    description: 'Golden beige to warm tan',
    shades: [
      { name: 'Warm Mauve', hex: '#C9849A' },
      { name: 'Peachy Coral', hex: '#E8916A' },
      { name: 'Rose Berry', hex: '#C4828A' },
      { name: 'Caramel Blush', hex: '#D4927B' },
    ],
    tip: 'Warm corals and mauves complement the golden undertones beautifully.',
  },
  {
    tone: 'Olive · Tan',
    hex: '#8D6435',
    description: 'Olive to medium brown',
    shades: [
      { name: 'Terracotta', hex: '#BC6B45' },
      { name: 'Berry Mauve', hex: '#A0536A' },
      { name: 'Deep Rose', hex: '#B05870' },
      { name: 'Spiced Coral', hex: '#C96B4A' },
    ],
    tip: 'Rich terracottas and deep berries make skin glow against olive tones.',
  },
  {
    tone: 'Deep · Rich',
    hex: '#4A2C17',
    description: 'Deep brown to ebony',
    shades: [
      { name: 'Deep Plum', hex: '#6B3050' },
      { name: 'Rich Berry', hex: '#8B2252' },
      { name: 'Dark Rose', hex: '#9B3660' },
      { name: 'Burgundy', hex: '#7A2040' },
    ],
    tip: 'Bold plums and rich berries create stunning contrast on deeper skin.',
  },
]
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[400] flex items-center justify-center px-4"
      style="background:rgba(61,43,31,0.6);"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl" style="border:1px solid #f0ebe3; max-height:90vh; overflow-y:auto;">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5" style="border-bottom:1px solid #f0ebe3; background:#FFF9F4;">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">Shade Guide</p>
            <h2 class="font-great-vibes text-4xl mt-0.5" style="color:#3D2B1F;">Find Your Perfect Shade</h2>
          </div>
          <button
            @click="$emit('close')"
            class="h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold transition hover:bg-[#f0ebe3]"
            style="color:#9B86A8;"
          >✕</button>
        </div>

        <!-- Guide grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          <div
            v-for="g in GUIDE"
            :key="g.tone"
            class="rounded-2xl p-4 flex flex-col gap-3"
            style="border:1px solid #f0ebe3;"
          >
            <!-- Skin tone header -->
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 rounded-full flex-shrink-0 shadow-sm"
                :style="{ backgroundColor: g.hex }"
              ></div>
              <div>
                <p class="text-sm font-bold" style="color:#3D2B1F;">{{ g.tone }}</p>
                <p class="text-[10px] opacity-50" style="color:#3D2B1F;">{{ g.description }}</p>
              </div>
            </div>

            <!-- Recommended shades -->
            <div class="flex flex-wrap gap-2">
              <div
                v-for="s in g.shades"
                :key="s.name"
                class="flex items-center gap-1.5"
                :title="s.name"
              >
                <div class="h-6 w-6 rounded-full shadow-sm" :style="{ backgroundColor: s.hex }"></div>
                <span class="text-[10px]" style="color:#3D2B1F; opacity:0.7;">{{ s.name }}</span>
              </div>
            </div>

            <!-- Tip -->
            <p class="text-[11px] leading-relaxed italic" style="color:#9B86A8;">{{ g.tip }}</p>
          </div>
        </div>

        <div class="px-6 pb-6 text-center">
          <p class="text-[10px] opacity-40" style="color:#3D2B1F;">These are general guidelines — your unique undertone always matters most.</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
</style>
