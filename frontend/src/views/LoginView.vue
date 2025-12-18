<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '../stores/boardStore'

const router = useRouter()
const boardStore = useBoardStore()

const name = ref('')
const canSubmit = computed(() => name.value.trim().length > 0)

function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  // Conectamos socket y luego nos unimos al tablero.
  // Socket.IO bufferiza eventos, pero preferimos conectar explícitamente.
  boardStore.connect()
  boardStore.joinBoard(trimmed)

  router.replace({ name: 'board' })
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
      <h1 class="text-xl font-semibold text-gray-900">Realtime Collaboration Board</h1>
      <p class="mt-1 text-sm text-gray-600">Ingresa tu nombre para unirte al tablero.</p>

      <form class="mt-6 space-y-3" @submit.prevent="onSubmit">
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Nombre</span>
          <input
            v-model="name"
            type="text"
            autocomplete="nickname"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Ej: Carlos"
          />
        </label>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ingresar
        </button>
      </form>
    </div>
  </main>
</template>
