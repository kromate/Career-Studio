<template>
  <header class="app-topbar">
    <button class="mobile-nav-trigger" type="button" aria-label="Open navigation" @click="$emit('menu')">
      <Menu :size="20" />
    </button>
    <div class="topbar-title">
      <span>{{ label }}</span>
    </div>
    <div class="topbar-actions">
      <NuxtLink to="/methodology" class="method-link">
        <ShieldCheck :size="16" />
        Resume scoring
      </NuxtLink>
      <button class="profile-button" type="button" @click="profileOpen = !profileOpen">
        <span class="avatar">
          <img v-if="workspace.state.value.user?.avatarUrl" :src="workspace.state.value.user.avatarUrl" alt="">
          <template v-else>{{ initials }}</template>
        </span>
        <span class="profile-copy">
          <strong>{{ workspace.state.value.user?.name }}</strong>
          <small>{{ workspace.state.value.user?.email }}</small>
        </span>
        <ChevronDown :size="15" />
      </button>
      <div v-if="profileOpen" class="profile-menu">
        <NuxtLink to="/app/settings" @click="profileOpen = false">
          <Settings :size="16" />
          Settings
        </NuxtLink>
        <button type="button" @click="handleLogout">
          <LogOut :size="16" />
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ChevronDown, LogOut, Menu, Settings, ShieldCheck } from 'lucide-vue-next'
import { signOutFirebase } from '@/lib/auth/firebase'

defineEmits<{ menu: [] }>()

const route = useRoute()
const workspace = useWorkspace()
const profileOpen = ref(false)

const routeLabels: Record<string, string> = {
  '/app': 'Overview',
  '/app/resumes': 'Resumes',
  '/app/target': 'Compare with a job',
  '/app/jobs': 'Saved jobs',
  '/app/applications': 'Applications',
  '/app/settings': 'Settings',
}

const label = computed(() => {
  if (route.path.startsWith('/app/resumes/')) return 'Resume workspace'
  if (route.path.startsWith('/app/jobs/')) return 'Job details'
  return routeLabels[route.path] || 'Career Studio'
})

const initials = computed(() => (
  workspace.state.value.user?.name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    || 'G'
))

const handleLogout = async () => {
  profileOpen.value = false
  try {
    await signOutFirebase()
  } catch {
    // Local and expired Firebase sessions can still be cleared safely.
  }
  workspace.logout()
  await navigateTo('/login')
}
</script>

<style scoped>
.app-topbar {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  z-index: 25;
  top: 0;
  padding: 0 28px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
}

.mobile-nav-trigger {
  display: none;
  width: 39px;
  height: 39px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
}

.topbar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.topbar-title small {
  padding: 4px 7px;
  border-radius: 6px;
  color: var(--amber);
  font-family: var(--font-body);
  font-size: 11px;
  background: var(--amber-soft);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.method-link {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.method-link:hover {
  color: var(--purple);
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 7px 4px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.profile-button:hover {
  background: var(--surface-soft);
}

.avatar {
  display: grid;
  width: 34px;
  height: 34px;
  overflow: hidden;
  place-items: center;
  border-radius: 8px;
  color: var(--purple-dark);
  font-size: 11px;
  font-weight: 800;
  background: var(--purple-soft);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-copy {
  display: grid;
  min-width: 130px;
  text-align: left;
}

.profile-copy strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-copy small {
  overflow: hidden;
  max-width: 160px;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu {
  display: grid;
  width: 190px;
  gap: 3px;
  position: absolute;
  z-index: 20;
  top: 50px;
  right: 0;
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--shadow-md);
}

.profile-menu a,
.profile-menu button {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
}

.profile-menu a:hover,
.profile-menu button:hover {
  background: var(--surface-soft);
}

@media (max-width: 900px) {
  .app-topbar {
    padding: 0 15px;
  }

  .mobile-nav-trigger {
    display: grid;
  }

  .topbar-title {
    margin-right: auto;
    margin-left: 12px;
  }
}

@media (max-width: 620px) {
  .method-link,
  .profile-copy,
  .profile-button > svg {
    display: none;
  }

  .topbar-title small {
    display: none;
  }
}
</style>
