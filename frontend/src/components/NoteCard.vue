<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Note } from '../types'
import { useBoardStore } from '../stores/boardStore'

const props = defineProps<{ note: Note; bounds: { width: number; height: number } }>()

const boardStore = useBoardStore()

const localTitle = ref(props.note.title)
const localContent = ref(props.note.content)

const isCommentsOpen = ref(false)
const commentText = ref('')

const isEditing = ref(false)

const currentUserName = computed(() => boardStore.currentUser?.name ?? '')
const isExternalUpdate = ref(false)
let externalUpdateTimer: number | null = null

// Drag state
const isDragging = ref(false)
const dragStartMouse = ref<{ x: number; y: number } | null>(null)
const dragStartNote = ref<{ x: number; y: number } | null>(null)

// Mientras se arrastra, usamos posición local para que sea fluido.
const localX = ref<number | null>(null)
const localY = ref<number | null>(null)

const NOTE_WIDTH = 288 // w-72
const NOTE_MIN_HEIGHT = 180

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampToBounds(x: number, y: number) {
  const maxX = Math.max(0, props.bounds.width - NOTE_WIDTH)
  const maxY = Math.max(0, props.bounds.height - NOTE_MIN_HEIGHT)
  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY),
  }
}

const cardStyle = computed(() => {
  const x = localX.value ?? props.note.x
  const y = localY.value ?? props.note.y

  return {
    left: `${x}px`,
    top: `${y}px`,
  }
})

// Sincronización de contenido entre usuarios:
// - Resolución de conflictos optimista (last-write-wins desde el server/store)
// - Si el usuario NO está editando, aplicamos los cambios remotos en inputs.
// - Si está editando, no sobreescribimos lo que está tipeando.
watch(
  () => [props.note.title, props.note.content, props.note.updatedBy] as const,
  ([title, content, updatedBy]) => {
    if (!isEditing.value) {
      localTitle.value = title
      localContent.value = content
    }

    if (updatedBy && updatedBy !== currentUserName.value) {
      isExternalUpdate.value = true
      if (externalUpdateTimer) window.clearTimeout(externalUpdateTimer)
      externalUpdateTimer = window.setTimeout(() => {
        isExternalUpdate.value = false
        externalUpdateTimer = null
      }, 1500)
    }
  },
)

// Si la posición cambia por sync remota y no estamos arrastrando, limpiamos posición local.
watch(
  () => [props.note.x, props.note.y] as const,
  () => {
    if (isDragging.value) return
    localX.value = null
    localY.value = null
  },
)

let saveTimer: number | null = null
let lastSent = { title: localTitle.value, content: localContent.value }

function scheduleSave() {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    const next = { title: localTitle.value, content: localContent.value }
    if (next.title === lastSent.title && next.content === lastSent.content) {
      saveTimer = null
      return
    }
    lastSent = next
    boardStore.updateNote({
      id: props.note.id,
      title: localTitle.value,
      content: localContent.value,
    })
    saveTimer = null
  }, 250)
}

watch([localTitle, localContent], () => {
  scheduleSave()
})

function onDelete() {
  boardStore.deleteNote(props.note.id)
}

function onAddComment() {
  const text = commentText.value.trim()
  if (!text) return

  boardStore.addComment({ noteId: props.note.id, text })
  commentText.value = ''
  isCommentsOpen.value = true
}

function onDragHandleMouseDown(e: MouseEvent) {
  e.preventDefault()

  isDragging.value = true
  dragStartMouse.value = { x: e.clientX, y: e.clientY }
  dragStartNote.value = { x: props.note.x, y: props.note.y }

  localX.value = props.note.x
  localY.value = props.note.y

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isDragging.value || !dragStartMouse.value || !dragStartNote.value) return

  const dx = e.clientX - dragStartMouse.value.x
  const dy = e.clientY - dragStartMouse.value.y

  const next = clampToBounds(dragStartNote.value.x + dx, dragStartNote.value.y + dy)
  localX.value = next.x
  localY.value = next.y
}

function onWindowMouseUp() {
  if (!isDragging.value) return

  isDragging.value = false

  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)

  const x = localX.value ?? props.note.x
  const y = localY.value ?? props.note.y

  const clamped = clampToBounds(x, y)

  // Emitimos el update al soltar.
  boardStore.moveNote({ id: props.note.id, x: clamped.x, y: clamped.y })

  // Dejamos que el server confirme y/o el store actualice.
  localX.value = null
  localY.value = null
  dragStartMouse.value = null
  dragStartNote.value = null
}

onBeforeUnmount(() => {
  if (saveTimer) window.clearTimeout(saveTimer)
  if (externalUpdateTimer) window.clearTimeout(externalUpdateTimer)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
})
</script>

<template>
  <article
    class="absolute w-72 select-none rounded-lg border border-amber-200 bg-amber-100 p-3 text-gray-900 shadow-sm"
    :class="isExternalUpdate ? 'ring-2 ring-emerald-300' : ''"
    :style="cardStyle"
  >
    <header class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-1 items-start gap-2">
        <button
          type="button"
          class="mt-1 h-6 w-6 flex-none cursor-move rounded border border-amber-200 bg-amber-50 text-xs text-amber-900"
          title="Arrastrar"
          aria-label="Arrastrar"
          @mousedown="onDragHandleMouseDown"
        >
          ⋮⋮
        </button>

        <input
          v-model="localTitle"
          class="w-full min-w-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-200"
          placeholder="Título"
          @focus="isEditing = true"
          @blur="isEditing = false"
        />
      </div>

      <button
        type="button"
        class="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-gray-700 hover:bg-amber-200"
        @click="onDelete"
      >
        Borrar
      </button>
    </header>

    <div class="mt-2">
      <textarea
        v-model="localContent"
        rows="4"
        class="w-full resize-none rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-200"
        placeholder="Contenido..."
        @focus="isEditing = true"
        @blur="isEditing = false"
      />

      <div class="mt-2 flex items-center justify-between">
        <button
          type="button"
          class="text-xs font-medium text-gray-700 hover:underline"
          @click="isCommentsOpen = !isCommentsOpen"
        >
          Comentarios ({{ props.note.comments?.length ?? 0 }})
        </button>

        <div class="text-[11px] text-gray-600">
          <span v-if="props.note.updatedBy">Editado por {{ props.note.updatedBy }}</span>
          <span v-else>—</span>
        </div>
      </div>

      <div v-if="isCommentsOpen" class="mt-2 space-y-2">
        <form class="flex items-center gap-2" @submit.prevent="onAddComment">
          <input
            v-model="commentText"
            type="text"
            class="w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="Escribe un comentario..."
          />
          <button
            type="submit"
            class="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs hover:bg-amber-200"
          >
            Enviar
          </button>
        </form>

        <div
          v-for="c in props.note.comments"
          :key="c.id"
          class="rounded-md border border-amber-200 bg-amber-50 px-2 py-1"
        >
          <div class="text-xs font-medium text-gray-800">{{ c.user }}</div>
          <div class="text-xs text-gray-700">{{ c.text }}</div>
        </div>

        <div v-if="!props.note.comments.length" class="text-xs text-gray-600">Sin comentarios.</div>
      </div>
    </div>
  </article>
</template>
