<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { surahNamesIndonesian, surahMeaningsIndonesian } from '../utils/surahTranslations';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

const surahs = ref<Surah[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const statsCollapsed = ref(false);

// Mapping for revelation type translation
const revelationTypeMap = {
  'Meccan': 'Makkiyah',
  'Medinan': 'Madaniyah'
};

onMounted(async () => {
  try {
    const response = await axios.get('https://api.alquran.cloud/v1/surah');
    surahs.value = response.data.data;
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal memuat Surah. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
});

const filteredSurahs = computed(() => {
  if (!searchQuery.value) return surahs.value;
  
  const query = searchQuery.value.toLowerCase();
  return surahs.value.filter(surah => 
    surah.englishName.toLowerCase().includes(query) || 
    surah.englishNameTranslation.toLowerCase().includes(query) ||
    surah.number.toString().includes(query) ||
    (surahNamesIndonesian[surah.englishName] || '').toLowerCase().includes(query) ||
    (surahMeaningsIndonesian[surah.englishName] || '').toLowerCase().includes(query)
  );
});

const stats = computed(() => {
  if (!surahs.value.length) return null;
  
  const meccanCount = surahs.value.filter(s => s.revelationType === 'Meccan').length;
  const medinanCount = surahs.value.filter(s => s.revelationType === 'Medinan').length;
  const totalAyahs = surahs.value.reduce((sum, surah) => sum + surah.numberOfAyahs, 0);
  
  // Mengurutkan surah berdasarkan jumlah ayat terbanyak dan ambil 5 teratas
  const topSurahs = [...surahs.value]
    .sort((a, b) => b.numberOfAyahs - a.numberOfAyahs)
    .slice(0, 5);
  
  return {
    meccanCount,
    medinanCount,
    totalAyahs,
    topSurahs
  };
});

// Function to translate revelation type
const translateRevelationType = (type: string): string => {
  return revelationTypeMap[type as keyof typeof revelationTypeMap] || type;
};

// Function to get Indonesian translation of surah name
const getIndonesianName = (englishName: string): string => {
  return surahNamesIndonesian[englishName] || englishName;
};

// Function to get meaning of surah name in Indonesian
const getIndonesianMeaning = (englishName: string): string => {
  return surahMeaningsIndonesian[englishName] || '';
};

// Fungsi untuk toggle collapse
function toggleStats() {
  statsCollapsed.value = !statsCollapsed.value;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Al-Quran Al-Karim</h1>

    <div v-if="stats && !loading" class="card mb-4 shadow-sm">
      <div class="card-header bg-transparent">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0 text-success">Statistik Al-Quran</h5>
          <button @click="toggleStats" class="btn btn-sm btn-outline-secondary">
            <i class="bi" :class="statsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </button>
        </div>
      </div>
      <div class="card-body" :class="{ 'collapse': statsCollapsed }">
        <div class="row">
          <div class="col-md-7">
            <div class="row g-2">
              <div class="col-sm-4">
                <div class="stat-card p-2 text-center bg-light rounded">
                  <div class="fs-1 text-primary">114</div>
                  <div>Total Surah</div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="stat-card p-2 text-center bg-light rounded">
                  <div class="fs-1 text-success">{{ stats.meccanCount }}</div>
                  <div>Makkiyah</div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="stat-card p-2 text-center bg-light rounded">
                  <div class="fs-1 text-info">{{ stats.medinanCount }}</div>
                  <div>Madaniyah</div>
                </div>
              </div>
              <div class="col-12">
                <div class="stat-card p-2 text-center bg-light rounded">
                  <div class="fs-1 text-warning">{{ stats.totalAyahs.toLocaleString() }}</div>
                  <div>Total Ayat</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-5">
            <h6 class="mb-3">5 Surah dengan Ayat Terbanyak</h6>
            <ol class="list-group list-group-numbered">
              <li v-for="surah in stats.topSurahs" :key="surah.number" 
                  class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                  <router-link :to="`/surah/${surah.number}`" class="text-decoration-none">
                    {{ getIndonesianName(surah.englishName) }}
                  </router-link>
                </div>
                <span class="badge bg-primary rounded-pill">{{ surah.numberOfAyahs }} ayat</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Memuat...</span>
      </div>
      <p class="mt-2">Memuat Surah...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else>
      <div class="search-container">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text" 
          class="form-control form-control-lg" 
          placeholder="Cari Surah berdasarkan nama, terjemahan, atau nomor..." 
          v-model="searchQuery"
        >
      </div>
      
      <div v-if="filteredSurahs.length === 0" class="alert alert-info">
        Tidak ada Surah yang sesuai dengan pencarian Anda.
      </div>
      
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div v-for="surah in filteredSurahs" :key="surah.number" class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between">
                <span>{{ getIndonesianName(surah.englishName) }}</span>
                <span class="badge bg-primary">{{ surah.number }}</span>
              </h5>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ getIndonesianMeaning(surah.englishName) }}
              </h6>
              <p class="card-text">
                <span class="badge me-2" 
                      :class="surah.revelationType === 'Meccan' ? 'bg-warning text-dark' : 'bg-primary text-white'">
                  {{ translateRevelationType(surah.revelationType) }}
                </span>
                <span class="badge bg-info text-white">{{ surah.numberOfAyahs }} ayat</span>
              </p>
            </div>
            <div class="card-footer bg-transparent border-top-0">
              <router-link :to="`/surah/${surah.number}`" class="btn btn-outline-success w-100">
                <i class="bi bi-eye me-2"></i> Baca Surah
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="floating-controls">
      <div class="btn-group-vertical shadow">
        <button class="btn btn-primary" @click="scrollToTop" title="Kembali ke Atas">
          <i class="bi bi-arrow-up"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  margin-bottom: 2rem;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.form-control {
  padding-left: 40px;
  border-radius: 20px;
}

.card {
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.badge {
  font-weight: 400;
}

.card-body.collapse {
  display: none;
  transition: height 0.35s ease;
}

.card-header {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.card-header:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.floating-controls {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
}

.floating-controls .btn-group-vertical {
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 0.25rem;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  opacity: 0.7;
}

.floating-controls .btn-group-vertical:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.9);
}

.floating-controls .btn {
  border-radius: 0.25rem;
  background-color: rgba(13, 110, 253, 0.7);
  border-color: rgba(13, 110, 253, 0.3);
  transition: all 0.2s ease;
}

.floating-controls .btn:hover {
  background-color: rgba(13, 110, 253, 0.9);
  border-color: rgba(13, 110, 253, 0.5);
}
</style>