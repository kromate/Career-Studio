import type { ToastMessage } from '@/types'

export function useToast() {
  const messages = useState<ToastMessage[]>('career-studio-toasts', () => [])
  const nextId = useState('career-studio-toast-id', () => 0)

  const show = (
    title: string,
    options: { message?: string; tone?: ToastMessage['tone']; duration?: number } = {},
  ) => {
    const id = Date.now() + nextId.value++
    const duration = options.duration ?? 5000
    messages.value.push({
      id,
      title,
      message: options.message,
      tone: options.tone || 'success',
      duration,
    })
    if (import.meta.client && duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
  }

  const dismiss = (id: number) => {
    messages.value = messages.value.filter(message => message.id !== id)
  }

  return { messages, show, dismiss }
}
