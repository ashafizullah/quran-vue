import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'
import './style.css'
import App from './App.vue'
import Home from './views/Home.vue'
import SurahDetail from './views/SurahDetail.vue'
import BookmarksView from './views/BookmarksView.vue'
import About from './views/About.vue'
import Changelog from './views/Changelog.vue'
import PrayerTimesView from './views/PrayerTimesView.vue'
import AsmaulHusnaView from './views/AsmaulHusnaView.vue'
import QiblaView from './views/QiblaView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/surah/:id/:ayah?', component: SurahDetail, props: true },
  { path: '/bookmarks', component: BookmarksView },
  { path: '/about', component: About },
  { path: '/changelog', component: Changelog },
  { path: '/prayer-times', component: PrayerTimesView },
  { path: '/asmaul-husna', component: AsmaulHusnaView },
  { path: '/qibla', component: QiblaView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App)
  .use(router)
  .mount('#app')