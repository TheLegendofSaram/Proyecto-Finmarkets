# Realtime Collaboration Board

App tipo “Google Keep + Figma comments” donde varios usuarios pueden crear, editar y mover notas en un tablero compartido en tiempo real usando Socket.IO.

## Arquitectura

La idea principal es simple: **los componentes no hablan con el socket**. Todo pasa por:

- **Servicio (Gateway) de Socket:** encapsula `socket.on` / `socket.emit`.
- **Store global (Pinia):** es la única fuente de verdad del estado del tablero.
- **Componentes/Vistas:** renderizan estado y disparan acciones del store.

### Capas

**1) Socket Gateway**
- Archivo: [frontend/src/services/socketService.ts](frontend/src/services/socketService.ts)
- Responsabilidad:
  - Conectarse a `http://localhost:3001`
  - Exponer métodos “amables” (ej: `emitCreateNote`, `emitUpdateNote`, `onNoteUpdated`)
  - Registrar listeners sin que los componentes conozcan Socket.IO

**2) Store (Pinia)**
- Archivo: [frontend/src/stores/boardStore.ts](frontend/src/stores/boardStore.ts)
- Estado principal:
  - `notes`: array de notas
  - `users`: usuarios online
  - `currentUser`: usuario actual
  - `isConnected`: estado de conexión
- Responsabilidad:
  - Conectar/desconectar
  - “Traducir” eventos entrantes del socket a mutaciones del estado (ej: `note:updated` → actualiza el array)
  - Acciones para la UI (`createNote`, `updateNote`, `moveNote`, `deleteNote`, `addComment`)
  - Concurrencia: estrategia **optimista** (UI actualiza local + servidor confirma broadcast)

**3) UI (views/components)**
- Login: [frontend/src/views/LoginView.vue](frontend/src/views/LoginView.vue)
- Board: [frontend/src/views/BoardView.vue](frontend/src/views/BoardView.vue)
- Nota: [frontend/src/components/NoteCard.vue](frontend/src/components/NoteCard.vue)
- Toasts: [frontend/src/components/ToastHost.vue](frontend/src/components/ToastHost.vue)

### Concurrencia (optimista, “last write wins”)

- Mientras editas, tu UI se actualiza inmediatamente y se emite un `note:update` con debounce.
- Si otro usuario edita al mismo tiempo, el servidor termina “arbitrando” por orden de llegada (último cambio prevalece).
- Para evitar que el texto “salte” mientras escribes, el componente de la nota **no sobreescribe el contenido local cuando el input está enfocado**.

### Notas dentro del área (anti-notas perdidas)

Para evitar que una nota quede fuera del canvas (y sea imposible arrastrarla o borrarla), se hace **clamp** de coordenadas:

- En UI (durante drag) y al soltar.
- En el store (al crear/mover y también al recibir datos del server).

## Diagrama (texto) de flujo de eventos realtime

### Conexión y presencia

1) Usuario escribe su nombre en Login.
2) Cliente → Servidor: `user:join { name }`
3) Servidor → Todos: `presence:users { users }` (lista actualizada)

### Inicialización del tablero

1) Cliente → Servidor: `board:init`
2) Servidor → Cliente: `board:data { notes }`

### Crear nota

1) Cliente → Servidor: `note:create { title, content, x, y }`
2) Servidor → Todos: `note:created (note)`
3) Store: agrega la nota en `notes` → UI la renderiza

### Editar contenido / mover nota (drag & drop)

1) UI cambia contenido (debounce) o suelta nota tras drag
2) Cliente → Servidor: `note:update { id, ...fields }`
3) Servidor → Todos: `note:updated (note)`
4) Store: reemplaza la nota local por la versión del servidor (last-write-wins)

### Eliminar nota

1) Cliente → Servidor: `note:delete { id }`
2) Servidor → Todos: `note:deleted { id }`
3) Store: remueve la nota local

### Comentar

1) Cliente → Servidor: `note:comment { noteId, text }`
2) Servidor → Todos: `note:commented { noteId, comment }`
3) Store: inserta el comentario en la nota correspondiente

### Errores

- Servidor → Cliente: `server:error { message }`
- Store → UI: agrega toast (notificación) con el mensaje

## Decisiones técnicas, por que se hizo asi

- **Vue 3 + Composition API**: para un flujo claro de estado/side-effects y componentes más predecibles.
- **Pinia** (obligatorio en el reto):
  - Simple de leer/escalar, buen tipado con TypeScript
  - Ideal para “listeners → store → UI” en tiempo real
- **Gateway de Socket (socketService)**:
  - Mantiene la regla del reto: *nada de `socket.emit/on` en componentes*
  - Facilita tests (se puede mockear el servicio)
- **Estrategia optimista + last-write-wins**:
  - Es la forma más razonable
  - Mejora UX: el usuario ve cambios al instante
- **Vitest**:
  - Necesario para el reto
  - Rápido y natural con Vite
  - Fácil de montar componentes y testear stores

## Instalación y ejecución

Requisitos:
- Node.js (recomendado 18+)

### 1) Backend

En una terminal:

- `cd backend`
- `npm install` (Solo la primera vez)
- `npm run dev`

El servidor corre en `http://localhost:3001`.

### 2) Frontend

En otra terminal:

- `cd frontend`
- `npm install` (Solo la primera vez)
- `npm run dev`

Abre `http://localhost:5173`.

## Tests

Desde `frontend/`:

- `npm run test:run` (modo CI)
- `npm run test` (watch)

## Notas rápidas / limitaciones conocidas

- No hay persistencia (si reinicias backend, se pierde el estado).
- El “typing indicator” tipo “Carlos está editando…” se puede añadir encima del esquema actual (hoy se muestra “Editado por …” + highlight cuando llega update externo).

## Mejoras futuras (si hubiera más tiempo)

- Persistencia real (SQLite/JSON)
- Indicador de edición concurrente (presence por nota)
- Multi-board
- Mejor cálculo dinámico de bounds (alto real de la nota al abrir comentarios)
- Mejoras de UI
    - Toggle de modo oscuro
    - Cambio de colores de las notas concurrente
    - Avatares por defecto para señalizar a los usuarios en sus distintas areas
