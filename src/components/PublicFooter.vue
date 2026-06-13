<template>
  <footer class="public-footer">
    <div class="container footer-grid">
      <div>
        <BrandMark />
        <p>
          Open-source tools for the decisions, documents, practice, and people
          that move a career forward.
        </p>
        <span class="company-note">Powered by Goalmatic.</span>
      </div>
      <div class="footer-links">
        <strong>Product</strong>
        <NuxtLink to="/#vision">Product vision</NuxtLink>
        <NuxtLink to="/methodology">Scoring methodology</NuxtLink>
        <NuxtLink to="/privacy">Privacy</NuxtLink>
        <NuxtLink to="/login">Sign in</NuxtLink>
      </div>
      <div class="footer-links">
        <strong>Community</strong>
        <NuxtLink to="/open-source">Open source</NuxtLink>
        <a href="https://github.com/kromate/Career-Studio" target="_blank" rel="noreferrer">GitHub repository</a>
        <a href="https://goalmatic.io" target="_blank" rel="noreferrer">Goalmatic</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© {{ new Date().getFullYear() }} Kromate. MIT licensed.</span>
      <span>Built for people navigating work, never for ranking them.</span>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  padding: 54px 0 24px;
  border-top: 1px solid var(--line);
  background: #f9fafb;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 60px;
}

.footer-grid p {
  max-width: 370px;
  margin: 20px 0 10px;
  color: var(--ink-soft);
  line-height: 1.65;
}

.company-note {
  color: var(--muted);
  font-size: 12px;
}

.footer-links {
  display: grid;
  align-content: start;
  gap: 12px;
  color: var(--ink-soft);
  font-size: 13px;
}

.footer-links strong {
  margin-bottom: 4px;
  color: var(--ink);
  font-family: var(--font-display);
}

.footer-links a:hover {
  color: var(--purple);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 720px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }

  .footer-grid > :first-child {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
