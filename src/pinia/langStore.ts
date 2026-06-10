import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fr, ar, en, type Translations } from '../locales/index'

export type Lang = 'fr' | 'ar' | 'en'

const MAP: Record<Lang, Translations> = { fr, ar, en }

export const useLangStore = defineStore('lang', () => {
  const lang = ref<Lang>((localStorage.getItem('exaucee_lang') as Lang) || 'fr')

  const isRTL = computed(() => lang.value === 'ar')

  const t = computed<Translations>(() => MAP[lang.value])

  function applyDom() {
    document.documentElement.dir  = isRTL.value ? 'rtl' : 'ltr'
    document.documentElement.lang = lang.value
    document.documentElement.classList.toggle('font-cairo', isRTL.value)
  }

  function setLang(l: Lang) {
    lang.value = l
    localStorage.setItem('exaucee_lang', l)
    applyDom()
  }

  function toggle() {
    const order: Lang[] = ['fr', 'en', 'ar']
    const next = order[(order.indexOf(lang.value) + 1) % order.length]
    setLang(next)
  }

  function init() {
    applyDom()
  }

  return { lang, isRTL, t, setLang, toggle, init }
})
