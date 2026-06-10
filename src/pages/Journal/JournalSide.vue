<script setup lang="ts">
import { useProductStore } from '../../pinia/productStore'
import type { DBProduct } from '../../pinia/productStore'

type PageType = 'cover-l' | 'cover-r' | 'img' | 'txt' | 'fin-l' | 'fin-r'
export interface JPage { type: PageType; product?: DBProduct; num?: number }

const props = defineProps<{ page: JPage; mobile?: boolean }>()
const store = useProductStore()

function rId(): number {
  if (!props.page.product) return 0
  const p = props.page.product
  return Math.max(0, [...store.rawProducts]
    .filter(x => x.category === p.category)
    .sort((a, b) => a.sort_order - b.sort_order)
    .findIndex(x => x.id === p.id))
}

function shortDesc(desc: string): string {
  if (!desc) return ''
  const max = props.mobile ? 120 : 200
  if (desc.length <= max) return desc
  return desc.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

function features(): string[] {
  return (props.page.product?.features || '').split('·').map(s => s.trim()).filter(Boolean)
}
</script>

<template>
  <div class="page-content">

    <!-- Cover Left: decorative inside cover -->
    <div v-if="page.type === 'cover-l'" class="cover-l">
      <div class="cl-frame">
        <div class="cl-pattern" aria-hidden="true">
          <span v-for="n in 35" :key="n">✦</span>
        </div>
        <div class="cl-center">
          <p class="cl-quote">&ldquo;La beauté se savoure</p>
          <p class="cl-quote">avec les yeux</p>
          <p class="cl-quote">avant les lèvres.&rdquo;</p>
          <p class="cl-author">— Exaucée</p>
        </div>
      </div>
    </div>

    <!-- Cover Right: title page -->
    <div v-else-if="page.type === 'cover-r'" class="cover-r">
      <div class="cr-content">
        <p class="cr-eyebrow">EXAUCÉE</p>
        <h1 class="cr-title">Le Journal</h1>
        <div class="cr-stars">✦ ✦ ✦</div>
        <p class="cr-season">Collection 2025</p>
        <div class="cr-rule"></div>
        <p class="cr-tagline">Beauté inspirée de la pâtisserie française</p>
      </div>
      <span class="page-num">{{ page.num }}</span>
    </div>

    <!-- Product image page -->
    <div v-else-if="page.type === 'img'" class="img-page">
      <div class="img-wrap">
        <img
          v-if="page.product?.src"
          :src="page.product.src"
          :alt="page.product?.name"
          class="prod-img"
        />
      </div>
      <p class="img-name">{{ page.product?.name }}</p>
      <span class="page-num page-num-l">{{ page.num }}</span>
    </div>

    <!-- Product text page -->
    <div v-else-if="page.type === 'txt' && page.product" class="txt-page">
      <p class="txt-no">N°&thinsp;{{ Math.ceil((page.num ?? 3) / 2) }}</p>
      <h2 class="txt-name">{{ page.product.name }}</h2>
      <p class="txt-sub">{{ page.product.subheader }}</p>
      <div class="txt-rule"></div>
      <p class="txt-desc">{{ shortDesc(page.product.description) }}</p>
      <ul class="txt-feats">
        <li v-for="f in features().slice(0, 4)" :key="f">
          <span class="feat-dot">✦</span>{{ f }}
        </li>
      </ul>
      <router-link
        :to="{ name: page.product.category, params: { id: rId() } }"
        class="txt-cta"
      >
        Découvrir →
      </router-link>
      <span class="page-num">{{ page.num }}</span>
    </div>

    <!-- Fin Left -->
    <div v-else-if="page.type === 'fin-l'" class="fin-l">
      <div class="fin-l-inner">
        <div class="fin-star">✦</div>
        <h2 class="fin-l-title">À bientôt</h2>
        <p class="fin-l-text">Merci d&rsquo;avoir feuilleté</p>
        <p class="fin-l-text">notre journal.</p>
        <p class="fin-sig">Exaucée</p>
      </div>
    </div>

    <!-- Fin Right -->
    <div v-else-if="page.type === 'fin-r'" class="fin-r">
      <div class="fin-r-inner">
        <p class="fin-r-eye">DÉCOUVRIR</p>
        <h2 class="fin-r-title">La Collection</h2>
        <div class="fin-r-stars">✦ ✦ ✦</div>
        <router-link to="/" class="fin-r-cta">Voir tous les produits →</router-link>
        <p class="fin-r-brand">Exaucée · 2025</p>
      </div>
    </div>

    <!-- Blank fallback -->
    <div v-else class="page-blank"></div>

  </div>
</template>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: 'Manrope', sans-serif;
  overflow: hidden;
}

.page-num {
  position: absolute;
  bottom: 16px;
  right: 20px;
  font-size: 9px;
  opacity: 0.3;
  font-style: italic;
  color: #3D2B1F;
  letter-spacing: 0.05em;
}
.page-num-l { right: auto; left: 20px; }

