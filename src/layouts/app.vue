<template>
  <div class="workspace-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <AppSidebar
      :open="menuOpen"
      :collapsed="sidebarCollapsed"
      @close="menuOpen = false"
      @toggle-collapse="toggleSidebarCollapse"
    />
    <div class="workspace-main">
      <AppTopbar @menu="menuOpen = true" />
      <slot />
    </div>
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
const menuOpen = ref(false)
const sidebarCollapsed = ref(false)

onMounted(() => {
  sidebarCollapsed.value = localStorage.getItem('career-studio:sidebar-collapsed') === 'true'
})

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('career-studio:sidebar-collapsed', String(sidebarCollapsed.value))
}
</script>

<style scoped>
.workspace-layout {
  min-height: 100vh;
  background: var(--surface);
}

.workspace-main {
  min-width: 0;
  margin-left: 268px;
  transition: margin-left 180ms ease;
}

.sidebar-collapsed .workspace-main {
  margin-left: 88px;
}

@media (max-width: 900px) {
  .workspace-main {
    margin-left: 0;
  }

  .sidebar-collapsed .workspace-main {
    margin-left: 0;
  }
}
</style>
