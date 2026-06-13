export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const workspace = useWorkspace()
  workspace.hydrate()
  const user = workspace.state.value.user
  if (!user || (user as { authProvider?: string }).authProvider === 'demo') {
    workspace.logout()
    return navigateTo('/login', { replace: true })
  }
})
