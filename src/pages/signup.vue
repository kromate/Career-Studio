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
      <div class="login-card signup-card">
        <div class="login-heading">
          <span class="auth-icon"><UserPlus :size="22" /></span>
          <h1>{{ otpStep ? 'Verify your email' : 'Create your Career Studio account' }}</h1>
          <p v-if="!otpStep">Create your workspace and take the next clear step in your career.</p>
          <p v-else>Enter the six-digit code sent to <strong>{{ email }}</strong>.</p>
        </div>

        <button
          v-if="!otpStep"
          class="google-button"
          type="button"
          :disabled="loading || !googleReady || !acceptedTerms"
          @click="handleGoogle"
        >
          <span class="google-logo">G</span>
          {{ loading ? 'Connecting…' : 'Sign up with Google' }}
        </button>
        <div v-if="!otpStep && !googleReady" class="auth-coming-soon">
          <ComingSoonBadge />
          <span>Google signup is not connected in this deployment. Email signup is available.</span>
        </div>

        <div v-if="!otpStep" class="or-divider"><span>or sign up with email</span></div>

        <form class="email-form" @submit.prevent="otpStep ? verifyOtp() : requestOtp()">
          <div v-if="!otpStep" class="signup-fields">
            <div class="field">
              <label for="full-name">Full name</label>
              <div class="input-with-icon">
                <UserRound :size="17" />
                <input
                  id="full-name"
                  v-model.trim="fullName"
                  class="input"
                  type="text"
                  autocomplete="name"
                  placeholder="Your full name"
                  required
                >
              </div>
            </div>

            <div class="field">
              <label for="signup-email">Email address</label>
              <div class="input-with-icon">
                <Mail :size="17" />
                <input
                  id="signup-email"
                  v-model.trim="email"
                  class="input"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  required
                >
              </div>
            </div>

            <div class="field">
              <div class="field-heading">
                <label for="referral-code">Referral code</label>
                <small>Optional</small>
              </div>
              <div class="input-with-icon">
                <Gift :size="17" />
                <input
                  id="referral-code"
                  v-model.trim="referralCode"
                  class="input"
                  type="text"
                  maxlength="7"
                  autocomplete="off"
                  placeholder="e.g. TTY7338"
                  @input="normalizeReferralCode"
                >
              </div>
              <p v-if="referralCode && !referralCodeValid" class="field-error">
                Use seven letters or numbers.
              </p>
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

          <label class="consent-field">
            <input v-model="acceptedTerms" type="checkbox" required>
            <span>
              I agree to Goalmatic's
              <a :href="`${goalmaticBaseUrl}/privacy`" target="_blank" rel="noreferrer">Privacy Policy</a>
              and
              <a :href="`${goalmaticBaseUrl}/terms`" target="_blank" rel="noreferrer">Terms of Service</a>.
            </span>
          </label>

          <button
            class="btn btn-primary btn-lg full-button"
            type="submit"
            :disabled="loading || !acceptedTerms || (!otpStep && (!fullName || !email || !referralCodeValid))"
          >
            {{ otpStep ? 'Verify and create account' : 'Email me a code' }}
            <ArrowRight :size="16" />
          </button>
        </form>

        <button v-if="otpStep" class="change-email" type="button" @click="resetOtp">
          Change account details
        </button>

        <p class="signup-link">
          Already have a Goalmatic account?
          <NuxtLink to="/login">Sign in</NuxtLink>
        </p>

        <p class="terms">
          Your Career Studio workspace uses the same secure identity as Goalmatic.
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
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Github,
  Info,
  Mail,
  Repeat2,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-vue-next'
import {
  hasFirebaseConfig,
  hasGoogleSignInConfig,
  sendGoalmaticSignupOtp,
  signInWithGoalmaticGoogle,
  verifyGoalmaticSignupOtp,
} from '@/lib/auth/firebase'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const workspace = useWorkspace()
const config = useRuntimeConfig().public
const toast = useToast()
const loading = ref(false)
const fullName = ref('')
const email = ref('')
const referralCode = ref('')
const acceptedTerms = ref(false)
const otpStep = ref(false)
const otp = ref(['', '', '', '', '', ''])
const otpRefs = ref<Array<HTMLInputElement | null>>([])
const resendSeconds = ref(0)
const useLocalOtp = computed(() => !hasFirebaseConfig(config))
const googleReady = computed(() => hasGoogleSignInConfig(config))
const referralCodeValid = computed(() => !referralCode.value || /^[A-Z0-9]{7}$/.test(referralCode.value))
const goalmaticBaseUrl = computed(() => config.goalmaticAppUrl.replace(/\/$/, ''))
let resendTimer: number | undefined

onMounted(() => {
  workspace.hydrate()
  if (workspace.state.value.user) {
    navigateTo('/app')
    return
  }
  const referral = typeof route.query.ref === 'string' ? route.query.ref.toUpperCase() : ''
  if (/^[A-Z0-9]{7}$/.test(referral)) referralCode.value = referral
})

const normalizeReferralCode = () => {
  referralCode.value = referralCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

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
  if (!googleReady.value || !acceptedTerms.value) return
  loading.value = true
  try {
    const user = await signInWithGoalmaticGoogle(config)
    workspace.login(user)
    await navigateTo('/app')
  } catch (error) {
    toast.show('Could not sign up with Google', {
      message: error instanceof Error ? error.message : 'Please try again.',
      tone: 'error',
    })
  } finally {
    loading.value = false
  }
}

const requestOtp = async () => {
  if (!fullName.value || !email.value || !acceptedTerms.value || !referralCodeValid.value) return
  loading.value = true
  try {
    if (!useLocalOtp.value) {
      const message = await sendGoalmaticSignupOtp(config, email.value)
      toast.show('Check your email', { message, tone: 'success' })
    }
    otpStep.value = true
    otp.value = ['', '', '', '', '', '']
    startResendCooldown()
    nextTick(() => otpRefs.value[0]?.focus())
  } catch (error) {
    toast.show('Could not create the account', {
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
      const user = await verifyGoalmaticSignupOtp(config, {
        email: email.value,
        otp: code,
        fullName: fullName.value,
        referralCode: referralCode.value || undefined,
      })
      workspace.login(user)
    } else {
      if (code !== '123456') throw new Error('Use the local preview code 123456.')
      workspace.login({
        id: `local-${email.value}`,
        accountId: `local-${email.value}`,
        name: fullName.value,
        email: email.value,
        authProvider: 'email',
      })
    }
    await navigateTo('/app')
  } catch (error) {
    toast.show('Could not verify the account', {
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
