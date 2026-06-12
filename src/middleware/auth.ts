export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const workspace = useWorkspace()
  workspace.hydrate()
  if (!workspace.state.value.user) return navigateTo('/login')
})
