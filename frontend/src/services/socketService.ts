import { io, type Socket } from 'socket.io-client'
import type { Comment, Note, User } from '../types'

// OJO: Este archivo es la única capa autorizada para usar socket.on / socket.emit.
// Los componentes NO deben importar socket.io-client directamente.

type ServerToClientEvents = {
  'presence:users': (payload: { users: User[] }) => void
  'board:data': (payload: { notes: Note[] }) => void

  'note:created': (note: Note) => void
  'note:updated': (note: Note) => void
  'note:deleted': (payload: { id: string }) => void
  'note:commented': (payload: { noteId: string; comment: Comment }) => void

  'server:error': (payload: { message: string }) => void
}

type ClientToServerEvents = {
  'user:join': (payload: { name: string }) => void
  'board:init': () => void

  'note:create': (payload: { title?: string; content?: string; x?: number; y?: number }) => void
  'note:update': (note: Partial<Note> & { id: string }) => void
  'note:delete': (payload: { id: string }) => void
  'note:comment': (payload: { noteId: string; text: string }) => void
}

export type SocketService = {
  connect: () => void
  disconnect: () => void

  emitJoin: (name: string) => void
  emitBoardInit: () => void

  emitCreateNote: (payload: { title?: string; content?: string; x?: number; y?: number }) => void
  emitUpdateNote: (note: Partial<Note> & { id: string }) => void
  emitMoveNote: (payload: { id: string; x: number; y: number }) => void
  emitDeleteNote: (id: string) => void
  emitAddComment: (payload: { noteId: string; text: string }) => void

  onConnect: (handler: () => void) => () => void
  onDisconnect: (handler: () => void) => () => void

  onPresenceUsers: (handler: (users: User[]) => void) => () => void
  onBoardData: (handler: (notes: Note[]) => void) => () => void

  onNoteCreated: (handler: (note: Note) => void) => () => void
  onNoteUpdated: (handler: (note: Note) => void) => () => void
  onNoteDeleted: (handler: (id: string) => void) => () => void
  onNoteCommented: (handler: (payload: { noteId: string; comment: Comment }) => void) => () => void

  onServerError: (handler: (message: string) => void) => () => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) return socket

  socket = io('http://localhost:3001', {
    transports: ['websocket'],
    autoConnect: false,
  })

  return socket
}

export const socketService: SocketService = {
  connect() {
    getSocket().connect()
  },

  disconnect() {
    socket?.disconnect()
  },

  emitJoin(name) {
    getSocket().emit('user:join', { name })
  },

  emitBoardInit() {
    getSocket().emit('board:init')
  },

  emitCreateNote(payload) {
    getSocket().emit('note:create', payload)
  },

  emitUpdateNote(note) {
    getSocket().emit('note:update', note)
  },

  emitMoveNote(payload) {
    getSocket().emit('note:update', payload)
  },

  emitDeleteNote(id) {
    getSocket().emit('note:delete', { id })
  },

  emitAddComment(payload) {
    getSocket().emit('note:comment', payload)
  },

  onConnect(handler) {
    const s = getSocket()
    s.on('connect', handler)
    return () => s.off('connect', handler)
  },

  onDisconnect(handler) {
    const s = getSocket()
    s.on('disconnect', handler)
    return () => s.off('disconnect', handler)
  },

  onPresenceUsers(handler) {
    const s = getSocket()
    const wrapped = (payload: { users: User[] }) => handler(payload.users)
    s.on('presence:users', wrapped)
    return () => s.off('presence:users', wrapped)
  },

  onBoardData(handler) {
    const s = getSocket()
    const wrapped = (payload: { notes: Note[] }) => handler(payload.notes)
    s.on('board:data', wrapped)
    return () => s.off('board:data', wrapped)
  },

  onNoteCreated(handler) {
    const s = getSocket()
    s.on('note:created', handler)
    return () => s.off('note:created', handler)
  },

  onNoteUpdated(handler) {
    const s = getSocket()
    s.on('note:updated', handler)
    return () => s.off('note:updated', handler)
  },

  onNoteDeleted(handler) {
    const s = getSocket()
    const wrapped = (payload: { id: string }) => handler(payload.id)
    s.on('note:deleted', wrapped)
    return () => s.off('note:deleted', wrapped)
  },

  onNoteCommented(handler) {
    const s = getSocket()
    s.on('note:commented', handler)
    return () => s.off('note:commented', handler)
  },

  onServerError(handler) {
    const s = getSocket()
    const wrapped = (payload: { message: string }) => handler(payload.message)
    s.on('server:error', wrapped)
    return () => s.off('server:error', wrapped)
  },
}
