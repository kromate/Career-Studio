<template>
  <button class="command-trigger" type="button" @click="open = true">
    <Search :size="15" />
    <span>Command</span>
    <kbd>⌘K</kbd>
  </button>
  <BaseModal
    :open="open"
    title="Command palette"
    description="Jump to core workflows and workspace actions."
    size="lg"
    header-align="left"
    @close="open = false"
  >
    <div class="command-palette">
      <div class="command-search">
        <Search :size="16" />
        <input ref="searchInput" v-model="query" placeholder="Search commands" @keydown.enter.prevent="runCommand(filteredCommands[0])">
      </div>
      <div class="command-list">
        <button
          v-for="command in filteredCommands"
          :key="command.id"
          type="button"
          @click="runCommand(command)"
        >
          <component :is="command.icon" :size="16" />
          <span>{{ command.label }}</span>
          <small>{{ command.hint }}</small>
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { BriefcaseBusiness, Database, FilePlus2, FileSearch, Files, Moon, Search, Settings, Target, Trash2 } from 'lucide-vue-next'

interface CommandItem {
  id: string
  label: string
  hint: string
  icon: Component
  action: () => unknown | Promise<unknown>
}

const workspace = useWorkspace()
const toast = useToast()
const { toggleTheme } = useTheme()
const open = ref(false)
const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const commands = computed<CommandItem[]>(() => [
  { id: 'new-resume', label: 'Create or import resume', hint: '/app/resumes', icon: FilePlus2, action: () => navigateTo('/app/resumes') },
  { id: 'saved-resumes', label: 'Open resumes', hint: `${workspace.state.value.resumes.length} saved`, icon: Files, action: () => navigateTo('/app/resumes') },
  { id: 'compare-job', label: 'Compare with a job', hint: '/app/target', icon: Target, action: () => navigateTo('/app/target') },
  { id: 'saved-jobs', label: 'Open saved jobs', hint: `${workspace.state.value.jobs.length} saved`, icon: FileSearch, action: () => navigateTo('/app/jobs') },
  { id: 'applications', label: 'Open applications', hint: `${workspace.state.value.applications.length} tracked`, icon: BriefcaseBusiness, action: () => navigateTo('/app/applications') },
  { id: 'settings-data', label: 'Open data settings', hint: 'Export, import, delete', icon: Database, action: () => navigateTo('/app/settings?section=data') },
  { id: 'settings', label: 'Open settings', hint: 'Preferences and provider', icon: Settings, action: () => navigateTo('/app/settings') },
  { id: 'theme', label: 'Toggle theme', hint: 'Light or dark', icon: Moon, action: () => { toggleTheme(); toast.show('Theme toggled') } },
  { id: 'delete-data', label: 'Delete local data settings', hint: 'Requires confirmation', icon: Trash2, action: () => navigateTo('/app/settings?section=data') },
])

const filteredCommands = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return commands.value
  return commands.value.filter(command => `${command.label} ${command.hint}`.toLowerCase().includes(value))
})

watch(open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  await nextTick()
  searchInput.value?.focus()
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = true
  }
}

async function runCommand(command?: CommandItem) {
  if (!command) return
  open.value = false
  await command.action()
}
</script>

<style scoped>
.command-trigger {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  background: var(--control-bg);
  cursor: pointer;
}

.command-trigger:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.command-trigger kbd {
  padding: 2px 5px;
  border-radius: 5px;
  color: var(--muted);
  font-family: ui-monospace, monospace;
  font-size: 10px;
  background: var(--surface-soft);
}

.command-palette {
  display: grid;
  gap: 12px;
  padding-bottom: 10px;
}

.command-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  background: var(--surface-soft);
}

.command-search input {
  width: 100%;
  height: 42px;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
}

.command-list {
  display: grid;
  gap: 5px;
}

.command-list button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 9px 10px;
  border: 0;
  border-radius: 9px;
  color: var(--ink);
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.command-list button:hover {
  color: var(--purple);
  background: var(--purple-soft);
}

.command-list small {
  color: var(--muted);
  font-size: 10px;
}

@media (max-width: 620px) {
  .command-trigger span,
  .command-trigger kbd {
    display: none;
  }
}
</style>