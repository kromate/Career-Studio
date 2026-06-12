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
          <p v-if="!otpStep">Continue with the same identity you use across Goalmatic.</p>
          <p v-else>Enter the six-digit code sent to <strong>{{ email }}</strong>.</p>
        </div>

        <button v-if="!otpStep" class="google-button" type="button" :disabled="loading || !googleReady" @click="handleGoogle">
          <span class="google-logo">G</span>
          {{ loading ? 'Connecting…' : 'Continue with Google' }}
        </button>
        <div v-if="!otpStep && !googleReady" class="auth-coming-soon">
          <ComingSoonBadge />
          <span>Shared Goalmatic Google sign-in is not connected in this deployment. Email and demo access work now.</span>
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
            {{ otpStep ? 'Verify and continue' : 'Email me a code' }}
            <ArrowRight :size="16" />
          </button>
        </form>

        <button v-if="otpStep" class="change-email" type="button" @click="resetOtp">
          Use a different email
        </button>

        <p v-if="!otpStep" class="signup-link">
          New to Goalmatic?
          <a :href="goalmaticSignupUrl">Create an account</a>
        </p>

        <div v-if="!otpStep && localPreview" class="demo-area">
          <span>Exploring locally?</span>
          <button type="button" @click="enterDemo">
            Open the complete demo workspace
            <ArrowRight :size="15" />
          </button>
        </div>

        <p class="terms">
          By continuing, you agree to use the product responsibly and accept our
          <NuxtLink to="/privacy">privacy approach</NuxtLink>.
        </p>
      </div>
      <div class="login-benefits">
        <span><Repeat2 :size="14" /> Deterministic scores</span>
        <span><ShieldCheck :size="14" /> Private workspace</span>
        <span><Github :size="14" /> Open source</span>
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
const localPreview = computed(() => config.appMode === 'local')
const useLocalOtp = computed(() => !hasFirebaseConfig(config))
const googleReady = computed(() => hasGoogleSignInConfig(config))
const goalmaticSignupUrl = computed(() => `${config.goalmaticAppUrl.replace(/\/$/, '')}/auth/signup`)
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

const enterDemo = async () => {
  workspace.loginDemo()
  await navigateTo('/app')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 18%, rgba(96, 29, 237, 0.08), transparent 27%),
    #f9fafb;
}

.login-header {
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
}

.login-header .container {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
}

.back-home {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.back-home:hover {
  color: var(--purple);
}

.login-form-area {
  display: grid;
  min-height: calc(100vh - 64px);
  align-content: center;
  justify-items: center;
  padding: 48px 20px;
}

.login-card {
  width: min(100%, 410px);
  padding: 30px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
}

.login-heading {
  margin-bottom: 26px;
  text-align: center;
}

.auth-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  margin: 0 auto 18px;
  border-radius: 12px;
  color: var(--purple);
  background: var(--purple-soft);
}

.login-heading h1 {
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 700;
}

.login-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.google-button {
  display: flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.google-button:hover {
  background: var(--surface-soft);
}

.google-button:disabled {
  color: var(--muted);
  cursor: not-allowed;
  box-shadow: none;
  background: var(--surface-soft);
}

.auth-coming-soon {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 8px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}

.google-logo {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: #4285f4;
  font-weight: 800;
}

.or-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  color: var(--muted);
  font-size: 10px;
}

.or-divider::before,
.or-divider::after {
  height: 1px;
  flex: 1;
  content: '';
  background: var(--line);
}

.email-form {
  display: grid;
  gap: 18px;
}

.input-with-icon {
  position: relative;
}

.input-with-icon svg {
  position: absolute;
  z-index: 1;
  top: 11px;
  left: 12px;
  color: var(--muted);
}

.input-with-icon .input {
  padding-left: 40px;
}

.full-button {
  width: 100%;
}

.terms {
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.55;
  text-align: center;
}

.terms a {
  color: var(--purple);
}

.demo-area {
  display: grid;
  gap: 7px;
  margin-top: 23px;
  padding: 15px;
  border: 1px solid #ded6ff;
  border-radius: 10px;
  background: var(--purple-soft);
}

.demo-area > span {
  color: var(--purple-dark);
  font-size: 10px;
  font-weight: 700;
}

.demo-area button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  border: 0;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.otp-inputs {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.otp-inputs input {
  width: 100%;
  height: 50px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  font-size: 22px;
  font-weight: 800;
  text-align: center;
}

.otp-inputs input:focus {
  border-color: var(--purple);
  outline: 0;
  box-shadow: 0 0 0 3px rgba(91, 50, 223, 0.1);
}

.otp-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 10px;
}

.otp-actions button {
  padding: 0;
  border: 0;
  color: var(--purple);
  font: inherit;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.otp-actions button:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.preview-code {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--amber);
  font-size: 11px;
  background: var(--amber-soft);
}

.change-email {
  display: block;
  margin: 17px auto 0;
  border: 0;
  color: var(--purple);
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.signup-link {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}

.signup-link a {
  color: var(--purple);
  font-weight: 700;
}

.login-benefits {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 22px;
  color: var(--muted);
  font-size: 10px;
}

.login-benefits span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 520px) {
  .login-form-area {
    align-content: start;
    padding: 30px 14px;
  }

  .login-card {
    padding: 24px 20px;
  }
}
</style>
