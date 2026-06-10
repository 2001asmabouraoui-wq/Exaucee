<script setup lang="ts">
import { ref } from 'vue'
import Navigation from '../../components/navigation-global.vue'
import AnnouncementBar from '../../components/announcement-bar.vue'
import Footer from '../../components/footer-global.vue'

const openIndex = ref<number | null>(null)

const faqs = [
  {
    category: '🚚 Shipping',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Orders are typically delivered within 2–5 business days across Tunisia. Tunis, Sfax, and Sousse usually receive orders in 2–3 days. Remote regions may take up to 5–7 business days.',
      },
      {
        q: 'What are the shipping fees?',
        a: 'Standard shipping is 8 TND. Orders over 150 TND qualify for free shipping anywhere in Tunisia.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently we ship within Tunisia only. International shipping is planned for the near future.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes! Use our Order Tracking page and enter your email address or order ID to see the real-time status of your shipment.',
      },
    ],
  },
  {
    category: '🌿 Ingredients & Safety',
    items: [
      {
        q: 'Are Exaucée products halal?',
        a: 'Yes. All Exaucée formulas are 100% halal-certified. We do not use any animal-derived ingredients that are prohibited in Islam.',
      },
      {
        q: 'Are your products cruelty-free?',
        a: 'Absolutely. Exaucée is cruelty-free — we never test on animals and do not work with suppliers who do.',
      },
      {
        q: 'Are the products safe for sensitive skin?',
        a: 'Our formulas are dermatologically tested and free from parabens, sulfates, and harsh irritants. If you have known allergies, please review the full ingredient list on each product page or contact us.',
      },
      {
        q: 'Where are Exaucée products made?',
        a: 'Exaucée products are crafted in Tunisia using ingredients sourced from France and Italy, maintaining the patisserie-inspired quality the brand is known for.',
      },
    ],
  },
  {
    category: '↩️ Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery for unopened, unused products in their original packaging. To start a return, contact us at contact@exaucee.tn with your order ID.',
      },
      {
        q: 'What if I received a damaged or wrong product?',
        a: 'We sincerely apologise. Please contact us within 48 hours of delivery with a photo of the item and your order ID. We will send a replacement or issue a full refund.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Once we receive the returned item, refunds are processed within 5–7 business days to your original payment method.',
      },
    ],
  },
  {
    category: '💳 Payment',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We currently accept Cash on Delivery (COD) and e-money transfers (D17, Flouci). Credit card payments are coming soon.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. We do not store any payment credentials. All transactions go through secure, encrypted channels.',
      },
      {
        q: 'Can I use a coupon or referral code?',
        a: 'Yes! Enter your coupon or referral code at checkout in the "Apply Code" field and the discount will be applied automatically.',
      },
    ],
  },
  {
    category: '🎁 Orders & Gifts',
    items: [
      {
        q: 'Can I add gift wrapping to my order?',
        a: 'Yes! At checkout, check the "Gift wrapping" option for a beautiful Exaucée-branded gift presentation (+5 TND).',
      },
      {
        q: 'Can I add a gift message?',
        a: 'Absolutely — use the "Note" field at checkout to include a personal message and we will include it with your gift.',
      },
      {
        q: 'How do I modify or cancel my order?',
        a: 'Orders can be modified or cancelled within 1 hour of placement. Contact us immediately at contact@exaucee.tn or via Instagram.',
      },
    ],
  },
]

function toggle(catI: number, itemI: number) {
  const key = catI * 100 + itemI
  openIndex.value = openIndex.value === key ? null : key
}
function isOpen(catI: number, itemI: number) {
  return openIndex.value === catI * 100 + itemI
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center font-Manrope select-none" style="background-color:#FFF9F4;">
    <AnnouncementBar />
    <Navigation color="k-black" />

    <main class="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-16 gap-12 flex-grow">

      <!-- Header -->
      <div class="flex flex-col items-center text-center">
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-3" style="color:#9B86A8;">Help Centre</p>
        <h1 class="font-great-vibes text-6xl drop-shadow-sm" style="color:#3D2B1F;">FAQ</h1>
        <div class="mt-4 flex items-center gap-3">
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
          <span class="text-ex-gold text-sm">✦</span>
          <div class="h-px w-12 bg-ex-gold opacity-40"></div>
        </div>
        <p class="mt-4 text-sm opacity-60" style="color:#3D2B1F;">Everything you need to know about orders, products, and more.</p>
      </div>

      <!-- FAQ sections -->
      <div class="w-full flex flex-col gap-8">
        <div v-for="(section, ci) in faqs" :key="ci">
          <h2 class="text-sm font-black uppercase tracking-widest mb-4" style="color:#C4828A;">{{ section.category }}</h2>
          <div class="flex flex-col gap-2">
            <div
              v-for="(item, ii) in section.items"
              :key="ii"
              class="rounded-2xl overflow-hidden bg-white"
              style="border:1px solid #f0ebe3;"
            >
              <button
                @click="toggle(ci, ii)"
                class="w-full flex items-center justify-between px-6 py-4 text-left transition hover:bg-[#FFF9F4]"
              >
                <span class="text-sm font-semibold" style="color:#3D2B1F;">{{ item.q }}</span>
                <span class="text-lg transition-transform duration-300 flex-shrink-0 ml-4" :class="isOpen(ci, ii) ? 'rotate-45' : ''" style="color:#C4828A;">+</span>
              </button>
              <Transition name="faq-slide">
                <div v-if="isOpen(ci, ii)" class="px-6 pb-5">
                  <p class="text-sm leading-relaxed opacity-70" style="color:#3D2B1F;">{{ item.a }}</p>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Still have questions -->
      <div class="w-full rounded-2xl p-8 text-center" style="background:#ffffff; border:1px solid #f0ebe3;">
        <p class="text-xs font-bold uppercase tracking-widest mb-2" style="color:#9B86A8;">Still have questions?</p>
        <p class="text-sm mb-5 opacity-70" style="color:#3D2B1F;">Our team is happy to help you.</p>
        <router-link
          to="/contact"
          class="inline-flex items-center gap-2 rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest transition"
          style="background:#C4828A; color:#fff;"
        >
          Contact Us
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3 w-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </router-link>
      </div>

    </main>

    <Footer />
  </div>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }
.faq-slide-enter-active { transition: all 0.2s ease; }
.faq-slide-leave-active { transition: all 0.15s ease; }
.faq-slide-enter-from, .faq-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
