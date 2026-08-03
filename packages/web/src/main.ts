import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { getStoredPassword } from './lib/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./pages/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'editor',
      component: () => import('./pages/Editor.vue'),
    },
    {
      path: '/edit/:pathMatch(.*)*',
      name: 'edit',
      component: () => import('./pages/Editor.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const authed = Boolean(getStoredPassword())
  if (!to.meta.public && !authed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && authed) {
    return { name: 'editor' }
  }
  return true
})

const app = createApp(App)
app.use(router)
app.use(ui)
app.mount('#app')
