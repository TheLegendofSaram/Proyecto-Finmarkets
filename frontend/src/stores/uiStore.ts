import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

type ToastType = 'error'

export type Toast = {
  id: string
  type: ToastType
  message: string
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])

  function pushError(message: string) {
    const toast: Toast = {
      id: uuidv4(),
      type: 'error',
      message,
    }

    toasts.value = [...toasts.value, toast]
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    pushError,
    removeToast,
  }
})
