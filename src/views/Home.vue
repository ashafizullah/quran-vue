<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { surahNamesIndonesian } from '../utils/surahTranslations';

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
    (surahNamesIndonesian[surah.englishName] || '').toLowerCase().includes(query)
  );
});

// Function to translate revelation type
const translateRevelationType = (type: string): string => {
  return revelationTypeMap[type as keyof typeof revelationTypeMap] || type;
};

// Function to get Indonesian translation of surah name
const getIndonesianName = (englishName: string): string => {
  return surahNamesIndonesian[englishName] || englishName;
};
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Al-Quran Al-Karim</h1>
    
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
                <span>{{ surah.englishName }}</span>
                <span class="badge bg-primary">{{ surah.number }}</span>
              </h5>
              <h6 class="card-subtitle mb-2 text-muted">
                {{ getIndonesianName(surah.englishName) }}
              </h6>
              <p class="card-text">
                <span class="badge bg-secondary me-2">{{ translateRevelationType(surah.revelationType) }}</span>
                <span class="badge bg-info text-white">{{ surah.numberOfAyahs }} ayat</span>
              </p>
            </div>
            <div class="card-footer bg-transparent border-top-0">
              <router-link :to="`/surah/${surah.number}`" class="btn btn-outline-primary w-100">
                Baca Surah
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>