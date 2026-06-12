<template>
  <div class="auth-layout">
    <slot />
    <ToastStack />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: var(--surface-soft);
}
</style>
