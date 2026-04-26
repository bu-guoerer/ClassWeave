import { createRouter, createWebHistory } from 'vue-router'

// ================== A同学写的页面 ==================
import ChatView from '../views/ChatView.vue'
import KnowledgeBase from '../views/KnowledgeBase.vue'
import TemplateLibrary from '../views/TemplateLibrary.vue'

// ================== B同学写的页面 ==================
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import AIDoc from '../views/AIDoc.vue'
import AISlide from '../views/AISlide.vue'
import ReactPage from '../views/React.vue'
import LigongBase from '../views/LigongBase.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    // ✅ 正确重定向：访问 / 跳转到 /intro
    {
      path: '/',
      redirect: '/intro'
    },
    {
      path: '/intro',
      name: 'intro',
      component: Home
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: KnowledgeBase
    },
      {
      path: '/ligong',
      name: 'ligong',
      component: LigongBase
    },
    {
      path: '/templates',
      name: 'templates',
      component: TemplateLibrary
    },
    {
      path: '/ai-doc',
      name: 'aidoc',
      component: AIDoc
    },
    {
      path: '/ai-slide',
      name: 'aislide',
      component: AISlide
    },
    {
      path: '/react',
      name: 'react',
      component: ReactPage
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果存在 savedPosition（例如浏览器前进/后退），则恢复到该位置
    if (savedPosition) {
      return savedPosition
    } else {
      // 否则滚动到顶部
      return { top: 0 }
    }
  },
})

export default router