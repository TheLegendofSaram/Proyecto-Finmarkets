import { setActivePinia, createPinia } from 'pinia'
import type { Note } from '../../types'
import { useBoardStore } from '../boardStore'

// Mock del socketService para simular eventos entrantes sin abrir una conexión real.
vi.mock('../../services/socketService', () => {
  let noteCreatedHandler: ((note: Note) => void) | null = null

  return {
    socketService: {
      connect: vi.fn(),
      disconnect: vi.fn(),

      emitJoin: vi.fn(),
      emitBoardInit: vi.fn(),
      emitCreateNote: vi.fn(),
      emitUpdateNote: vi.fn(),
      emitMoveNote: vi.fn(),
      emitDeleteNote: vi.fn(),
      emitAddComment: vi.fn(),

      onConnect: vi.fn(() => () => {}),
      onDisconnect: vi.fn(() => () => {}),
      onPresenceUsers: vi.fn(() => () => {}),
      onBoardData: vi.fn(() => () => {}),

      onNoteCreated: vi.fn((handler: (note: Note) => void) => {
        noteCreatedHandler = handler
        return () => {
          noteCreatedHandler = null
        }
      }),
      onNoteUpdated: vi.fn(() => () => {}),
      onNoteDeleted: vi.fn(() => () => {}),
      onNoteCommented: vi.fn(() => () => {}),
      onServerError: vi.fn(() => () => {}),

      // Helper sólo para tests
      __triggerNoteCreated: (note: Note) => noteCreatedHandler?.(note),
    },
  }
})

describe('boardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a note to state when note:created arrives', async () => {
    const store = useBoardStore()
    store.connect()

    const { socketService } = await import('../../services/socketService')

    const incoming: Note = {
      id: 'n1',
      title: 'Hello',
      content: 'World',
      x: 100,
      y: 100,
      updatedBy: 'ana',
      comments: [],
    }

    // @ts-expect-error helper de test
    socketService.__triggerNoteCreated(incoming)

    expect(store.notes.length).toBe(1)
    expect(store.notes[0]?.id).toBe('n1')
    expect(store.notes[0]?.title).toBe('Hello')
  })
})
