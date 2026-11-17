import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/blog', name: 'Blog', component: () => import('../views/BlogPage.vue') },
  { path: '/blog/:id', name: 'BlogPost', component: () => import('../views/BlogPostPage.vue') },
  { path: '/projects', name: 'Projects', component: () => import('../views/ProjectsPage.vue') },
  { path: '/demo', name: 'DemoHub', component: () => import('../views/demo/DemoHub.vue') },
  { path: '/demo/three-body', name: 'ThreeBodyDemo', component: () => import('../views/demo/ThreeBodyDemo.vue') },
  { path: '/demo/black-hole', name: 'BlackHoleDemo', component: () => import('../views/demo/BlackHoleDemo.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router