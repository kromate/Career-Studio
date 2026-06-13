<template>
  <div class="page-shell overview-loading" aria-label="Loading workspace" aria-busy="true">
    <header class="loading-header">
      <div>
        <AppSkeleton width="120px" height="12px" radius="6px" />
        <AppSkeleton width="330px" height="38px" radius="10px" />
        <AppSkeleton width="520px" height="16px" radius="8px" />
      </div>
      <div class="loading-actions">
        <AppSkeleton width="170px" height="42px" radius="10px" />
        <AppSkeleton width="150px" height="42px" radius="10px" />
      </div>
    </header>

    <AppSkeleton height="112px" radius="16px" />

    <div class="loading-grid">
      <section class="card loading-card">
        <AppSkeleton width="130px" height="12px" radius="6px" />
        <AppSkeleton width="220px" height="25px" radius="8px" />
        <div class="score-row">
          <AppSkeleton width="142px" height="142px" radius="50%" />
          <div class="loading-lines">
            <AppSkeleton v-for="index in 4" :key="index" height="30px" radius="8px" />
          </div>
        </div>
      </section>
      <section class="card loading-card">
        <AppSkeleton width="110px" height="12px" radius="6px" />
        <AppSkeleton width="200px" height="25px" radius="8px" />
        <div class="stat-grid">
          <AppSkeleton v-for="index in 4" :key="index" height="78px" radius="12px" />
        </div>
        <AppSkeleton height="88px" radius="12px" />
      </section>
    </div>

    <div class="loading-grid">
      <AppSkeleton height="300px" radius="16px" />
      <AppSkeleton height="300px" radius="16px" />
    </div>
  </div>
</template>

<style scoped>
.overview-loading {
  display: grid;
  gap: 17px;
}

.loading-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.loading-header > div:first-child,
.loading-card,
.loading-lines {
  display: grid;
  gap: 12px;
}

.loading-actions {
  display: flex;
  gap: 10px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.loading-card {
  padding: 24px;
}

.score-row {
  display: grid;
  grid-template-columns: 142px 1fr;
  align-items: center;
  gap: 28px;
  margin-top: 15px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 15px 0;
}

@media (max-width: 900px) {
  .loading-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .loading-header {
    align-items: stretch;
    flex-direction: column;
  }

  .loading-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .loading-actions :deep(.app-skeleton) {
    width: 100% !important;
  }

  .score-row {
    grid-template-columns: 1fr;
  }
}
</style>
