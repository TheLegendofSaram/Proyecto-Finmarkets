/// <reference types="vite/client" />

// Este archivo le indica a TypeScript cómo tipar imports de archivos .vue desde código .ts.
// Sin esto, puede que veas errores tipo: "Cannot find module './Algo.vue'".

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
