<script setup lang="ts">
import TextInputField from './text-input-field.vue'
import { useFormStore } from '../../../pinia/formStore.ts'
import { useLangStore } from '../../../pinia/langStore'

const formStore = useFormStore()
const langStore = useLangStore()
</script>

<template>
  <form class="col-span-2 h-full w-full rounded-2xl bg-white px-8 py-10" style="border:1px solid #f0ebe3;" id="checkoutForm">

    <!-- Header -->
    <div class="mb-8 flex flex-col gap-1">
      <p class="text-[10px] font-bold uppercase tracking-[0.25em]" style="color:#9B86A8;">{{ langStore.t.checkout.almostThere }}</p>
      <h1 class="font-great-vibes text-5xl" style="color:#3D2B1F;">{{ langStore.t.checkout.title }}</h1>
      <div class="mt-2 flex items-center gap-3">
        <div class="h-px w-10 bg-ex-gold opacity-40"></div>
        <span class="text-ex-gold text-xs">✦</span>
      </div>
    </div>

    <!-- Billing -->
    <div class="mb-8">
      <p class="mb-4 text-[10px] font-black uppercase tracking-[0.2em]" style="color:#C4828A;">{{ langStore.t.checkout.billingDetails }}</p>
      <div class="flex w-full flex-col gap-4 lg:grid lg:grid-cols-2">
        <TextInputField type="text"    :validator="formStore.isValidName"    id="name"    :label="langStore.t.checkout.labelName"    placeholder="Your Name"          error-message="Letters only."                       autocomplete="off" :required="true" />
        <TextInputField type="email"   :validator="formStore.isValidEmail"   id="email"   :label="langStore.t.checkout.labelEmail"   placeholder="you@mail.com"       error-message="Must be a valid email."              autocomplete="off" :required="true" />
        <TextInputField type="tel"     :validator="formStore.isValidPhone"   id="phone"   :label="langStore.t.checkout.labelPhone"   placeholder="+216 20 123 456"    error-message="Tunisian number (e.g. +216 20 123 456)." autocomplete="off" />
      </div>
    </div>

    <!-- Shipping -->
    <div class="mb-8">
      <p class="mb-4 text-[10px] font-black uppercase tracking-[0.2em]" style="color:#C4828A;">{{ langStore.t.checkout.shippingInfo }}</p>
      <div class="flex w-full flex-col gap-4 lg:grid lg:grid-cols-2">
        <TextInputField type="text" :validator="formStore.isValidAddress" id="address" :label="langStore.t.checkout.labelAddress" container-class="col-span-2" placeholder="Rue, Numéro, Quartier"  error-message="Please enter a valid address." autocomplete="off" :required="true" />
        <TextInputField type="text" :validator="formStore.isValidZip"     id="zip"     :label="langStore.t.checkout.labelZip"     placeholder="1000"   error-message="4-digit Tunisian postal code." autocomplete="off" max-length="4" :required="true" />
        <TextInputField type="text" :validator="formStore.isValidCity"    id="city"    :label="langStore.t.checkout.labelCity"    placeholder="Tunis"  error-message="Letters only."                autocomplete="off" :required="true" />
        <TextInputField type="text" :validator="formStore.isValidCountry" id="country" :label="langStore.t.checkout.labelCountry" placeholder="Tunisia" error-message="Letters only."               autocomplete="off" :required="true" />
      </div>
    </div>

    <!-- Payment -->
    <div>
      <p class="mb-4 text-[10px] font-black uppercase tracking-[0.2em]" style="color:#C4828A;">{{ langStore.t.checkout.payment }}</p>
      <p class="mb-3 text-xs font-bold uppercase tracking-widest opacity-60" style="color:#3D2B1F;">{{ langStore.t.checkout.paymentMethod }}</p>
      <div class="flex w-full flex-col gap-3 lg:grid lg:grid-cols-2">

        <button
          type="button"
          class="payment-option"
          :class="{ 'payment-option--active': !formStore.choseCash }"
          @click="formStore.setElectronic($event)"
          data-test="form-button-emoney"
        >
          <span class="payment-dot" :class="{ 'payment-dot--active': !formStore.choseCash }"></span>
          {{ langStore.t.checkout.eMoney }}
        </button>

        <button
          type="button"
          class="payment-option"
          :class="{ 'payment-option--active': formStore.choseCash }"
          @click="formStore.setCash($event)"
          data-test="form-button-cash"
        >
          <span class="payment-dot" :class="{ 'payment-dot--active': formStore.choseCash }"></span>
          {{ langStore.t.checkout.cash }}
        </button>

        <div class="col-span-2 flex flex-col gap-1.5">
          <label class="text-xs font-bold uppercase tracking-widest opacity-60" style="color:#3D2B1F;">{{ langStore.t.checkout.noteLabel }}</label>
          <textarea
            class="comment-area h-28 w-full rounded-xl p-3 text-sm font-Manrope"
            style="color:#3D2B1F;"
            :placeholder="langStore.t.checkout.notePlaceholder"
            v-model="formStore.comment"
            data-test="form-text-area"
          />
        </div>
      </div>
    </div>

  </form>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #f0ebe3;
  font-size: 0.8rem;
  font-weight: 600;
  color: #3D2B1F;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.payment-option--active {
  border-color: #C4828A;
  background-color: #FFF9F4;
}
.payment-option:hover { border-color: #C4828A; }

.payment-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  border: 1.5px solid #C4828A;
  flex-shrink: 0;
  transition: background 0.2s;
}
.payment-dot--active { background-color: #C4828A; }

.comment-area {
  border: 1px solid #f0ebe3;
  outline: none;
  resize: none;
  background: #ffffff;
  transition: border-color 0.2s;
}
.comment-area:focus { border-color: #C4828A; }
</style>
