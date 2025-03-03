<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

interface PrayerTime {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface TimingsData {
  timings: PrayerTime;
  date: {
    readable: string;
    hijri: {
      date: string;
      month: {
        en: string;
        ar: string;
      };
      year: string;
      day: string;
    };
    gregorian: {
      date: string;
      month: {
        en: string;
      };
      year: string;
      day: string;
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      name: string;
    };
  };
}

// Daftar kota-kota besar di Indonesia
const indonesianCities = [
  { name: 'Jakarta', address: 'Jakarta,ID' },
  { name: 'Surabaya', address: 'Surabaya,ID' },
  { name: 'Bandung', address: 'Bandung,ID' },
  { name: 'Medan', address: 'Medan,ID' },
  { name: 'Semarang', address: 'Semarang,ID' },
  { name: 'Makassar', address: 'Makassar,ID' },
  { name: 'Palembang', address: 'Palembang,ID' },
  { name: 'Tangerang', address: 'Tangerang,ID' },
  { name: 'Depok', address: 'Depok,ID' },
  { name: 'Yogyakarta', address: 'Yogyakarta,ID' },
  { name: 'Aceh', address: 'Aceh,ID' },
  { name: 'Padang', address: 'Padang,ID' },
  { name: 'Manado', address: 'Manado,ID' },
  { name: 'Denpasar', address: 'Denpasar,ID' },
  { name: 'Balikpapan', address: 'Balikpapan,ID' },
  { name: 'Banjarmasin', address: 'Banjarmasin,ID' },
  { name: 'Pontianak', address: 'Pontianak,ID' },
  { name: 'Malang', address: 'Malang,ID' },
  { name: 'Pekanbaru', address: 'Pekanbaru,ID' },
  { name: 'Samarinda', address: 'Samarinda,ID' },
  { name: 'Batam', address: 'Batam,ID' },
];

interface CalculationMethod {
  id: number;
  name: string;
  params: {
    Fajr: number;
    Isha: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface Methods {
  [key: string]: CalculationMethod;
}

// Data dan state
const selectedCity = ref(indonesianCities[0]);
const calculationMethods = ref<Methods>({});
const selectedMethod = ref(20); // Default metode 20 (Universal untuk Indonesia)
const prayerTimesData = ref<TimingsData | null>(null);
const loading = ref(false);
const error = ref('');
const selectedDate = ref(new Date().toISOString().split('T')[0]); // Format YYYY-MM-DD
const monthlyData = ref<TimingsData[]>([]);
const showMonthlyView = ref(false);

// Mengambil data waktu shalat menggunakan timingsByAddress
const fetchPrayerTimes = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Format tanggal untuk API: DD-MM-YYYY
    const formattedDate = selectedDate.value.split('-').reverse().join('-');
    
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByAddress/${formattedDate}`, {
      params: {
        address: selectedCity.value.address,
        method: selectedMethod.value
      }
    });
    
    prayerTimesData.value = response.data.data;
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal memuat jadwal shalat. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

// Mengambil data waktu shalat untuk satu bulan
const fetchMonthlyPrayerTimes = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Mendapatkan tahun dan bulan dari tanggal yang dipilih
    const [year, month] = selectedDate.value.split('-');
    
    const response = await axios.get('https://api.aladhan.com/v1/calendarByAddress', {
      params: {
        address: selectedCity.value.address,
        method: selectedMethod.value,
        month,
        year
      }
    });
    
    monthlyData.value = response.data.data;
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal memuat jadwal shalat bulanan. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

// Format waktu - mengambil hanya jam dan menit (membuang detik dan timezone)
const formatTime = (time: string) => {
  if (!time) return '';
  
  // Jika waktu memiliki format seperti "HH:MM (GMT+X)" atau "HH:MM:SS"
  // Ambil hanya bagian jam dan menit
  return time.split(' ')[0].split(':').slice(0, 2).join(':');
};

// Mendapatkan nama waktu shalat dalam Bahasa Indonesia
const getPrayerNameIndonesian = (prayerName: string) => {
  const nameMap: Record<string, string> = {
    'Fajr': 'Subuh',
    'Sunrise': 'Terbit',
    'Dhuhr': 'Dzuhur',
    'Asr': 'Ashar',
    'Maghrib': 'Maghrib',
    'Isha': 'Isya'
  };
  
  return nameMap[prayerName] || prayerName;
};

// Mendapatkan nama bulan dalam Bahasa Indonesia
const getIndonesianMonth = (monthNumber: number) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 
    'Mei', 'Juni', 'Juli', 'Agustus', 
    'September', 'Oktober', 'November', 'Desember'
  ];
  
  return months[monthNumber - 1] || '';
};

// Toggle tampilan bulanan
const toggleMonthlyView = () => {
  showMonthlyView.value = !showMonthlyView.value;
  
  if (showMonthlyView.value) {
    fetchMonthlyPrayerTimes();
  }
};

// Memuat data waktu shalat saat komponen dimuat
onMounted(() => {
  fetchCalculationMethods().then(() => {
    fetchPrayerTimes();
  });
});

// Watch perubahan kota, metode, atau tanggal
watch([selectedCity, selectedMethod, selectedDate], () => {
  fetchPrayerTimes();
  
  if (showMonthlyView.value) {
    fetchMonthlyPrayerTimes();
  }
});

// Fungsi untuk mendapatkan gaya warna untuk waktu shalat
const getPrayerTimeClass = (prayerName: string) => {
  const classMap: Record<string, string> = {
    'Fajr': 'bg-primary',
    'Sunrise': 'bg-warning text-dark',
    'Dhuhr': 'bg-success',
    'Asr': 'bg-info',
    'Maghrib': 'bg-danger',
    'Isha': 'bg-secondary'
  };
  
  return classMap[prayerName] || 'bg-dark';
};

// Format tanggal Indonesia
const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return '';
  
  const [year, month, day] = dateStr.split('-');
  return `${day} ${getIndonesianMonth(parseInt(month))} ${year}`;
};

// Fungsi untuk mendapatkan nama metode dari ID
const getMethodName = (methodId: number): string => {
  // Cari metode berdasarkan ID
  for (const key in calculationMethods.value) {
    if (calculationMethods.value[key].id === methodId) {
      return calculationMethods.value[key].name;
    }
  }
  
  // Fallback jika tidak ditemukan
  return `Metode ${methodId}`;
};

// Mengambil data metode perhitungan
const fetchCalculationMethods = async () => {
  try {
    const response = await axios.get('https://api.aladhan.com/v1/methods');
    if (response.data.code === 200) {
      calculationMethods.value = response.data.data;
      
      // Tambahkan metode 20 secara manual karena tidak selalu ada di API
      if (!calculationMethods.value['20']) {
        calculationMethods.value['20'] = {
          id: 20,
          name: "Universal Method untuk Indonesia",
          params: {
            Fajr: 18,
            Isha: 18
          }
        };
      }
    }
  } catch (err) {
    console.error('Gagal memuat metode perhitungan:', err);
    // Tambahkan default method jika gagal
    calculationMethods.value = {
      '20': {
        id: 20,
        name: "Universal Method untuk Indonesia",
        params: {
          Fajr: 18,
          Isha: 18
        }
      }
    };
  }
};

const isToday = (dateString: string): boolean => {
  const today = new Date();
  const checkDate = new Date(dateString);
  
  return today.getDate() === checkDate.getDate() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getFullYear() === checkDate.getFullYear();
};

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Jadwal Shalat</h1>
    
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="citySelect" class="form-label">Pilih Kota:</label>
            <select id="citySelect" class="form-select" v-model="selectedCity">
              <option v-for="city in indonesianCities" :key="city.name" :value="city">
                {{ city.name }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="methodSelect" class="form-label">Metode Perhitungan:</label>
            <select id="methodSelect" class="form-select" v-model="selectedMethod">
              <option v-for="(method, key) in calculationMethods" :key="key" :value="method.id">
                {{ method.name }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="dateSelect" class="form-label">Tanggal:</label>
            <input type="date" id="dateSelect" class="form-control" v-model="selectedDate">
          </div>
        </div>
        
        <div class="mt-3 text-end">
          <button @click="toggleMonthlyView" class="btn btn-outline-success">
            <i class="bi" :class="showMonthlyView ? 'bi-calendar-day' : 'bi-calendar-month'"></i>
            {{ showMonthlyView ? 'Tampilkan Harian' : 'Tampilkan Bulanan' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Memuat...</span>
      </div>
      <p class="mt-2">Memuat jadwal shalat...</p>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Tampilan Harian -->
    <div v-else-if="!showMonthlyView && prayerTimesData" class="prayer-times-daily">
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">
            <i class="bi bi-calendar-check me-2"></i>
            Jadwal Shalat {{ selectedCity.name }} - {{ formatIndonesianDate(selectedDate) }}
          </h5>
        </div>
        <div class="card-body">
          <div class="alert alert-warning">
            <i class="bi bi-info-circle-fill me-2"></i>
            <small>Perhatian: Waktu shalat yang ditampilkan adalah perkiraan. Mungkin terdapat perbedaan dengan jadwal lokal. Silakan verifikasi dengan jadwal resmi setempat.</small>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <strong>Tanggal Hijriah:</strong> 
                {{ prayerTimesData.date.hijri.day }} {{ prayerTimesData.date.hijri.month.ar }}
                {{ prayerTimesData.date.hijri.year }}
              </div>
              <div>
                <strong>Lokasi:</strong> {{ selectedCity.name }}, Indonesia
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <strong>Metode:</strong> {{ getMethodName(selectedMethod) }}
              </div>
              <div>
                <strong>Zona Waktu:</strong> {{ prayerTimesData.meta.timezone }}
              </div>
            </div>
          </div>
          
          <hr>
          
          <div class="row row-cols-1 row-cols-md-3 g-4 mt-2">
            <div class="col" v-for="prayerName in ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']" :key="prayerName">
              <div class="card h-100 prayer-time-card">
                <div class="card-header text-white" :class="getPrayerTimeClass(prayerName)">
                  <h5 class="mb-0">{{ getPrayerNameIndonesian(prayerName) }}</h5>
                </div>
                <div class="card-body text-center">
                  <h3 class="mb-1">{{ formatTime(prayerTimesData.timings[prayerName as keyof PrayerTime]) }}</h3>
                  <p class="text-muted mb-0">{{ prayerTimesData.timings[prayerName as keyof PrayerTime].split(' ')[1] || '' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tampilan Bulanan -->
    <div v-else-if="showMonthlyView && monthlyData.length > 0" class="prayer-times-monthly">
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">
            <i class="bi bi-calendar-month me-2"></i>
            Jadwal Shalat Bulanan {{ selectedCity.name }} - 
            {{ getIndonesianMonth(parseInt(selectedDate.split('-')[1])) }} {{ selectedDate.split('-')[0] }}
          </h5>
        </div>
        <div class="card-body">
          <div class="alert alert-warning">
            <i class="bi bi-info-circle-fill me-2"></i>
            <small>Perhatian: Waktu shalat yang ditampilkan adalah perkiraan. Mungkin terdapat perbedaan dengan jadwal lokal. Silakan verifikasi dengan jadwal resmi setempat.</small>
          </div>
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-success">
                <tr>
                  <th>Tanggal</th>
                  <th>Subuh</th>
                  <th>Terbit</th>
                  <th>Dzuhur</th>
                  <th>Ashar</th>
                  <th>Maghrib</th>
                  <th>Isya</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in monthlyData" :key="day.date.gregorian.date" 
                    :class="{'today-highlight': isToday(day.date.gregorian.date)}">
                  <td>
                    <strong>{{ day.date.gregorian.day }}/{{ day.date.gregorian.month.en.substring(0, 3) }}</strong>
                    <br>
                    <small class="text-muted">{{ day.date.hijri.day }} {{ day.date.hijri.month.ar }}</small>
                  </td>
                  <td>{{ formatTime(day.timings.Fajr) }}</td>
                  <td>{{ formatTime(day.timings.Sunrise) }}</td>
                  <td>{{ formatTime(day.timings.Dhuhr) }}</td>
                  <td>{{ formatTime(day.timings.Asr) }}</td>
                  <td>{{ formatTime(day.timings.Maghrib) }}</td>
                  <td>{{ formatTime(day.timings.Isha) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="alert alert-info">
      Tidak ada data jadwal shalat yang tersedia.
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
.prayer-time-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.prayer-time-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: 500;
}

table {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.8rem;
  }
}

.today-highlight {
  background-color: rgba(40, 167, 69, 0.15) !important;
  font-weight: bold;
  position: relative;
}

.today-highlight td {
  border-top: 2px solid #28a745;
  border-bottom: 2px solid #28a745;
}

.today-highlight td:first-child {
  border-left: 2px solid #28a745;
}

.today-highlight td:last-child {
  border-right: 2px solid #28a745;
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