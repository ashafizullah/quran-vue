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

// Daftar kota-kota besar di Indonesia dengan koordinat
const indonesianCities = [
  { name: 'Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { name: 'Surabaya', latitude: -7.2575, longitude: 112.7521 },
  { name: 'Bandung', latitude: -6.9175, longitude: 107.6191 },
  { name: 'Medan', latitude: 3.5952, longitude: 98.6722 },
  { name: 'Semarang', latitude: -6.9932, longitude: 110.4203 },
  { name: 'Makassar', latitude: -5.1477, longitude: 119.4327 },
  { name: 'Palembang', latitude: -2.9761, longitude: 104.7754 },
  { name: 'Tangerang', latitude: -6.1781, longitude: 106.6305 },
  { name: 'Depok', latitude: -6.4025, longitude: 106.7942 },
  { name: 'Yogyakarta', latitude: -7.7971, longitude: 110.3688 },
  { name: 'Aceh', latitude: 4.6951, longitude: 96.7494 },
  { name: 'Padang', latitude: -0.9471, longitude: 100.4172 },
  { name: 'Manado', latitude: 1.4748, longitude: 124.8421 },
  { name: 'Denpasar', latitude: -8.6705, longitude: 115.2126 },
  { name: 'Balikpapan', latitude: -1.2379, longitude: 116.8529 },
  { name: 'Banjarmasin', latitude: -3.3186, longitude: 114.5944 },
  { name: 'Pontianak', latitude: 0.0263, longitude: 109.3425 },
  { name: 'Malang', latitude: -7.9666, longitude: 112.6326 },
  { name: 'Pekanbaru', latitude: 0.5103, longitude: 101.4478 },
  { name: 'Samarinda', latitude: -0.4948, longitude: 117.1436 },
  { name: 'Batam', latitude: 1.1301, longitude: 104.0529 },
];

// Data dan state
const selectedCity = ref(indonesianCities[0]);
const calculationMethod = ref(20); // Default: Kementerian Agama RI
const prayerTimesData = ref<TimingsData | null>(null);
const loading = ref(false);
const error = ref('');
const selectedDate = ref(new Date().toISOString().split('T')[0]); // Format YYYY-MM-DD
const monthlyData = ref<TimingsData[]>([]);
const showMonthlyView = ref(false);

// Mengambil data waktu shalat
const fetchPrayerTimes = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.get('https://api.aladhan.com/v1/timings', {
      params: {
        latitude: selectedCity.value.latitude,
        longitude: selectedCity.value.longitude,
        method: calculationMethod.value,
        date: selectedDate.value,
        //tune: '5,3,5,7,9,-1,0,8,-6' //Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
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
    
    const response = await axios.get('https://api.aladhan.com/v1/calendar', {
      params: {
        latitude: selectedCity.value.latitude,
        longitude: selectedCity.value.longitude,
        method: calculationMethod.value,
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
  fetchPrayerTimes();
});

// Watch perubahan kota, metode perhitungan, atau tanggal
watch([selectedCity, calculationMethod, selectedDate], () => {
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
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <strong>Tanggal Hijriah:</strong> 
                {{ prayerTimesData.date.hijri.day }} {{ prayerTimesData.date.hijri.month.ar }}
                {{ prayerTimesData.date.hijri.year }}
              </div>
              <div>
                <strong>Lokasi:</strong> {{ selectedCity.name }}
                ({{ prayerTimesData.meta.latitude }}, {{ prayerTimesData.meta.longitude }})
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <strong>Metode: </strong> Kementerian Agama Republik Indonesia
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
                <tr v-for="day in monthlyData" :key="day.date.gregorian.date">
                  <td>
                    <strong>{{ day.date.gregorian.day }}/{{ day.date.gregorian.month.number }}</strong>
                    <br>
                    <small class="text-muted">{{ day.date.hijri.day }} {{ day.date.hijri.month.ar }}</small>
                  </td>
                  <td>{{ day.timings.Fajr.split(' ')[0] }}</td>
                  <td>{{ day.timings.Sunrise.split(' ')[0] }}</td>
                  <td>{{ day.timings.Dhuhr.split(' ')[0] }}</td>
                  <td>{{ day.timings.Asr.split(' ')[0] }}</td>
                  <td>{{ day.timings.Maghrib.split(' ')[0] }}</td>
                  <td>{{ day.timings.Isha.split(' ')[0] }}</td>
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
</style>