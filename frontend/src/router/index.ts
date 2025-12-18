import { createRouter, createWebHistory } from 'vue-router'
import { useBoardStore } from '../stores/boardStore'

// OJO: Rutas mínimas para el reto. Se pueden modularizar más adelante.

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/board',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('../views/BoardView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const boardStore = useBoardStore()

  if (to.name === 'board' && !boardStore.isJoined) {
    return { name: 'login' }
  }

  if (to.name === 'login' && boardStore.isJoined) {
    return { name: 'board' }
  }

  return true
})
