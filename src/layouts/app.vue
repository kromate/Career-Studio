<template>
  <div class="workspace-layout">
    <AppSidebar :open="menuOpen" @close="menuOpen = false" />
    <div class="workspace-main">
      <AppTopbar @menu="menuOpen = true" />
      <slot />
    </div>
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
const menuOpen = ref(false)
</script>

<style scoped>
.workspace-layout {
  min-height: 100vh;
  background: var(--surface);
}

.workspace-main {
  min-width: 0;
  margin-left: 268px;
}

@media (max-width: 900px) {
  .workspace-main {
    margin-left: 0;
  }
}
</style>
