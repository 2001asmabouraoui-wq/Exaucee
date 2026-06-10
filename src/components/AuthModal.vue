<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../pinia/authStore'

const props = defineProps<{ modelValue: boolean; initialTab?: 'signin' | 'signup' }>()
const emit  = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>()

const auth = useAuthStore()

type Tab = 'signin' | 'signup' | 'reset' | 'confirm'
const tab = ref<Tab>(props.initialTab || 'signin')

watch(() => props.modelValue, (v) => { if (v) tab.value = props.initialTab || 'signin' })

// Fields
const name            = ref('')
const email           = ref('')
const password        = ref('')
const confirmPassword = ref('')
const showPass        = ref(false)
const errorMsg        = ref('')
const successMsg      = ref('')

function close() { emit('update:modelValue', false) }
function reset()  { errorMsg.value = ''; successMsg.value = '' }
function switchTab(t: Tab) { tab.value = t; reset() }

async function handleSignIn() {
  reset()
  if (!email.value || !password.value) { errorMsg.value = 'Please fill in all fields.'; return }
  const result = await auth.signIn(email.value, password.value)
  if (!result.success) { errorMsg.value = result.error || 'Incorrect email or password.'; return }
  emit('success')
  close()
}

async function handleSignUp() {
  reset()
  if (!name.value || !email.value || !password.value) { errorMsg.value = 'Please fill in all fields.'; return }
  if (password.value.length < 6) { errorMsg.value = 'Password must be at least 6 characters.'; return }
  if (password.value !== confirmPassword.value) { errorMsg.value = 'Passwords do not match.'; return }
  const result = await auth.signUp(email.value, password.value, name.value)
  if (!result.success) { errorMsg.value = result.error || 'Sign up failed.'; return }
  if (result.confirmEmail) { tab.value = 'confirm' } else { emit('success'); close() }
}

async function handleReset() {
  reset()
  if (!email.value) { errorMsg.value = 'Please enter your email.'; return }
  try {
    await auth.resetPassword(email.value)
    successMsg.value = 'Check your email for the reset link.'
  } catch (e: any) {
    errorMsg.value = e.message || 'Could not send reset email.'
  }
}


