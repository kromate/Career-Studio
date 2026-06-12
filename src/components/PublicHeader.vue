<template>
  <header class="public-header">
    <div class="container header-inner">
      <BrandMark />
      <nav class="desktop-nav" aria-label="Primary navigation">
        <NuxtLink to="/#how-it-works">How it works</NuxtLink>
        <NuxtLink to="/methodology">Methodology</NuxtLink>
        <NuxtLink to="/open-source">Open source</NuxtLink>
      </nav>
      <div class="header-actions">
        <NuxtLink to="/login" class="btn btn-ghost desktop-login">
          Sign in
        </NuxtLink>
        <NuxtLink to="/login" class="btn btn-primary">
          Check my resume
          <ArrowUpRight :size="16" />
        </NuxtLink>
        <button class="mobile-menu-button" type="button" aria-label="Toggle navigation" @click="menuOpen = !menuOpen">
          <X v-if="menuOpen" :size="21" />
          <Menu v-else :size="21" />
        </button>
      </div>
    </div>
    <nav v-if="menuOpen" class="mobile-nav" aria-label="Mobile navigation">
      <NuxtLink to="/#how-it-works" @click="menuOpen = false">How it works</NuxtLink>
      <NuxtLink to="/methodology" @click="menuOpen = false">Methodology</NuxtLink>
      <NuxtLink to="/open-source" @click="menuOpen = false">Open source</NuxtLink>
      <NuxtLink to="/login" @click="menuOpen = false">Sign in</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ArrowUpRight, Menu, X } from 'lucide-vue-next'

const menuOpen = ref(false)
</script>

<style scoped>
.public-header {
  position: sticky;
  z-index: 30;
  top: 0;
  border-bottom: 1px solid rgba(232, 229, 239, 0.78);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
}

.header-inner {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 26px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 500;
}

.desktop-nav a:hover {
  color: var(--purple);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.mobile-menu-button {
  display: none;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 0;
  border-radius: 11px;
  background: var(--surface-soft);
}

.mobile-nav {
  display: grid;
  gap: 2px;
  padding: 10px 20px 18px;
  border-top: 1px solid var(--line);
  background: #fff;
}

.mobile-nav a {
  padding: 13px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 650;
}

.mobile-nav a:hover {
  color: var(--purple);
  background: var(--purple-soft);
}

@media (max-width: 800px) {
  .desktop-nav,
  .desktop-login {
    display: none;
  }

  .mobile-menu-button {
    display: grid;
  }

  .header-actions .btn-primary {
    display: none;
  }
}
</style>
