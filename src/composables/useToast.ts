import type { ToastMessage } from '@/types'

export function useToast() {
  const messages = useState<ToastMessage[]>('career-studio-toasts', () => [])

  const show = (
    title: string,
    options: { message?: string; tone?: ToastMessage['tone']; duration?: number } = {},
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    messages.value.push({
      id,
      title,
      message: options.message,
      tone: options.tone || 'success',
    })
    if (import.meta.client) {
      window.setTimeout(() => dismiss(id), options.duration || 3200)
    }
  }

  const dismiss = (id: number) => {
    messages.value = messages.value.filter(message => message.id !== id)
  }

  return { messages, show, dismiss }
}
