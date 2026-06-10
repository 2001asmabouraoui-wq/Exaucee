import { defineStore } from 'pinia'
import { product } from '../data/product-types.ts'
import { useStorage } from '@vueuse/core'

interface cartItem {
  product: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }
  amount: number
}

interface cart {
  [key: string]: cartItem
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: useStorage('cart', {} as cart),
    showCart: false,
    showQuickAdd: true,
    shipping: 8,              // 8 TND standard shipping in Tunisia
    freeShippingThreshold: 150, // free over 150 TND
    coupon: null as null | { code: string; type: string; discount: number; message: string },
  }),

  actions: {
    cartOn() {
      this.showCart = true
      document.body.classList.add('overflow-y-hidden')
    },

    cartOff() {
      this.showCart = false
      document.body.classList.remove('overflow-y-hidden')
    },

    addToCart(item: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }) {
      const finalPrice = item.finalPrice ?? item.price
      const optionsKey = item.selectedOptions ? JSON.stringify(item.selectedOptions) : ''
      const key = `${item.header}_${finalPrice}_${optionsKey}`

      if (key in this.cart) {
        this.cart[key].amount += 1
      } else {
        this.cart[key] = { product: { ...item, finalPrice }, amount: 1 }
      }
    },

    removeFromCart(item: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }) {
      const finalPrice = item.finalPrice ?? item.price
      const key = `${item.header}_${finalPrice}_${JSON.stringify(item.selectedOptions || {})}`

      if (key in this.cart) {
        if (this.cart[key].amount > 1) {
          this.cart[key].amount -= 1
        } else {
          delete this.cart[key]
        }
      }
    },

    clearCart() {
      this.cart = {}
    },

    applyCoupon(coupon: { code: string; type: string; discount: number; message: string }) {
      this.coupon = coupon
    },

    removeCoupon() {
      this.coupon = null
    },

    setQuantity(item: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }, qty: number) {
      const finalPrice = item.finalPrice ?? item.price
      const key = `${item.header}_${finalPrice}_${JSON.stringify(item.selectedOptions || {})}`
      if (key in this.cart) {
        if (qty <= 0) delete this.cart[key]
        else this.cart[key].amount = qty
      }
    },

    getProductAmount(item: product & { selectedOptions?: Record<string, boolean>; finalPrice?: number }): number {
      const key = `${item.header}_${item.finalPrice ?? item.price}_${JSON.stringify(item.selectedOptions || {})}`
      return this.cart[key]?.amount || 0
    },
  },

  getters: {
    cartValue(state) {
      let total = 0
      for (const key of Object.keys(state.cart)) {
        const ci = state.cart[key]
        total += ci.amount * (ci.product.finalPrice ?? ci.product.price)
      }
      return total
    },

    cartLength(state) {
      return Object.values(state.cart).reduce((acc, ci) => acc + ci.amount, 0)
    },

    isEmpty(state) {
      return Object.keys(state.cart).length === 0
    },

    getGrandTotal(): number {
      const base = this.cartValue > this.freeShippingThreshold
        ? this.cartValue
        : this.cartValue + this.shipping
      if (!this.coupon) return base
      if (this.coupon.type === 'free_shipping') {
        return this.cartValue // always free shipping
      }
      return Math.max(0, base - this.coupon.discount)
    },

    getVat(): string {
      return '0.00'
    },

    getFirstItem(state) {
      return Object.values(state.cart)[0]
    },

    getUniqueItems(state) {
      return Object.keys(state.cart).length
    },
  },
})
