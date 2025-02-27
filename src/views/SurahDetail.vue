<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { surahNamesIndonesian } from '../utils/surahTranslations';

const route = useRoute();

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

const surah = ref<Surah | null>(null);
const translation = ref<Surah | null>(null);
const loading = ref(true);
const error = ref('');

// Mapping for revelation type translation
const revelationTypeMap = {
  'Meccan': 'Makkiyah',
  'Medinan': 'Madaniyah'
};

const fetchSurah = async (id: string | string[]) => {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch Arabic text
    const arabicResponse = await axios.get(`https://api.alquran.cloud/v1/surah/${id}`);
    surah.value = arabicResponse.data.data;
    
    // Fetch Indonesian translation instead of English
    const translationResponse = await axios.get(`https://api.alquran.cloud/v1/surah/${id}/id.indonesian`);
    translation.value = translationResponse.data.data;
    
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal memuat Surah. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

onMounted(() => {
  fetchSurah(route.params.id);
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchSurah(newId);
  }
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
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Memuat...</span>
      </div>
      <p class="mt-2">Memuat Surah...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else-if="surah && translation">
      <div class="mb-4">
        <router-link to="/" class="btn btn-outline-primary mb-3">
          <i class="bi bi-arrow-left"></i> Kembali ke Daftar Surah
        </router-link>
        
        <div class="text-center mb-4">
          <h1 class="text-success">{{ surah.englishName }}</h1>
          <h2 class="arabic-text fs-2">{{ surah.name }}</h2>
          <p class="text-muted">
            <strong>{{ getIndonesianName(surah.englishName) }}</strong> • 
            {{ surah.numberOfAyahs }} ayat • 
            {{ translateRevelationType(surah.revelationType) }}
          </p>
          
          <div class="bismillah text-center my-4 fs-3 arabic-text" v-if="surah.number !== 1 && surah.number !== 9">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
      </div>
      
      <div class="card mb-4" v-for="(ayah, index) in surah.ayahs" :key="ayah.number">
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <span class="badge bg-primary">Ayat {{ ayah.numberInSurah }}</span>
            <span class="badge bg-secondary">Halaman {{ ayah.page }}</span>
          </div>
          
          <p class="arabic-text text-end fs-4 mb-3">{{ ayah.text }}</p>
          
          <p v-if="translation && translation.ayahs[index]" class="mb-0">
            {{ translation.ayahs[index].text }}
          </p>
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
</style>