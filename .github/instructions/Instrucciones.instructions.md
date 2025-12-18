# Contexto del Proyecto
El objetivo es construir el frontend de "Realtime Collaboration Board", una app tipo Google Keep + Figma, que cuando varios usuarios están conectados, pueden crear, editar y mover notas en un tablero compartido en tiempo real usando WebSockets (Socket.IO). OJO, por favor no desarrollar el backend, ya existe uno funcional y ademas no cambies lo que YO ESCRIBA Y ME LO ECHES A PERDER si ves algun error solo avisame, muchas gracias.

# Stack Tecnológico
- **Framework:** Vue 3 (Composition API, `<script setup lang="ts">`).
- **Estado:** Pinia (Obligatorio).
- **Estilos:** TailwindCSS (Configuración básica).
- **Realtime:** Socket.IO Client.
- **Testing:** Vitest.
- **Iconos:** Lucide-vue-next o Heroicons.

# Reglas de Arquitectura (ESTRICTO)
1. **Capa de Servicios:** NUNCA llames a `socket.emit` o `socket.on` directamente en los componentes. Debes crear un `socketService.ts` o Gateway que abstraiga la comunicación.
2. **Store (Pinia):** El store debe manejar el estado global (notas, usuarios, conexión). Los componentes despachan acciones al store, y el store usa el servicio de sockets.
3. **Tipado:** Usa TypeScript estricto. Define interfaces para `Note`, `User`, `Comment` basadas en la estructura de datos provista.
4. **Idioma:** Todo el código (variables, funciones) en inglés, pero **toda la documentación (README) y comentarios explicativos dentro del código deben estar en ESPAÑOL**.

# Requisitos Funcionales
1. **Auth:** Pantalla simple para ingresar nombre de usuario (sin contraseña).
2. **Tablero:** Lienzo infinito o contenedor grande donde se renderizan las notas.
3. **Notas:**
   - Crear, Editar, Eliminar.
   - **Drag & Drop:** Mover notas libremente por el tablero (actualiza X e Y).
   - Indicadores visuales de quién editó por última vez.
4. **Comentarios:** Agregar comentarios dentro de una nota.
5. **Concurrencia:** Si alguien edita, mostrar indicador visual. Estrategia "Last write wins".

# Estructura de Datos (Backend existente)
- Nota: `{ id, title, content, x, y, updatedBy, comments: [{ user, text, timestamp }] }`.
- Eventos Socket:
    - Emite: `user:join`, `board:init`, `note:create`, `note:update`, `note:delete`, `note:comment`.
    - Escucha: `presence:users`, `board:data`, `note:created`, `note:updated`, `note:deleted`, `note:commented`, `server:error`.