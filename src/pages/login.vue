<template>
  <div class="login-page">
    <header class="login-header">
      <div class="container">
        <BrandMark to="/" />
        <NuxtLink to="/" class="back-home">
          <ArrowLeft :size="16" />
          Back to home
        </NuxtLink>
      </div>
    </header>

    <section class="login-form-area">
      <div class="login-card">
        <div class="login-heading">
          <span class="auth-icon"><KeyRound :size="22" /></span>
          <h1>{{ otpStep ? 'Check your email' : 'Sign in to Career Studio' }}</h1>
          <p v-if="!otpStep">Continue where you left off in your career workspace.</p>
          <p v-else>Enter the six-digit code sent to <strong>{{ email }}</strong>.</p>
        </div>

        <button v-if="!otpStep" class="google-button" type="button" :disabled="loading || !googleReady" @click="handleGoogle">
          <AppSpinner v-if="loading" :size="18" />
          <span v-else class="google-logo">G</span>
          {{ loading ? 'Connecting…' : 'Continue with Google' }}
        </button>
        <div v-if="!otpStep && !googleReady" class="auth-coming-soon">
          <ComingSoonBadge />
          <span>Shared Goalmatic Google sign-in is not connected in this deployment. Use email sign-in instead.</span>
        </div>

        <div v-if="!otpStep" class="or-divider"><span>or continue with email</span></div>

        <form class="email-form" @submit.prevent="otpStep ? verifyOtp() : requestOtp()">
          <div v-if="!otpStep" class="field">
            <label for="email">Email address</label>
            <div class="input-with-icon">
              <Mail :size="17" />
              <input id="email" v-model.trim="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" required>
            </div>
          </div>
          <template v-else>
            <div class="otp-inputs">
              <input
                v-for="(_, index) in otp"
                :key="index"
                :ref="element => setOtpRef(element, index)"
                v-model="otp[index]"
                inputmode="numeric"
                maxlength="1"
                :autocomplete="index === 0 ? 'one-time-code' : 'off'"
                :aria-label="`Digit ${index + 1}`"
                @input="handleOtpInput(index)"
                @keydown.backspace="handleOtpBackspace(index)"
                @paste.prevent="handleOtpPaste"
              >
            </div>
            <div class="otp-actions">
              <span>Code expires in 10 minutes.</span>
              <button type="button" :disabled="loading || resendSeconds > 0" @click="resendOtp">
                {{ resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code' }}
              </button>
            </div>
            <div v-if="useLocalOtp" class="preview-code">
              <Info :size="15" />
              Local preview code: <strong>123456</strong>
            </div>
          </template>
          <button class="btn btn-primary btn-lg full-button" type="submit" :disabled="loading">
            <AppSpinner v-if="loading" :size="16" light />
            {{ otpStep ? 'Verify and continue' : 'Email me a code' }}
            <ArrowRight v-if="!loading" :size="16" />
          </button>
        </form>

        <button v-if="otpStep" class="change-email" type="button" @click="resetOtp">
          Use a different email
        </button>

        <p v-if="!otpStep" class="signup-link">
          New to Goalmatic?
          <NuxtLink to="/signup">Create an account</NuxtLink>
        </p>

        <p class="terms">
          By continuing, you agree to use the product responsibly and accept our
          <NuxtLink to="/privacy">privacy approach</NuxtLink>.
        </p>
      </div>
      <div class="login-benefits">
        <span><Repeat2 :size="14" /> Repeatable scoring</span>
        <span><ShieldCheck :size="14" /> You stay in control</span>
        <span><Github :size="14" /> Built in public</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { ArrowLeft, ArrowRight, Github, Info, KeyRound, Mail, Repeat2, ShieldCheck } from 'lucide-vue-next'
import {
  hasFirebaseConfig,
  hasGoogleSignInConfig,
  sendGoalmaticEmailOtp,
  signInWithGoalmaticGoogle,
  verifyGoalmaticEmailOtp,
} from '@/lib/auth/firebase'

definePageMeta({ layout: 'auth' })

const workspace = useWorkspace()
const config = useRuntimeConfig().public
const toast = useToast()
const loading = ref(false)
const email = ref('')
const otpStep = ref(false)
const otp = ref(['', '', '', '', '', ''])
const otpRefs = ref<Array<HTMLInputElement | null>>([])
const resendSeconds = ref(0)
const useLocalOtp = computed(() => !hasFirebaseConfig(config))
const googleReady = computed(() => hasGoogleSignInConfig(config))
let resendTimer: number | undefined

onMounted(() => {
  workspace.hydrate()
  if (workspace.state.value.user) navigateTo('/app')
})

const setOtpRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  otpRefs.value[index] = element instanceof HTMLInputElement ? element : null
}

const handleOtpInput = (index: number) => {
  otp.value[index] = otp.value[index]?.replace(/\D/g, '').slice(-1) || ''
  if (otp.value[index] && index < otp.value.length - 1) otpRefs.value[index + 1]?.focus()
}

const handleOtpBackspace = (index: number) => {
  if (!otp.value[index] && index > 0) otpRefs.value[index - 1]?.focus()
}

const handleOtpPaste = (event: ClipboardEvent) => {
  const digits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || ''
  if (!digits) return
  otp.value = Array.from({ length: 6 }, (_, index) => digits[index] || '')
  otpRefs.value[Math.min(digits.length, 6) - 1]?.focus()
}

const startResendCooldown = () => {
  if (resendTimer) window.clearInterval(resendTimer)
  resendSeconds.value = 60
  resendTimer = window.setInterval(() => {
    resendSeconds.value -= 1
    if (resendSeconds.value <= 0 && resendTimer) {
      window.clearInterval(resendTimer)
      resendTimer = undefined
    }
  }, 1000)
}

const handleGoogle = async () => {
  if (!googleReady.value) return
  loading.value = true
  try {
    const user = await signInWithGoalmaticGoogle(config)
    workspace.login(user)
    await navigateTo('/app')
  } catch (error) {
    toast.show('Could not sign in with Google', {
      message: error instanceof Error ? error.message : 'Please try again.',
      tone: 'error',
    })
  } finally {
    loading.value = false
  }
}

const requestOtp = async () => {
  if (!email.value) return
  loading.value = true
  try {
    if (!useLocalOtp.value) {
      const message = await sendGoalmaticEmailOtp(config, email.value)
      toast.show('Check your email', { message, tone: 'success' })
    }
    otpStep.value = true
    otp.value = ['', '', '', '', '', '']
    startResendCooldown()
    nextTick(() => otpRefs.value[0]?.focus())
  } catch (error) {
    toast.show('Could not send the code', {
      message: error instanceof Error ? error.message : 'Please try again.',
      tone: 'error',
    })
  } finally {
    loading.value = false
  }
}

const resendOtp = async () => {
  if (loading.value || resendSeconds.value > 0) return
  await requestOtp()
}

const verifyOtp = async () => {
  const code = otp.value.join('')
  if (code.length !== 6) {
    toast.show('Enter all six digits', { tone: 'warning' })
    return
  }
  loading.value = true
  try {
    if (!useLocalOtp.value) {
      const user = await verifyGoalmaticEmailOtp(config, email.value, code)
      workspace.login(user)
    } else {
      if (code !== '123456') throw new Error('Use the local preview code 123456.')
      workspace.login({
        id: `local-${email.value}`,
        accountId: `local-${email.value}`,
        name: email.value.split('@')[0]?.replace(/[._-]/g, ' ') || 'Local user',
        email: email.value,
        authProvider: 'email',
      })
    }
    await navigateTo('/app')
  } catch (error) {
    toast.show('Could not verify the code', {
      message: error instanceof Error ? error.message : 'Please try again.',
      tone: 'error',
    })
  } finally {
    loading.value = false
  }
}

const resetOtp = () => {
  otpStep.value = false
  otp.value = ['', '', '', '', '', '']
  resendSeconds.value = 0
  if (resendTimer) {
    window.clearInterval(resendTimer)
    resendTimer = undefined
  }
}

onBeforeUnmount(() => {
  if (resendTimer) window.clearInterval(resendTimer)
})

</script>
