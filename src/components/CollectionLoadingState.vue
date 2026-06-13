<template>
  <div class="page-shell collection-loading" aria-label="Loading workspace data" aria-busy="true">
    <header>
      <div>
        <AppSkeleton width="210px" height="38px" radius="10px" />
        <AppSkeleton width="500px" height="16px" radius="8px" />
      </div>
      <AppSkeleton width="160px" height="42px" radius="10px" />
    </header>
    <div class="loading-summary">
      <AppSkeleton v-for="index in 3" :key="index" height="88px" radius="14px" />
    </div>
    <div class="loading-list card">
      <AppSkeleton v-for="index in 4" :key="index" height="96px" radius="12px" />
    </div>
  </div>
</template>

<style scoped>
.collection-loading,
.collection-loading header > div,
.loading-list {
  display: grid;
  gap: 14px;
}

.collection-loading header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.loading-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.loading-list {
  padding: 18px;
}

@media (max-width: 680px) {
  .collection-loading header {
    align-items: stretch;
    flex-direction: column;
  }

  .loading-summary {
    grid-template-columns: 1fr;
  }
}
</style>
