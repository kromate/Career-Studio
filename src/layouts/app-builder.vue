<template>
  <div class="builder-layout" :class="{ 'sidebar-expanded': !sidebarCollapsed }">
    <AppSidebar
      :open="menuOpen"
      :collapsed="sidebarCollapsed"
      @close="menuOpen = false"
      @toggle-collapse="toggleSidebarCollapse"
    />
    <button class="builder-mobile-menu" type="button" aria-label="Open navigation" @click="menuOpen = true">
      <Menu :size="20" />
    </button>
    <main class="builder-layout-main">
      <slot />
    </main>
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

const menuOpen = ref(false)
const sidebarCollapsed = ref(true)

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.builder-layout {
  min-height: 100vh;
  background: #141a21;
}

.builder-layout-main {
  min-width: 0;
  margin-left: 88px;
  transition: margin-left 180ms ease;
}

.builder-layout.sidebar-expanded .builder-layout-main {
  margin-left: 268px;
}

.builder-mobile-menu {
  display: none;
  width: 39px;
  height: 39px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: var(--control-bg);
}

@media (max-width: 900px) {
  .builder-layout-main,
  .builder-layout.sidebar-expanded .builder-layout-main {
    margin-left: 0;
  }

  .builder-mobile-menu {
    display: grid;
    position: fixed;
    z-index: 30;
    top: 14px;
    left: 14px;
  }
}
</style>