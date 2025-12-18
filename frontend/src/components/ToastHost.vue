<script setup lang="ts">
import { watch } from 'vue'
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()

// Auto-cierre simple para toasts.
watch(
  () => uiStore.toasts.map((t) => t.id),
  (ids) => {
    for (const id of ids) {
      window.setTimeout(() => {
        uiStore.removeToast(id)
      }, 4000)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
    <div
      v-for="t in uiStore.toasts"
      :key="t.id"
      class="pointer-events-auto rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-800 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="font-semibold">Error</div>
          <div class="mt-0.5 break-words">{{ t.message }}</div>
        </div>
        <button
          type="button"
          class="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs"
          @click="uiStore.removeToast(t.id)"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>
