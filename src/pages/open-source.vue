<template>
  <div class="redirect-page">
    <p>Opening the Career Studio GitHub repository…</p>
    <a :href="githubUrl">Open GitHub repository</a>
  </div>
</template>

<script setup lang="ts">
const githubUrl = 'https://github.com/kromate/Career-Studio'

await navigateTo(githubUrl, { external: true })
</script>

<style scoped>
.redirect-page {
  display: grid;
  min-height: 60vh;
  place-content: center;
  gap: 10px;
  text-align: center;
}

.redirect-page p {
  margin: 0;
  color: var(--muted);
}

.redirect-page a {
  color: var(--purple);
  font-weight: 700;
}
</style>
