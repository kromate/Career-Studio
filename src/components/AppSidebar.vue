<template>
  <aside class="app-sidebar" :class="{ open, collapsed }">
    <div class="sidebar-top">
      <BrandMark to="/app" :compact="collapsed" />
      <button
        class="sidebar-collapse-toggle"
        type="button"
        :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
        :aria-expanded="!collapsed"
        @click="$emit('toggle-collapse')"
      >
        <ChevronRight v-if="collapsed" :size="15" />
        <ChevronLeft v-else :size="15" />
      </button>
      <button class="sidebar-close" type="button" aria-label="Close navigation" @click="$emit('close')">
        <X :size="19" />
      </button>
    </div>

    <span class="nav-section-label">Workspace</span>
    <nav class="app-nav" aria-label="Application navigation">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :title="collapsed ? item.label : undefined" @click="$emit('close')">
        <component :is="item.icon" :size="18" :stroke-width="2" />
        <span>{{ collapsed ? item.miniLabel : item.label }}</span>
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
      <a
        href="https://github.com/kromate/Career-Studio"
        class="settings-link"
        target="_blank"
        rel="noreferrer"
        :title="collapsed ? 'Contribute on GitHub' : undefined"
        @click="$emit('close')"
      >
        <Github :size="18" />
        <span>{{ collapsed ? 'GitHub' : 'Contribute on GitHub' }}</span>
        <ArrowUpRight class="link-tail" :size="14" />
      </a>
      <NuxtLink to="/app/settings" class="settings-link" :title="collapsed ? 'Settings' : undefined" @click="$emit('close')">
        <Settings :size="18" />
        <span>Settings</span>
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
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  Target,
  X,
} from 'lucide-vue-next'

defineProps<{ open: boolean; collapsed: boolean }>()
defineEmits<{ close: []; 'toggle-collapse': [] }>()

const workspace = useWorkspace()
const navigation = computed(() => [
  { label: 'Overview', miniLabel: 'Overview', to: '/app', icon: LayoutDashboard },
  { label: 'Resumes', miniLabel: 'Resumes', to: '/app/resumes', icon: Files, badge: workspace.state.value.resumes.length || undefined },
  { label: 'Compare with a job', miniLabel: 'Compare', to: '/app/target', icon: Target },
  { label: 'Saved jobs', miniLabel: 'Jobs', to: '/app/jobs', icon: FileSearch, badge: workspace.state.value.jobs.length || undefined },
  { label: 'Applications', miniLabel: 'Applications', to: '/app/applications', icon: BriefcaseBusiness, badge: workspace.state.value.applications.length || undefined },
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
  background: var(--card-bg);
  transition: width 180ms ease;
}

.app-sidebar.collapsed {
  width: 88px;
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

.sidebar-collapse-toggle {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  position: absolute;
  top: 22px;
  right: -14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--card-bg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.sidebar-collapse-toggle:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.nav-section-label {
  padding: 20px 22px 7px;
  color: var(--muted-subtle);
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

.app-nav a span:first-of-type,
.settings-link span {
  min-width: 0;
}

.app-nav a:hover,
.settings-link:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.app-nav a.router-link-exact-active {
  border-color: var(--purple-border-soft);
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
  background: var(--badge-bg);
}

.app-nav a.router-link-exact-active .nav-badge {
  color: var(--purple);
  background: var(--badge-active-bg);
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
  background: var(--surface-subtle);
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

.app-sidebar.collapsed .sidebar-top {
  justify-content: center;
  padding: 0 12px;
}

.app-sidebar.collapsed .nav-section-label {
  overflow: hidden;
  height: 1px;
  padding: 0;
  position: absolute;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.app-sidebar.collapsed .app-nav {
  gap: 7px;
  padding: 14px 8px 16px;
}

.app-sidebar.collapsed .app-nav a,
.app-sidebar.collapsed .settings-link {
  min-height: 56px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 7px 4px;
  font-size: 10px;
  line-height: 1.15;
  text-align: center;
}

.app-sidebar.collapsed .app-nav a span:first-of-type,
.app-sidebar.collapsed .settings-link span {
  overflow: hidden;
  max-width: 68px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-sidebar.collapsed .nav-badge {
  width: 7px;
  min-width: 7px;
  height: 7px;
  margin: -1px 0 0;
  padding: 0;
  color: transparent;
  font-size: 0;
}

.app-sidebar.collapsed .sidebar-bottom {
  gap: 7px;
  padding: 10px 8px 14px;
}

.app-sidebar.collapsed .open-source-note,
.app-sidebar.collapsed .link-tail {
  display: none;
}

@media (max-width: 900px) {
  .app-sidebar {
    width: 268px;
    transform: translateX(-105%);
    transition: transform 220ms ease;
  }

  .app-sidebar.collapsed {
    width: 268px;
  }

  .app-sidebar.collapsed .sidebar-top {
    justify-content: space-between;
    padding: 0 20px;
  }

  .sidebar-collapse-toggle {
    display: none;
  }

  .app-sidebar.collapsed .nav-section-label {
    height: auto;
    padding: 20px 22px 7px;
    position: static;
    clip: auto;
    white-space: normal;
  }

  .app-sidebar.collapsed .app-nav {
    gap: 4px;
    padding: 0 12px 16px;
  }

  .app-sidebar.collapsed .app-nav a,
  .app-sidebar.collapsed .settings-link {
    min-height: 38px;
    flex-direction: row;
    justify-content: flex-start;
    gap: 11px;
    padding: 8px 10px;
    font-size: 13px;
    line-height: normal;
    text-align: left;
  }

  .app-sidebar.collapsed .app-nav a span:first-of-type,
  .app-sidebar.collapsed .settings-link span {
    max-width: none;
  }

  .app-sidebar.collapsed .nav-badge {
    display: grid;
    width: auto;
    min-width: 21px;
    height: 21px;
    margin-left: auto;
    padding: 0 6px;
    color: var(--muted);
    font-size: 10px;
  }

  .app-sidebar.collapsed .open-source-note,
  .app-sidebar.collapsed .link-tail {
    display: grid;
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
