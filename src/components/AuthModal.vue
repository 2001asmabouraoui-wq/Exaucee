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

const oauthError = ref('')
async function handleOAuth(provider: 'google' | 'facebook') {
  oauthError.value = ''
  try {
    await auth.signInWithOAuth(provider)
  } catch (e: any) {
    oauthError.value = e.message || `Could not sign in with ${provider}.`
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
              <!-- OAuth buttons -->
              <div class="flex flex-col gap-2 mb-1">
                <button type="button" @click="handleOAuth('google')" class="oauth-btn">
                  <svg class="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <button type="button" @click="handleOAuth('facebook')" class="oauth-btn">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                  Continue with Facebook
                </button>
              </div>
              <div class="flex items-center gap-3 my-1">
                <div class="flex-1 h-px" style="background:#f0ebe3;"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#C4C4C4;">or</span>
                <div class="flex-1 h-px" style="background:#f0ebe3;"></div>
              </div>
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
              <p v-if="errorMsg || oauthError" class="text-xs text-center" style="color:#f87171;">{{ errorMsg || oauthError }}</p>
              <button type="submit" :disabled="auth.loading" class="auth-btn mt-1">
                {{ auth.loading ? 'Signing in…' : 'Sign In' }}
              </button>
              <button type="button" @click="switchTab('reset')" class="text-xs text-center mt-1 transition hover:opacity-70" style="color:#9B86A8;">
                Forgot password?
              </button>
            </form>

            <!-- SIGN UP -->
            <form v-else-if="tab === 'signup'" @submit.prevent="handleSignUp" class="px-8 pb-8 flex flex-col gap-3">
              <!-- OAuth buttons -->
              <div class="flex flex-col gap-2 mb-1">
                <button type="button" @click="handleOAuth('google')" class="oauth-btn">
                  <svg class="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
                  Sign up with Google
                </button>
                <button type="button" @click="handleOAuth('facebook')" class="oauth-btn">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                  Sign up with Facebook
                </button>
              </div>
              <div class="flex items-center gap-3 my-1">
                <div class="flex-1 h-px" style="background:#f0ebe3;"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#C4C4C4;">or</span>
                <div class="flex-1 h-px" style="background:#f0ebe3;"></div>
              </div>
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
              <p v-if="errorMsg || oauthError" class="text-xs text-center" style="color:#f87171;">{{ errorMsg || oauthError }}</p>
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

.oauth-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid #f0ebe3; border-radius: 30px; padding: 11px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #3D2B1F; background: #fff; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  font-family: 'Manrope', sans-serif;
}
.oauth-btn:hover { border-color: #C4828A; background: #FFF9F4; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
