import { meta, metaContainer } from './meta-types.ts'

export const landingPageMeta: meta = {
  title: 'Exaucée — Your wish, granted.',
  description:
    'Exaucée is a patisserie-inspired makeup brand from Tunisia. Discover our lip gloss collection — plumping, high-shine, and beautifully packaged.',
  image: '/products/categories/category-lipgloss.svg',
}

export const categoryPageMeta: metaContainer = {
  lipgloss: {
    title: 'Lip Gloss Collection | Exaucée',
    description:
      'High-shine, non-sticky lip glosses in three shades — Chantilly, Framboise, Caramel. Plumping formula, cruelty-free.',
    image: '/products/categories/category-lipgloss.svg',
  },
}

export const checkoutPageMeta: meta = {
  title: 'Checkout | Exaucée',
  description: 'Complete your Exaucée order.',
  image: '/products/categories/category-lipgloss.svg',
}

export const fofPageMeta: meta = {
  title: '404 — Page not found | Exaucée',
  description: '404: Page not found.',
  image: '/products/categories/category-lipgloss.svg',
}
