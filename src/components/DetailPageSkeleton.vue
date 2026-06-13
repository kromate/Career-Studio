<template>
  <div class="detail-skeleton" aria-label="Loading page" role="status">
    <header class="detail-skeleton-header">
      <div>
        <AppSkeleton width="88px" height="11px" />
        <AppSkeleton width="280px" height="30px" radius="8px" />
        <AppSkeleton width="210px" height="12px" />
      </div>
      <div class="detail-skeleton-actions">
        <AppSkeleton width="105px" height="40px" radius="9px" />
        <AppSkeleton width="135px" height="40px" radius="9px" />
      </div>
    </header>
    <section class="detail-skeleton-hero card">
      <AppSkeleton width="138px" height="138px" radius="50%" />
      <div class="detail-skeleton-copy">
        <AppSkeleton width="145px" height="10px" />
        <AppSkeleton width="72%" height="24px" radius="7px" />
        <AppSkeleton width="92%" height="12px" />
        <AppSkeleton width="78%" height="12px" />
      </div>
      <div class="detail-skeleton-bars">
        <AppSkeleton v-for="item in 4" :key="item" height="13px" />
      </div>
    </section>
    <section class="detail-skeleton-grid">
      <article class="card detail-skeleton-list">
        <AppSkeleton width="45%" height="18px" />
        <AppSkeleton v-for="item in 5" :key="item" height="58px" radius="9px" />
      </article>
      <article class="card detail-skeleton-list">
        <AppSkeleton width="52%" height="18px" />
        <AppSkeleton width="100%" height="94px" radius="10px" />
        <AppSkeleton width="100%" height="180px" radius="10px" />
      </article>
    </section>
  </div>
</template>

<style scoped>
.detail-skeleton {
  display: grid;
  gap: 17px;
}

.detail-skeleton-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.detail-skeleton-header > div:first-child,
.detail-skeleton-copy,
.detail-skeleton-bars,
.detail-skeleton-list {
  display: grid;
  gap: 11px;
}

.detail-skeleton-actions {
  display: flex;
  gap: 8px;
}

.detail-skeleton-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 0.9fr) minmax(280px, 1.1fr);
  align-items: center;
  gap: 28px;
  padding: 28px;
}

.detail-skeleton-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 17px;
}

.detail-skeleton-list {
  padding: 20px;
}

@media (max-width: 850px) {
  .detail-skeleton-hero,
  .detail-skeleton-grid {
    grid-template-columns: 1fr;
  }

  .detail-skeleton-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
