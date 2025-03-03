<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

interface AsmaulHusnaName {
  name: string;
  transliteration: string;
  number: number;
  en: {
    meaning: string;
  };
  id?: {
    meaning: string;
  };
}

// State
const asmaulHusna = ref<AsmaulHusnaName[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 33; // Show 33 names per page (3 pages total for 99 names)

// Indonesian translations for the names
const indonesianMeanings: Record<number, string> = {
  1: "Yang Maha Pengasih",
  2: "Yang Maha Penyayang",
  3: "Yang Maha Raja",
  4: "Yang Maha Suci",
  5: "Yang Maha Memberi Keselamatan",
  6: "Yang Maha Memberi Keamanan",
  7: "Yang Maha Pemelihara",
  8: "Yang Maha Perkasa",
  9: "Yang Maha Berkuasa",
  10: "Yang Maha Agung",
  11: "Yang Maha Pencipta",
  12: "Yang Maha Mengadakan",
  13: "Yang Maha Membentuk Rupa",
  14: "Yang Maha Pengampun",
  15: "Yang Maha Perkasa",
  16: "Yang Maha Pemberi Karunia",
  17: "Yang Maha Pemberi Rezeki",
  18: "Yang Maha Pembuka Rahmat",
  19: "Yang Maha Mengetahui",
  20: "Yang Maha Menyempitkan",
  21: "Yang Maha Melapangkan",
  22: "Yang Maha Merendahkan",
  23: "Yang Maha Meninggikan",
  24: "Yang Maha Memuliakan",
  25: "Yang Maha Menghinakan",
  26: "Yang Maha Mendengar",
  27: "Yang Maha Melihat",
  28: "Yang Maha Memutuskan Hukum",
  29: "Yang Maha Adil",
  30: "Yang Maha Lembut",
  31: "Yang Maha Mengetahui",
  32: "Yang Maha Penyantun",
  33: "Yang Maha Agung",
  34: "Yang Maha Pengampun",
  35: "Yang Maha Mensyukuri",
  36: "Yang Maha Tinggi",
  37: "Yang Maha Besar",
  38: "Yang Maha Memelihara",
  39: "Yang Maha Pemberi Kecukupan",
  40: "Yang Maha Membuat Perhitungan",
  41: "Yang Maha Luhur",
  42: "Yang Maha Pemurah",
  43: "Yang Maha Mengawasi",
  44: "Yang Maha Mengabulkan",
  45: "Yang Maha Luas",
  46: "Yang Maha Bijaksana",
  47: "Yang Maha Mengasihi",
  48: "Yang Maha Mulia",
  49: "Yang Maha Membangkitkan",
  50: "Yang Maha Menyaksikan",
  51: "Yang Maha Benar",
  52: "Yang Maha Mentadbir",
  53: "Yang Maha Kuat",
  54: "Yang Maha Kukuh",
  55: "Yang Maha Pelindung",
  56: "Yang Maha Terpuji",
  57: "Yang Maha Penghitung",
  58: "Yang Maha Memulai",
  59: "Yang Maha Mengembalikan",
  60: "Yang Maha Menghidupkan",
  61: "Yang Maha Mematikan",
  62: "Yang Maha Hidup",
  63: "Yang Maha Berdiri Sendiri",
  64: "Yang Maha Penemu",
  65: "Yang Maha Mulia",
  66: "Yang Maha Tunggal",
  67: "Yang Maha Esa",
  68: "Yang Maha Dibutuhkan",
  69: "Yang Maha Kuasa",
  70: "Yang Maha Berkuasa",
  71: "Yang Maha Mendahulukan",
  72: "Yang Maha Mengakhirkan",
  73: "Yang Maha Awal",
  74: "Yang Maha Akhir",
  75: "Yang Maha Nyata",
  76: "Yang Maha Ghaib",
  77: "Yang Maha Menguasai",
  78: "Yang Maha Tinggi",
  79: "Yang Maha Dermawan",
  80: "Yang Maha Penerima Taubat",
  81: "Yang Maha Pemberi Balasan",
  82: "Yang Maha Pemaaf",
  83: "Yang Maha Pengasih",
  84: "Yang Maha Maha Penguasa Kerajaan (Semesta)",
  85: "Yang Maha Memiliki Kebesaran dan Kemuliaan",
  86: "Yang Maha Adil",
  87: "Yang Maha Mengumpulkan",
  88: "Yang Maha Berkecukupan",
  89: "Yang Maha Memberi Kekayaan",
  90: "Yang Maha Mencegah",
  91: "Yang Maha Pemberi Kemudharatan",
  92: "Yang Maha Pemberi Manfaat",
  93: "Yang Maha Pemberi Cahaya",
  94: "Yang Maha Pemberi Petunjuk",
  95: "Yang Maha Pencipta",
  96: "Yang Maha Kekal",
  97: "Yang Maha Pewaris",
  98: "Yang Maha Cerdas",
  99: "Yang Maha Sabar"
};

// Fetch Asmaul Husna data from API
const fetchAsmaulHusna = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.get('https://api.aladhan.com/v1/asmaAlHusna');
    
    if (response.data.code === 200) {
      // Add Indonesian translations to the data
      asmaulHusna.value = response.data.data.map((name: AsmaulHusnaName) => ({
        ...name,
        id: {
          meaning: indonesianMeanings[name.number] || name.en.meaning
        }
      }));
    } else {
      error.value = 'Gagal memuat data Asmaul Husna.';
    }
    
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal memuat data Asmaul Husna. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

// Filter names based on search query
const filteredNames = computed(() => {
  if (!searchQuery.value) {
    return asmaulHusna.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return asmaulHusna.value.filter((name) => 
    name.name.includes(query) ||
    name.transliteration.toLowerCase().includes(query) ||
    name.en.meaning.toLowerCase().includes(query) ||
    (name.id?.meaning && name.id.meaning.toLowerCase().includes(query)) ||
    name.number.toString().includes(query)
  );
});

// Paginated names
const paginatedNames = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredNames.value.slice(startIndex, endIndex);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredNames.value.length / itemsPerPage);
});

