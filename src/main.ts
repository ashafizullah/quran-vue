import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import './style.css'
import App from './App.vue'
import Home from './views/Home.vue'
import SurahDetail from './views/SurahDetail.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/surah/:id', component: SurahDetail, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App)
  .use(router)
  .mount('#app')