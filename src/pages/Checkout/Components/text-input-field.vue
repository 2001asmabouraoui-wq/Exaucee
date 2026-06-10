<script lang="ts" setup>
import { useFormStore } from '../../../pinia/formStore'
const formStore = useFormStore()

const props = defineProps<{
  type: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'
  validator: 'empty' | 'true' | 'false'
  id: string
  label: string
  containerClass?: string
  placeholder?: string
  minLength?: string
  maxLength?: string
  autocomplete?: 'off'
  required?: boolean
  errorMessage: string
}>()
</script>

<template>
  <div class="flex w-full flex-col gap-1" :class="containerClass" :data-test="`text-input-${props.id}`">
    <label class="text-xs font-bold uppercase tracking-widest opacity-70" style="color:#3D2B1F;" :for="props.id">
      {{ props.label }}<span v-if="props.required" class="ml-0.5" style="color:#C4828A;">*</span>
    </label>
    <input
      v-model="formStore[props.id]"
      :autocomplete="props.autocomplete"
      :type="props.type"
      :id="props.id"
      :maxlength="props.maxLength"
      :placeholder="props.placeholder"
      :required="props.required"
      :data-test="`text-input-field-${props.id}`"
      class="exaucee-input w-full rounded-xl px-4 py-3 text-sm font-Manrope outline-none transition-all duration-200"
      :class="props.validator === 'false' ? 'input-error' : ''"
      style="color:#3D2B1F;"
    />
    <p v-show="props.required && formStore.showErrors && props.validator === 'empty'" class="text-xs" style="color:#C4828A;">Required.</p>
    <p v-show="props.validator === 'false'" class="text-xs" style="color:#C4828A;">{{ props.errorMessage }}</p>
  </div>
</template>

<style scoped>
.exaucee-input {
  border: 1px solid #f0ebe3;
  background: #ffffff;
}
.exaucee-input:focus {
  border-color: #C4828A;
  box-shadow: 0 0 0 3px rgba(196,130,138,0.1);
}
.exaucee-input::placeholder { color: #3D2B1F55; }
.input-error { border-color: #f87171; }
.input-error:focus { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
</style>
