import { defineStore } from 'pinia'
import { useCartStore } from './cartStore'
import { usePackagingStore } from './packagingStore'

export const useFormStore = defineStore('form', {
  state: () => ({
    bannerState: 'hide' as 'show' | 'hide',
    name: '',
    email: '',
    phone: '',
    address: '',
    zip: '',
    city: '',
    country: 'Tunisia',
    payment: 'electronic' as 'electronic' | 'cash',
    comment: '',
    giftWrap: false,
    loyaltyPointsRedeemed: 0,
    loyaltyDiscount: 0,
    showErrors: false,
    isSubmitting: false,
    submitError: '',
  }),

  actions: {
    bannerOn()  { this.bannerState = 'show' },
    bannerOff() { this.bannerState = 'hide' },

    setCash(e: Event) {
      e.preventDefault()
      this.payment = 'cash'
    },

    setElectronic(e: Event) {
      e.preventDefault()
      this.payment = 'electronic'
    },

    async submit() {
      const cartStore = useCartStore()
      if (cartStore.cartLength === 0) return

      const allValid =
        this.isValidName    === 'true' &&
        this.isValidEmail   === 'true' &&
        this.isValidPhone   !== 'false' &&
        this.isValidAddress === 'true' &&
        this.isValidZip     === 'true' &&
        this.isValidCity    === 'true' &&
        this.isValidCountry === 'true'

      if (!allValid) {
        this.showErrors = true
        return
      }

      this.showErrors = false
      this.isSubmitting = true
      this.submitError = ''

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const packagingStore = usePackagingStore()

        const response = await fetch(`${apiUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.name,
            email: this.email,
            phone: this.phone,
            address: this.address,
            zip: this.zip,
            city: this.city,
            country: this.country,
            payment_method: this.payment,
            comment: this.comment,
            items: Object.values(cartStore.cart).map(ci => ({
              name: ci.product.header,
              category: ci.product.category,
              price: ci.product.finalPrice ?? ci.product.price,
              quantity: ci.amount,
              image: ci.product.src,
            })),
            subtotal: cartStore.cartValue,
            shipping: cartStore.cartValue > cartStore.freeShippingThreshold ? 0 : cartStore.shipping,
            total: Math.max(0, cartStore.getGrandTotal + (this.giftWrap ? packagingStore.price : 0) - this.loyaltyDiscount),
            coupon_code: cartStore.coupon?.code || undefined,
            discount: cartStore.coupon?.discount || 0,
            gift_wrap: this.giftWrap,
            gift_wrap_fee: this.giftWrap ? packagingStore.price : 0,
            loyalty_points_redeemed: this.loyaltyPointsRedeemed || undefined,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error((err as any).error || 'Server error')
        }

        this.bannerOn()
        cartStore.removeCoupon()
        cartStore.clearCart()
      } catch (err: any) {
        console.error('Order submission failed:', err)
        this.submitError = 'Something went wrong. Please try again.'
      } finally {
        this.isSubmitting = false
      }
    },

    reset() {
      this.name = ''
      this.email = ''
      this.phone = ''
      this.address = ''
      this.zip = ''
      this.city = ''
      this.country = 'Tunisia'
      this.payment = 'electronic'
      this.comment = ''
      this.giftWrap = false
      this.loyaltyPointsRedeemed = 0
      this.loyaltyDiscount = 0
      this.showErrors = false
      this.isSubmitting = false
      this.submitError = ''
      this.bannerState = 'hide'
    },
  },

  getters: {
    showBanner:  (state) => state.bannerState === 'show',
    choseCash:   (state) => state.payment === 'cash',

    isValidName(state): 'empty' | 'true' | 'false' {
      if (!state.name) return 'empty'
      return /^[a-zA-ZÀ-ÿ\s',.'-]+$/.test(state.name) ? 'true' : 'false'
    },

    isValidEmail(state): 'empty' | 'true' | 'false' {
      if (!state.email) return 'empty'
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email) ? 'true' : 'false'
    },

    isValidPhone(state): 'empty' | 'true' | 'false' {
      if (!state.phone) return 'empty'
      const stripped = state.phone.replace(/[\s\-().]/g, '')
      return /^(\+216|00216)?[2-9]\d{7}$/.test(stripped) ? 'true' : 'false'
    },

    isValidAddress(state): 'empty' | 'true' | 'false' {
      if (!state.address) return 'empty'
      return state.address.trim().length >= 5 ? 'true' : 'false'
    },

    isValidZip(state): 'empty' | 'true' | 'false' {
      if (!state.zip) return 'empty'
      return /^\d{4}$/.test(state.zip.trim()) ? 'true' : 'false'
    },

    isValidCity(state): 'empty' | 'true' | 'false' {
      if (!state.city) return 'empty'
      return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(state.city.trim()) ? 'true' : 'false'
    },

    isValidCountry(state): 'empty' | 'true' | 'false' {
      if (!state.country) return 'empty'
      return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(state.country.trim()) ? 'true' : 'false'
    },
  },
})
