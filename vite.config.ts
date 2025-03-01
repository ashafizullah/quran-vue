import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'Aplikasi Al-Quran',
          description: 'Aplikasi Al-Quran dengan terjemahan Bahasa Indonesia, fitur bookmark, dan audio murottal',
          keywords: 'quran, al-quran, surah, terjemahan quran, audio quran, bookmark quran',
          author: 'Adam suchi Hafizullah',
          url: 'https://quran.ashafizullah.com'
        }
      }
    })
  ]
})