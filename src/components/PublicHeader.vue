<template>
  <header class="public-header">
    <div class="container header-inner">
      <BrandMark />
      <nav class="desktop-nav" aria-label="Primary navigation">
        <details class="products-menu">
          <summary>
            Products
            <ChevronDown :size="14" />
          </summary>
          <div class="products-popover">
            <NuxtLink
              v-for="product in products"
              :key="product.title"
              :to="product.to"
            >
              <span class="product-menu-icon">
                <component :is="product.icon" :size="17" />
              </span>
              <span>
                <strong>{{ product.title }}</strong>
                <small>{{ product.description }}</small>
              </span>
              <em :class="{ live: product.live }">
                {{ product.live ? 'Live' : 'Roadmap' }}
              </em>
            </NuxtLink>
          </div>
        </details>
        <NuxtLink to="/#vision">Vision</NuxtLink>
        <NuxtLink to="/methodology">How scoring works</NuxtLink>
        <a href="https://github.com/kromate/Career-Studio" target="_blank" rel="noreferrer">Open source</a>
      </nav>
      <div class="header-actions">
        <NuxtLink to="/login" class="btn btn-ghost desktop-login">
          Sign in
        </NuxtLink>
        <NuxtLink to="/login" class="btn btn-primary">
          Review my resume
          <ArrowUpRight :size="16" />
        </NuxtLink>
        <button class="mobile-menu-button" type="button" aria-label="Toggle navigation" @click="menuOpen = !menuOpen">
          <X v-if="menuOpen" :size="21" />
          <Menu v-else :size="21" />
        </button>
      </div>
    </div>
    <nav v-if="menuOpen" class="mobile-nav" aria-label="Mobile navigation">
      <span>Products</span>
      <NuxtLink to="/#products" @click="menuOpen = false">Resume tools</NuxtLink>
      <NuxtLink to="/#vision" @click="menuOpen = false">Career roadmap</NuxtLink>
      <NuxtLink to="/methodology" @click="menuOpen = false">How scoring works</NuxtLink>
      <a href="https://github.com/kromate/Career-Studio" target="_blank" rel="noreferrer" @click="menuOpen = false">Open source</a>
      <NuxtLink to="/login" @click="menuOpen = false">Sign in</NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  FileCheck2,
  FilePenLine,
  Menu,
  Send,
  Target,
  X,
} from 'lucide-vue-next'

const menuOpen = ref(false)

const products = [
  {
    title: 'Resume checker',
    description: 'A repeatable score with evidence',
    icon: FileCheck2,
    to: '/#products',
    live: true,
  },
  {
    title: 'Resume builder',
    description: 'Improve and version your resume',
    icon: FilePenLine,
    to: '/#products',
    live: true,
  },
  {
    title: 'Job match',
    description: 'Compare your evidence with a role',
    icon: Target,
    to: '/#products',
    live: true,
  },
  {
    title: 'Cover letter studio',
    description: 'Draft from verified career evidence',
    icon: BriefcaseBusiness,
    to: '/#products',
    live: false,
  },
  {
    title: 'Application assistant',
    description: 'Prepare and review before sending',
    icon: Send,
    to: '/#vision',
    live: false,
  },
]
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

.desktop-nav a:hover,
.products-menu summary:hover {
  color: var(--purple);
}

.products-menu {
  position: relative;
}

.products-menu summary {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  list-style: none;
}

.products-menu summary::-webkit-details-marker {
  display: none;
}

.products-menu[open] summary {
  color: var(--purple);
}

.products-popover {
  display: grid;
  width: 440px;
  position: absolute;
  top: 32px;
  left: -24px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(16, 24, 40, 0.14);
}

.products-popover a {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 11px;
  border-radius: 10px;
}

.products-popover a:hover {
  background: var(--surface-soft);
}

.product-menu-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 10px;
  color: var(--purple);
  background: var(--purple-soft);
}

.products-popover strong,
.products-popover small {
  display: block;
}

.products-popover strong {
  margin-bottom: 3px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 12px;
}

.products-popover small {
  color: var(--muted);
  font-size: 10px;
}

.products-popover em {
  padding: 4px 6px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--surface-soft);
}

.products-popover em.live {
  color: var(--green);
  background: var(--green-soft);
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

.mobile-nav > span {
  padding: 9px 13px 3px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
