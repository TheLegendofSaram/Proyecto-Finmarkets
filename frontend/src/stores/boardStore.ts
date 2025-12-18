import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Comment, Note, User } from '../types'
import { socketService } from '../services/socketService'
import { useUiStore } from './uiStore'

type Unsubscribe = () => void

export const useBoardStore = defineStore('board', () => {
  const notes = ref<Note[]>([])
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const isConnected = ref(false)

  const isJoined = computed(() => Boolean(currentUser.value?.name))

  let unsubs: Unsubscribe[] = []

  // Dimensiones del "canvas" actual del Board.
  // NOTA: Esto evita que una nota quede fuera de la zona y se vuelva inalcanzable.
  const CANVAS_WIDTH = 1600
  const CANVAS_HEIGHT = 1200
  const NOTE_WIDTH = 288 // w-72
  const NOTE_MIN_HEIGHT = 180

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function clampNotePosition(note: Note): Note {
    const maxX = Math.max(0, CANVAS_WIDTH - NOTE_WIDTH)
    const maxY = Math.max(0, CANVAS_HEIGHT - NOTE_MIN_HEIGHT)

    return {
      ...note,
      x: clamp(note.x, 0, maxX),
      y: clamp(note.y, 0, maxY),
    }
  }

  function upsertNote(incoming: Note) {
    const normalized = clampNotePosition(incoming)
    const index = notes.value.findIndex((n) => n.id === incoming.id)
    if (index === -1) {
      notes.value.push(normalized)
      return
    }

    // Estrategia de concurrencia: last-write-wins.
    notes.value[index] = normalized
  }

  function removeNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  function addCommentToNote(noteId: string, comment: Comment) {
    const note = notes.value.find((n) => n.id === noteId)
    if (!note) return

    note.comments = [...note.comments, comment]
  }

  function registerListeners() {
    cleanupListeners()

    unsubs = [
      socketService.onConnect(() => {
        isConnected.value = true
      }),
      socketService.onDisconnect(() => {
        isConnected.value = false
        users.value = []
      }),

      socketService.onPresenceUsers((nextUsers) => {
        users.value = nextUsers
      }),

      socketService.onBoardData((serverNotes) => {
        notes.value = serverNotes.map(clampNotePosition)
      }),

      socketService.onNoteCreated((note) => {
        upsertNote(note)
      }),

      socketService.onNoteUpdated((note) => {
        upsertNote(note)
      }),

      socketService.onNoteDeleted((id) => {
        removeNote(id)
      }),

      socketService.onNoteCommented(({ noteId, comment }) => {
        addCommentToNote(noteId, comment)
      }),

      socketService.onServerError((message) => {
        // Manejo global: mostramos un toast.
        const uiStore = useUiStore()
        uiStore.pushError(message)
      }),
    ]
  }

  function cleanupListeners() {
    for (const unsub of unsubs) unsub()
    unsubs = []
  }

  function connect() {
    registerListeners()
    socketService.connect()
  }

  function disconnect() {
    cleanupListeners()
    socketService.disconnect()
    isConnected.value = false
  }

  function joinBoard(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return

    currentUser.value = { name: trimmed }
    socketService.emitJoin(trimmed)
    socketService.emitBoardInit()
  }

  function requestBoardData() {
    socketService.emitBoardInit()
  }

  function createNote(payload: { title?: string; content?: string; x?: number; y?: number }) {
    const x = payload.x ?? 100
    const y = payload.y ?? 100
    const maxX = Math.max(0, CANVAS_WIDTH - NOTE_WIDTH)
    const maxY = Math.max(0, CANVAS_HEIGHT - NOTE_MIN_HEIGHT)

    socketService.emitCreateNote({
      ...payload,
      x: clamp(x, 0, maxX),
      y: clamp(y, 0, maxY),
    })
  }

  function updateNote(note: Partial<Note> & { id: string }) {
    // Optimista para que el UI refleje cambios de edición al instante.
    const existing = notes.value.find((n) => n.id === note.id)
    if (existing) {
      upsertNote({
        ...existing,
        ...note,
        updatedBy: currentUser.value?.name ?? existing.updatedBy,
      })
    }

    socketService.emitUpdateNote(note)
  }

  function moveNote(payload: { id: string; x: number; y: number }) {
    const maxX = Math.max(0, CANVAS_WIDTH - NOTE_WIDTH)
    const maxY = Math.max(0, CANVAS_HEIGHT - NOTE_MIN_HEIGHT)
    const clamped = {
      ...payload,
      x: clamp(payload.x, 0, maxX),
      y: clamp(payload.y, 0, maxY),
    }

    // Optimista para que el UI reaccione al drag inmediatamente.
    const existing = notes.value.find((n) => n.id === payload.id)
    if (existing) {
      upsertNote({
        ...existing,
        x: clamped.x,
        y: clamped.y,
        updatedBy: currentUser.value?.name ?? existing.updatedBy,
      })
    }

    socketService.emitMoveNote(clamped)
  }

  function deleteNote(id: string) {
    socketService.emitDeleteNote(id)
  }

  function addComment(payload: { noteId: string; text: string }) {
    socketService.emitAddComment(payload)
  }

  return {
    // state
    notes,
    users,
    currentUser,
    isConnected,

    // getters
    isJoined,

    // actions
    connect,
    disconnect,
    joinBoard,
    requestBoardData,
    createNote,
    updateNote,
    moveNote,
    deleteNote,
    addComment,
  }
})
