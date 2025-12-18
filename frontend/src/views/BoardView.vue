<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '../stores/boardStore'
import NoteCard from '../components/NoteCard.vue'

const router = useRouter()
const boardStore = useBoardStore()

const onlineUsers = computed(() => boardStore.users)
const notes = computed(() => boardStore.notes)

const canvas = {
  width: 1600,
  height: 1200,
} as const

function onCreateNote() {
  // Coordenadas simples para que no se apilen todas exactamente igual.
  const offset = (notes.value.length % 10) * 24
  boardStore.createNote({
    title: 'Nueva nota',
    content: '',
    x: 60 + offset,
    y: 60 + offset,
  })
}

onMounted(() => {
  // Si el usuario ya está logueado, conectamos y pedimos data inicial.
  // Si no lo está, lo mandamos a Login.
  if (!boardStore.isJoined) {
    router.replace({ name: 'login' })
    return
  }

  if (!boardStore.isConnected) boardStore.connect()
  boardStore.requestBoardData()
})

watch(
  () => boardStore.isJoined,
  (joined) => {
    if (!joined) router.replace({ name: 'login' })
  },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="text-sm font-semibold text-gray-900">Board</div>
          <div class="text-xs text-gray-600">Online: {{ onlineUsers.length }}</div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
            @click="onCreateNote"
          >
            Crear nota
          </button>

          <div
            v-for="u in onlineUsers"
            :key="u.name"
            class="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs text-gray-800"
            :title="u.name"
          >
            {{ u.name }}
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <section class="rounded-lg border border-dashed border-gray-300 bg-white p-4">
        <div class="text-sm font-medium text-gray-900">Tablero</div>
        <p v-if="!notes.length" class="mt-1 text-sm text-gray-600">
          Aún no hay notas. Cuando existan, podrás arrastrarlas y editarlas.
        </p>

        <div class="relative mt-4 h-[70vh] w-full overflow-auto rounded-md bg-gray-50">
          <div class="relative h-[1200px] w-[1600px]">
            <NoteCard v-for="n in notes" :key="n.id" :note="n" :bounds="canvas" />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
