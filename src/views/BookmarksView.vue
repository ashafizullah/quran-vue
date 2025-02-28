<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getAllSurahBookmarks, 
  getAllAyahBookmarks, 
  removeSurahBookmark, 
  removeAyahBookmark,
  SurahBookmark,
  AyahBookmark
} from '../utils/bookmarkStore';

const surahBookmarks = ref<SurahBookmark[]>([]);
const ayahBookmarks = ref<AyahBookmark[]>([]);
const activeTab = ref<'surah' | 'ayah'>('surah');

onMounted(() => {
  loadBookmarks();
});

function loadBookmarks() {
  surahBookmarks.value = getAllSurahBookmarks();
  ayahBookmarks.value = getAllAyahBookmarks();
}

function deleteSurahBookmark(surahNumber: number) {
  if (confirm('Hapus bookmark ini?')) {
    removeSurahBookmark(surahNumber);
    loadBookmarks();
  }
}

function deleteAyahBookmark(surahNumber: number, ayahNumber: number) {
  if (confirm('Hapus bookmark ini?')) {
    removeAyahBookmark(surahNumber, ayahNumber);
    loadBookmarks();
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Bookmark Al-Quran</h1>
    
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <ul class="nav nav-tabs" id="bookmarkTabs">
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'surah' }" 
              @click="activeTab = 'surah'"
            >
              <i class="bi bi-bookmark-star me-1"></i> Surah Tersimpan
            </button>
          </li>
          <li class="nav-item">
            <button 
              class="nav-link" 
              :class="{ active: activeTab === 'ayah' }" 
              @click="activeTab = 'ayah'"
            >
              <i class="bi bi-bookmark-heart me-1"></i> Ayat Tersimpan
            </button>
          </li>
        </ul>
        
        <div class="tab-content mt-3">
          <!-- Surah Bookmarks -->
          <div v-if="activeTab === 'surah'">
            <div v-if="surahBookmarks.length === 0" class="alert alert-info">
              Belum ada Surah yang disimpan sebagai bookmark.
            </div>
            
            <div v-else class="list-group">
              <div v-for="bookmark in surahBookmarks" :key="bookmark.surahNumber" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                  <div>
                    <h5 class="mb-1">
                      <router-link :to="`/surah/${bookmark.surahNumber}`" class="text-decoration-none">
                        {{ bookmark.surahName }}
                      </router-link>
                    </h5>
                    <p class="mb-1 text-muted small">
                      <i class="bi bi-clock-history me-1"></i> Disimpan pada {{ formatDate(bookmark.timestamp) }}
                    </p>
                  </div>
                  <div class="d-flex flex-column justify-content-between">
                    <span class="badge bg-primary rounded-pill mb-2">Surah {{ bookmark.surahNumber }}</span>
                    <button 
                      class="btn btn-sm btn-outline-danger" 
                      @click.prevent="deleteSurahBookmark(bookmark.surahNumber)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Ayah Bookmarks -->
          <div v-if="activeTab === 'ayah'">
            <div v-if="ayahBookmarks.length === 0" class="alert alert-info">
              Belum ada Ayat yang disimpan sebagai bookmark.
            </div>
            
            <div v-else class="list-group">
              <div v-for="bookmark in ayahBookmarks" :key="`${bookmark.surahNumber}-${bookmark.ayahNumber}`" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                  <div class="flex-grow-1">
                    <h5 class="mb-1">
                      <router-link :to="`/surah/${bookmark.surahNumber}`" class="text-decoration-none">
                        {{ bookmark.surahName }} - Ayat {{ bookmark.ayahNumber }}
                      </router-link>
                    </h5>
                    <p class="mb-1 arabic-text text-end fs-5">{{ bookmark.ayahText }}</p>
                    <p class="mb-1 text-muted small">
                      <i class="bi bi-clock-history me-1"></i> Disimpan pada {{ formatDate(bookmark.timestamp) }}
                    </p>
                  </div>
                  <div class="ms-2 d-flex flex-column">
                    <button 
                      class="btn btn-sm btn-outline-danger" 
                      @click.prevent="deleteAyahBookmark(bookmark.surahNumber, bookmark.ayahNumber)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arabic-text {
  font-family: "Traditional Arabic", "Scheherazade New", serif;
  line-height: 2;
}

.nav-link.active {
  color: var(--primary-color);
  border-color: var(--primary-color);
  border-bottom-color: transparent;
  font-weight: 500;
}

.nav-link:not(.active) {
  color: var(--dark-color);
}

.list-group-item {
  transition: all 0.2s ease;
}

.list-group-item:hover {
  background-color: var(--light-color);
}
</style>