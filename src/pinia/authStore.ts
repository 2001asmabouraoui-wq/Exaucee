import { defineStore } from 'pinia'
import { ref, computed }  from 'vue'
import { supabase }       from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)

  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',').map((e: string) => e.trim()).filter(Boolean)

  const isAdminServer = ref(false)

  const isLoggedIn  = computed(() => !!user.value)
  const isAdmin     = computed(() =>
    (!!user.value?.email && ADMIN_EMAILS.includes(user.value.email)) || isAdminServer.value
  )
  const displayName = computed(() =>
    user.value?.user_metadata?.name
    || user.value?.email?.split('@')[0]
    || ''
  )
  const avatarUrl   = computed<string>(() => user.value?.user_metadata?.avatar_url || '')
  const accessToken = computed(() => session.value?.access_token ?? '')

  function authHeaders(extra: Record<string, string> = {}) {
    const base: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
    if (accessToken.value) base['Authorization'] = `Bearer ${accessToken.value}`
    return base
  }

  async function checkAdminStatus() {
    if (!accessToken.value) { isAdminServer.value = false; return }
    try {
      const res = await fetch(`${API_URL}/api/admins/check`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })
      if (res.ok) {
        const { isAdmin: serverAdmin } = await res.json()
        isAdminServer.value = !!serverAdmin
      }
    } catch { /* network error — non-critical */ }
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value    = data.session?.user ?? null
    if (user.value) await checkAdminStatus()

    supabase.auth.onAuthStateChange(async (_event, s) => {
      session.value = s
      user.value    = s?.user ?? null
      if (s?.user) await checkAdminStatus()
      else isAdminServer.value = false
    })
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { success: false, error: error.message }
      user.value    = data.user
      session.value = data.session
      await checkAdminStatus()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || 'Sign in failed' }
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, name?: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) return { success: false, error: error.message }
      return { success: true, confirmEmail: !data.session }
    } catch (e: any) {
      return { success: false, error: e.message || 'Sign up failed' }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value         = null
    session.value      = null
    isAdminServer.value = false
  }

  async function updateProfile(updates: { name?: string; avatar_url?: string }) {
    const { data: updated, error } = await supabase.auth.updateUser({
      data: { ...user.value?.user_metadata, ...updates },
    })
    if (error) return { success: false, error: error.message }
    user.value = updated.user
    return { success: true }
  }

  async function uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!user.value) return { success: false, error: 'Not logged in' }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const res = await fetch(`${API_URL}/api/upload/avatar`, {
      method:  'POST',
      headers: authHeaders(),
      body: JSON.stringify({ base64, contentType: file.type, ext: file.name.split('.').pop() ?? 'jpg' }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { success: false, error: data.error ?? 'Upload failed' }
    return { success: true, url: data.url }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) throw new Error(error.message)
  }

  return {
    user, session, loading,
    isLoggedIn, isAdmin, displayName, avatarUrl, accessToken,
    authHeaders,
    initialize, signIn, signUp, signOut, resetPassword,
    updateProfile, uploadAvatar,
  }
})
