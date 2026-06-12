<template>
  <aside class="app-sidebar" :class="{ open }">
    <div class="sidebar-top">
      <BrandMark to="/app" />
      <button class="sidebar-close" type="button" aria-label="Close navigation" @click="$emit('close')">
        <X :size="19" />
      </button>
    </div>

    <span class="nav-section-label">Workspace</span>
    <nav class="app-nav" aria-label="Application navigation">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" @click="$emit('close')">
        <component :is="item.icon" :size="18" :stroke-width="2" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-bottom">
      <div class="open-source-note">
        <span class="goalmatic-mark"><Sparkles :size="16" /></span>
        <div>
          <strong>Powered by Goalmatic</strong>
          <span>Identity, data, and automation</span>
        </div>
      </div>
      <NuxtLink to="/open-source" class="settings-link" @click="$emit('close')">
        <Github :size="18" />
        Open source
        <ArrowUpRight class="link-tail" :size="14" />
      </NuxtLink>
      <NuxtLink to="/app/settings" class="settings-link" @click="$emit('close')">
        <Settings :size="18" />
        Settings
      </NuxtLink>
    </div>
  </aside>
  <button v-if="open" class="sidebar-scrim" type="button" aria-label="Close navigation" @click="$emit('close')" />
</template>

<script setup lang="ts">
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileSearch,
  Files,
  Github,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  X,
} from 'lucide-vue-next'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const workspace = useWorkspace()
const navigation = computed(() => [
  { label: 'Overview', to: '/app', icon: LayoutDashboard },
  { label: 'Resumes', to: '/app/resumes', icon: Files, badge: workspace.state.value.resumes.length || undefined },
  { label: 'Target a job', to: '/app/target', icon: Target },
  { label: 'Saved jobs', to: '/app/jobs', icon: FileSearch, badge: workspace.state.value.jobs.length || undefined },
  { label: 'Applications', to: '/app/applications', icon: BriefcaseBusiness, badge: workspace.state.value.applications.length || undefined },
])
</script>

<style scoped>
.app-sidebar {
  display: flex;
  width: 268px;
  height: 100vh;
  flex-direction: column;
  position: fixed;
  z-index: 40;
  inset: 0 auto 0 0;
  border-right: 1px solid var(--line);
  background: #fff;
}

.sidebar-top {
  display: flex;
  height: 64px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
}

.sidebar-close {
  display: none;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 10px;
  color: var(--muted);
  background: var(--surface-soft);
}

.nav-section-label {
  padding: 20px 22px 7px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-nav {
  display: grid;
  gap: 4px;
  padding: 0 12px 16px;
}

.app-nav a,
.settings-link {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 11px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  transition: color 160ms ease, background 160ms ease;
}

.app-nav a:hover,
.settings-link:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.app-nav a.router-link-exact-active {
  border-color: #ded3fa;
  color: var(--purple);
  background: var(--purple-soft);
}

.nav-badge {
  display: grid;
  min-width: 21px;
  height: 21px;
  place-items: center;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 10px;
  background: #eef0f3;
}

.app-nav a.router-link-exact-active .nav-badge {
  color: var(--purple);
  background: #e9e1fc;
}

.sidebar-bottom {
  display: grid;
  gap: 4px;
  margin-top: auto;
  padding: 14px 12px 18px;
}

.open-source-note {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
}

.goalmatic-mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  color: var(--purple);
  background: var(--purple-soft);
}

.open-source-note strong,
.open-source-note div span {
  display: block;
}

.open-source-note strong {
  margin-bottom: 2px;
  font-size: 11px;
}

.open-source-note div span {
  color: var(--muted);
  font-size: 11px;
}

.link-tail {
  margin-left: auto;
}

.sidebar-scrim {
  display: none;
}

@media (max-width: 900px) {
  .app-sidebar {
    transform: translateX(-105%);
    transition: transform 220ms ease;
  }

  .app-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: grid;
  }

  .sidebar-scrim {
    display: block;
    position: fixed;
    z-index: 35;
    inset: 0;
    border: 0;
    background: rgba(23, 20, 38, 0.34);
    backdrop-filter: blur(2px);
  }
}
</style>