</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[200] flex items-center justify-center px-4"
        style="background:rgba(61,43,31,0.45); backdrop-filter:blur(4px);"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          style="font-family:'Manrope',sans-serif;"
        >
          <!-- Top stripe -->
          <div class="h-1.5 w-full" style="background:linear-gradient(90deg,#C4828A,#9B86A8,#C9A45A);"></div>

          <!-- Close -->
          <button
            @click="close"
            class="absolute top-4 right-4 text-lg leading-none transition"
            style="color:#C4C4C4;"
            aria-label="Close"
          >✕</button>

          <!-- Header -->
          <div class="pt-8 pb-4 px-8 text-center">
            <div class="text-ex-gold text-xl mb-1">✦</div>
            <h2 class="font-great-vibes text-4xl" style="color:#3D2B1F;">Exaucée</h2>
          </div>

          <!-- ── CONFIRM EMAIL ── -->
          <div v-if="tab === 'confirm'" class="px-8 pb-8 text-center flex flex-col gap-4">
            <div class="text-4xl">📬</div>
            <p class="text-sm font-semibold" style="color:#3D2B1F;">Check your inbox!</p>
            <p class="text-xs leading-relaxed" style="color:#9B86A8;">
              We sent a confirmation link to <strong>{{ email }}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <button @click="switchTab('signin')" class="auth-btn">Go to Sign In</button>
          </div>

          <!-- ── TABS ── -->
          <template v-else>
            <div v-if="tab !== 'reset'" class="flex px-8 gap-1 mb-6">
              <button
                @click="switchTab('signin')"
                class="tab-pill"
                :class="{ 'tab-pill--active': tab === 'signin' }"
              >Sign In</button>
              <button
                @click="switchTab('signup')"
                class="tab-pill"
                :class="{ 'tab-pill--active': tab === 'signup' }"
              >Create Account</button>
            </div>

            <!-- SIGN IN -->
            <form v-if="tab === 'signin'" @submit.prevent="handleSignIn" class="px-8 pb-8 flex flex-col gap-3">
              <input v-model="email"    class="auth-input" type="email"    placeholder="Email address" autocomplete="email" />
              <div class="relative">
                <input
                  v-model="password"
                  class="auth-input pr-10"
                  :type="showPass ? 'text' : 'password'"
                  placeholder="Password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  @click="showPass = !showPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style="color:#C4828A;"
                >{{ showPass ? 'hide' : 'show' }}</button>
              </div>
              <p v-if="errorMsg" class="text-xs text-center" style="color:#f87171;">{{ errorMsg }}</p>
              <button type="submit" :disabled="auth.loading" class="auth-btn mt-1">
                {{ auth.loading ? 'Signing in…' : 'Sign In' }}
              </button>
              <button type="button" @click="switchTab('reset')" class="text-xs text-center mt-1 transition hover:opacity-70" style="color:#9B86A8;">
                Forgot password?
              </button>
            </form>

            <!-- SIGN UP -->
            <form v-else-if="tab === 'signup'" @submit.prevent="handleSignUp" class="px-8 pb-8 flex flex-col gap-3">
              <input v-model="name"            class="auth-input" type="text"     placeholder="Your name" autocomplete="name" />
              <input v-model="email"           class="auth-input" type="email"    placeholder="Email address" autocomplete="email" />
              <div class="relative">
                <input
                  v-model="password"
                  class="auth-input pr-10"
                  :type="showPass ? 'text' : 'password'"
                  placeholder="Password (min. 6 characters)"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  @click="showPass = !showPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style="color:#C4828A;"
                >{{ showPass ? 'hide' : 'show' }}</button>
              </div>
              <input v-model="confirmPassword" class="auth-input" :type="showPass ? 'text' : 'password'" placeholder="Confirm password" autocomplete="new-password" />
              <p v-if="errorMsg" class="text-xs text-center" style="color:#f87171;">{{ errorMsg }}</p>
              <button type="submit" :disabled="auth.loading" class="auth-btn mt-1">
                {{ auth.loading ? 'Creating account…' : 'Create Account' }}
              </button>
              <p class="text-[10px] text-center" style="color:#C4C4C4;">
                By signing up you agree to our terms &amp; privacy policy.
              </p>
            </form>

            <!-- RESET PASSWORD -->
            <form v-else-if="tab === 'reset'" @submit.prevent="handleReset" class="px-8 pb-8 flex flex-col gap-3">
              <p class="text-xs font-semibold mb-1" style="color:#3D2B1F;">Reset your password</p>
              <p class="text-xs leading-relaxed" style="color:#9B86A8;">Enter your email and we'll send you a link to reset your password.</p>
              <input v-model="email" class="auth-input mt-2" type="email" placeholder="Email address" autocomplete="email" />
              <p v-if="errorMsg"   class="text-xs text-center" style="color:#f87171;">{{ errorMsg }}</p>
              <p v-if="successMsg" class="text-xs text-center" style="color:#5A9E8A;">{{ successMsg }}</p>
              <button type="submit" :disabled="auth.loading" class="auth-btn mt-1">
                {{ auth.loading ? 'Sending…' : 'Send Reset Link' }}
              </button>
              <button type="button" @click="switchTab('signin')" class="text-xs text-center mt-1 transition hover:opacity-70" style="color:#9B86A8;">
                ← Back to sign in
              </button>
            </form>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.font-great-vibes { font-family: 'Great Vibes', cursive; }

.tab-pill {
  flex: 1; padding: 8px 12px;
  border-radius: 20px; border: 1px solid #f0ebe3;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #9B86A8; background: #fff; cursor: pointer;
  transition: all 0.15s;
}
.tab-pill--active {
  background: #3D2B1F; color: #fff; border-color: #3D2B1F;
}

.auth-input {
  width: 100%; border: 1px solid #f0ebe3; border-radius: 12px;
  padding: 12px 14px; font-size: 13px; color: #3D2B1F;
  outline: none; background: #fff; transition: border-color 0.2s;
  font-family: 'Manrope', sans-serif;
}
.auth-input:focus { border-color: #C4828A; }
.auth-input::placeholder { color: #C4C4C4; }

.auth-btn {
  width: 100%; background: #3D2B1F; color: #fff;
  border: none; padding: 13px; border-radius: 30px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; transition: background 0.2s;
  font-family: 'Manrope', sans-serif;
}
.auth-btn:hover:not(:disabled) { background: #C4828A; }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
