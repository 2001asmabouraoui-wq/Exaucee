import LandingPage from '../pages/Landing/landing-page.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { categoryRoute, productRoute, handleRouteMeta } from './route-utils'
import {
  get404PageMeta,
  getCheckoutPageMeta,
  getLandingPageMeta,
} from '../data/meta-utils'

// Admin path is stored in .env — not guessable from the URL
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'admin'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LandingPage,
    beforeEnter: () => handleRouteMeta(getLandingPageMeta),
  },
  {
    path: '/checkout',
    component: () => import('../pages/Checkout/checkout-page.vue'),
    beforeEnter: () => handleRouteMeta(getCheckoutPageMeta),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/About/about-page.vue'),
  },
  {
    path: '/safety',
    name: 'Safety',
    component: () => import('../pages/Health/health.vue'),
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../pages/Contact/contact.vue'),
  },
  {
    path: '/quiz',
    name: 'Quiz',
    component: () => import('../pages/Quiz/quiz-page.vue'),
  },
  {
    path: '/track',
    name: 'Track',
    component: () => import('../pages/Track/track-page.vue'),
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: () => import('../pages/FAQ/faq-page.vue'),
  },
  {
    path: '/bundles',
    name: 'Bundles',
    component: () => import('../pages/Bundles/bundles-page.vue'),
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('../pages/Account/account-page.vue'),
  },
  {
    path: '/wishlist-share',
    name: 'WishlistShare',
    component: () => import('../pages/Wishlist/wishlist-share-page.vue'),
  },
  {
    path: '/journal',
    name: 'Journal',
    component: () => import('../pages/Journal/journal-page.vue'),
  },
  {
    // Admin route — only accessible at the secret path from .env
    path: `/${ADMIN_PATH}`,
    name: 'Admin',
    component: () => import('../pages/Admin/admin-page.vue'),
  },
  // === CATEGORY ROUTES ===
  categoryRoute('lipgloss'),

  // === PRODUCT ROUTES ===
  productRoute('lipgloss'),

  {
    path: '/404',
    component: () => import('../pages/404/404-page.vue'),
    beforeEnter: () => handleRouteMeta(get404PageMeta),
  },
  {
    // Catch-all must be last — it would intercept /lipgloss/* if placed earlier
    path: '/:pathMatch(.*)',
    component: () => import('../pages/404/404-page.vue'),
    beforeEnter: () => handleRouteMeta(get404PageMeta),
  },
]

const Router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(_1, _2, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default Router