// Navigate to a specific page
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

// Fetch data on component mount
onMounted(() => {
  fetchAsmaulHusna();
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Asmaul Husna</h1>
    
    <div class="card mb-4 shadow-sm">
      <div class="card-body">
        <h5 class="card-title text-success">99 Nama Allah Yang Mulia</h5>
        <p class="card-text">
          Asmaul Husna adalah 99 nama Allah SWT yang indah dan agung, yang menggambarkan sifat-sifat Allah sebagai Tuhan yang Maha Esa.
          Mempelajari dan mengamalkan Asmaul Husna merupakan salah satu cara untuk lebih mengenal Allah SWT.
        </p>
      </div>
    </div>
    
    <div class="search-container mb-4">
      <div class="input-group">
        <span class="input-group-text bg-success text-white">
          <i class="bi bi-search"></i>
        </span>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Cari Asmaul Husna berdasarkan nama, arti, atau nomor..." 
          v-model="searchQuery"
        >
        <button 
          v-if="searchQuery" 
          class="btn btn-outline-secondary" 
          type="button"
          @click="clearSearch"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Memuat...</span>
      </div>
      <p class="mt-2">Memuat Asmaul Husna...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-else>
      <div v-if="filteredNames.length === 0" class="alert alert-info">
        Tidak ada nama yang sesuai dengan pencarian Anda.
      </div>
      
      <div v-else>
        <div class="row row-cols-1 row-cols-md-3 g-4">
          <div v-for="name in paginatedNames" :key="name.number" class="col">
            <div class="card h-100 name-card">
              <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <span class="badge bg-light text-success rounded-pill">{{ name.number }}</span>
                <h5 class="m-0">{{ name.transliteration }}</h5>
              </div>
              <div class="card-body">
                <h2 class="arabic-text text-center mb-3">{{ name.name }}</h2>
                <div class="meanings">
                  <p class="mb-1">
                    <i class="bi bi-translate text-success me-2"></i>
                    <strong>Arti:</strong> {{ name.id?.meaning }}
                  </p>
                  <p class="text-muted small mb-0">
                    <i class="bi bi-globe me-2"></i>
                    <strong>English:</strong> {{ name.en.meaning }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <nav aria-label="Page navigation" class="mt-4">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="goToPage(currentPage - 1)">
                <i class="bi bi-chevron-left"></i>
              </a>
            </li>
            
            <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
              <a class="page-link" href="#" @click.prevent="goToPage(page)">{{ page }}</a>
            </li>
            
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="goToPage(currentPage + 1)">
                <i class="bi bi-chevron-right"></i>
              </a>
            </li>
          </ul>
        </nav>
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
.arabic-text {
  font-family: "Traditional Arabic", "Scheherazade New", serif;
  line-height: 1.5;
  font-size: 2rem;
}

.name-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 0.5rem;
  overflow: hidden;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.name-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.name-card .card-header {
  border-bottom: none;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.name-card .badge {
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
}

.name-card .card-body {
  padding: 1.5rem;
}

.meanings {
  border-top: 1px dashed #dee2e6;
  padding-top: 1rem;
}

.pagination .page-link {
  color: var(--success);
}

.pagination .page-item.active .page-link {
  background-color: var(--success);
  border-color: var(--success);
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