/* ── Cover Left ──────────────────────────── */
.cover-l {
  width: 100%; height: 100%;
  background: #f2ece0;
  display: flex; align-items: center; justify-content: center;
}
.cl-frame {
  width: calc(100% - 28px);
  height: calc(100% - 28px);
  border: 1px solid rgba(196,130,138,0.22);
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.cl-pattern {
  position: absolute; inset: 0;
  display: flex; flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px; padding: 16px;
  opacity: 0.07;
  font-size: 13px; color: #C4828A;
  overflow: hidden; pointer-events: none;
}
.cl-center { text-align: center; position: relative; z-index: 1; }
.cl-quote {
  font-family: 'Great Vibes', cursive;
  font-size: 19px; color: #3D2B1F; line-height: 1.6;
}
.cl-author {
  margin-top: 14px; font-size: 9px;
  letter-spacing: 0.2em; text-transform: uppercase; color: #9B86A8;
}

/* ── Cover Right ─────────────────────────── */
.cover-r {
  width: 100%; height: 100%;
  background: #faf7f0;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.cr-content { text-align: center; }
.cr-eyebrow {
  font-size: 8px; letter-spacing: 0.45em; color: #9B86A8;
  text-transform: uppercase; margin-bottom: 10px;
}
.cr-title {
  font-family: 'Great Vibes', cursive;
  font-size: 62px; color: #3D2B1F; line-height: 1; margin-bottom: 18px;
}
.cr-stars {
  font-size: 11px; color: #C4828A; letter-spacing: 8px; margin-bottom: 16px;
}
.cr-season {
  font-size: 10px; letter-spacing: 0.25em; color: #C9A45A;
  text-transform: uppercase; margin-bottom: 22px;
}
.cr-rule {
  width: 52px; height: 1px;
  background: rgba(196,130,138,0.28);
  margin: 0 auto 18px;
}
.cr-tagline {
  font-size: 10px; color: #9B86A8;
  font-style: italic; letter-spacing: 0.04em;
}

/* ── Image page ──────────────────────────── */
.img-page {
  width: 100%; height: 100%;
  background: linear-gradient(155deg, #fdf8f0 0%, #f5ede0 100%);
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.img-wrap {
  width: 78%; height: 70%;
  display: flex; align-items: center; justify-content: center;
}
.prod-img {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 36px rgba(0,0,0,0.14));
}
.img-name {
  position: absolute; bottom: 44px;
  left: 0; right: 0; text-align: center;
  font-family: 'Great Vibes', cursive;
  font-size: 28px; color: #3D2B1F; opacity: 0.45;
}

/* ── Text page ───────────────────────────── */
.txt-page {
  width: 100%; height: 100%;
  background: #faf7f0;
  padding: 38px 32px 32px;
  display: flex; flex-direction: column;
  position: relative;
  box-sizing: border-box;
}
.txt-no {
  font-size: 8px; letter-spacing: 0.35em; color: #C9A45A;
  text-transform: uppercase; margin-bottom: 8px;
}
.txt-name {
  font-family: 'Great Vibes', cursive;
  font-size: 52px; color: #3D2B1F; line-height: 1; margin-bottom: 6px;
}
.txt-sub {
  font-size: 9px; letter-spacing: 0.28em; color: #9B86A8;
  text-transform: uppercase; margin-bottom: 14px;
}
.txt-rule {
  width: 36px; height: 1px;
  background: rgba(196,130,138,0.38); margin-bottom: 16px;
}
.txt-desc {
  font-size: 11.5px; line-height: 1.8;
  color: #3D2B1F; opacity: 0.68;
  flex: 1; overflow: hidden;
}
.txt-feats {
  list-style: none; padding: 0; margin: 14px 0 18px;
  display: flex; flex-direction: column; gap: 5px;
}
.txt-feats li {
  font-size: 10px; color: #3D2B1F; opacity: 0.6;
  display: flex; align-items: center; gap: 7px;
}
.feat-dot { color: #C4828A; font-size: 7px; flex-shrink: 0; }

.txt-cta {
  display: inline-flex; align-items: center;
  align-self: flex-start;
  font-size: 9px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: #C4828A; text-decoration: none;
  border: 1px solid rgba(196,130,138,0.38);
  padding: 8px 18px; border-radius: 20px;
  transition: background 0.2s;
}
.txt-cta:hover { background: rgba(196,130,138,0.07); }

/* ── Fin Left ────────────────────────────── */
.fin-l {
  width: 100%; height: 100%;
  background: #f2ece0;
  display: flex; align-items: center; justify-content: center;
}
.fin-l-inner { text-align: center; }
.fin-star { font-size: 22px; color: #C4828A; margin-bottom: 16px; }
.fin-l-title {
  font-family: 'Great Vibes', cursive;
  font-size: 54px; color: #3D2B1F; margin-bottom: 14px;
}
.fin-l-text { font-size: 11px; color: #3D2B1F; opacity: 0.55; line-height: 1.9; }
.fin-sig {
  margin-top: 20px;
  font-family: 'Great Vibes', cursive;
  font-size: 26px; color: #C4828A; opacity: 0.65;
}

/* ── Fin Right ───────────────────────────── */
.fin-r {
  width: 100%; height: 100%;
  background: #faf7f0;
  display: flex; align-items: center; justify-content: center;
}
.fin-r-inner { text-align: center; }
.fin-r-eye {
  font-size: 8px; letter-spacing: 0.45em; color: #9B86A8;
  text-transform: uppercase; margin-bottom: 10px;
}
.fin-r-title {
  font-family: 'Great Vibes', cursive;
  font-size: 50px; color: #3D2B1F; margin-bottom: 14px;
}
.fin-r-stars {
  font-size: 11px; color: #C4828A; letter-spacing: 8px; margin-bottom: 22px;
}
.fin-r-cta {
  display: inline-block;
  padding: 10px 26px; border-radius: 30px;
  background: #C4828A; color: #fff;
  font-size: 9px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.2em;
  text-decoration: none; transition: background 0.2s;
  margin-bottom: 22px;
}
.fin-r-cta:hover { background: #A85560; }
.fin-r-brand {
  display: block; font-size: 9px; color: #9B86A8;
  letter-spacing: 0.22em; text-transform: uppercase;
}

.page-blank {
  width: 100%; height: 100%; background: #faf7f0;
}
</style>
