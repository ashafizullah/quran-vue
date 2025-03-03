<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

interface QiblaData {
  latitude: number;
  longitude: number;
  direction: number;
}

const qiblaData = ref<QiblaData | null>(null);
const loading = ref(false);
const error = ref('');
const locationStatus = ref('');
const userLocation = ref<{ latitude: number; longitude: number } | null>(null);
const showCompass = ref(false);
const compassRotation = ref(0);
const deviceHeading = ref(0);
const isLiveCompass = ref(false);
const hasOrientationPermission = ref<boolean | null>(null);
const orientationSupported = ref(false);
const isLiveHeadingActive = ref(false);
const isNearQiblaDirection = ref(false);
const qiblaTolerance = 5;

// Load qibla direction based on coordinates
const fetchQiblaDirection = async (latitude: number, longitude: number) => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
    
    if (response.data.code === 200) {
      qiblaData.value = response.data.data;
      // Set compass rotation based on qibla direction
      compassRotation.value = response.data.data.direction;
      showCompass.value = true;
    } else {
      error.value = 'Gagal mendapatkan arah kiblat. Silakan coba lagi.';
    }
    
    loading.value = false;
  } catch (err) {
    error.value = 'Gagal terhubung ke layanan arah kiblat. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

// Try to get user's current location
const getUserLocation = () => {
  locationStatus.value = 'Meminta izin lokasi...';
  
  if (!navigator.geolocation) {
    locationStatus.value = '';
    error.value = 'Geolocation tidak didukung oleh browser Anda.';
    return;
  }
  
  loading.value = true;
  
  navigator.geolocation.getCurrentPosition(
    // Success callback
    (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      locationStatus.value = `Lokasi ditemukan: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      
      // Now fetch qibla direction based on these coordinates
      fetchQiblaDirection(position.coords.latitude, position.coords.longitude);
    },
    // Error callback
    (positionError) => {
      loading.value = false;
      locationStatus.value = '';
      
      switch (positionError.code) {
        case positionError.PERMISSION_DENIED:
          error.value = 'Izin lokasi ditolak. Mohon izinkan akses lokasi untuk menampilkan arah kiblat.';
          break;
        case positionError.POSITION_UNAVAILABLE:
          error.value = 'Informasi lokasi tidak tersedia.';
          break;
        case positionError.TIMEOUT:
          error.value = 'Waktu permintaan lokasi habis.';
          break;
        default:
          error.value = 'Terjadi kesalahan saat mendapatkan lokasi.';
      }
    },
    // Options
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

// Support for manual location input
const manualLatitude = ref('');
const manualLongitude = ref('');
const showManualInput = ref(false);

const toggleManualInput = () => {
  showManualInput.value = !showManualInput.value;
};

const submitManualLocation = () => {
  const lat = parseFloat(manualLatitude.value);
  const lng = parseFloat(manualLongitude.value);
  
  if (isNaN(lat) || isNaN(lng)) {
    error.value = 'Koordinat tidak valid. Pastikan format angka benar.';
    return;
  }
  
  if (lat < -90 || lat > 90) {
    error.value = 'Latitude harus berada di antara -90 dan 90.';
    return;
  }
  
  if (lng < -180 || lng > 180) {
    error.value = 'Longitude harus berada di antara -180 dan 180.';
    return;
  }
  
  userLocation.value = {
    latitude: lat,
    longitude: lng
  };
  
  locationStatus.value = `Lokasi manual: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  fetchQiblaDirection(lat, lng);
};

// Some cities in Indonesia with their coordinates
const indonesianCities = [
  { name: 'Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { name: 'Surabaya', latitude: -7.2575, longitude: 112.7521 },
  { name: 'Bandung', latitude: -6.9175, longitude: 107.6191 },
  { name: 'Medan', latitude: 3.5952, longitude: 98.6722 },
  { name: 'Semarang', latitude: -6.9932, longitude: 110.4203 },
  { name: 'Makassar', latitude: -5.1477, longitude: 119.4327 },
  { name: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
  { name: 'Palembang', latitude: -2.9761, longitude: 104.7754 },
  { name: 'Aceh', latitude: 4.6951, longitude: 96.7494 },
  { name: 'Denpasar', latitude: -8.6705, longitude: 115.2126 }
];

const selectCity = (city: { name: string; latitude: number; longitude: number }) => {
  userLocation.value = {
    latitude: city.latitude,
    longitude: city.longitude
  };
  
  locationStatus.value = `Lokasi: ${city.name} (${city.latitude.toFixed(6)}, ${city.longitude.toFixed(6)})`;
  fetchQiblaDirection(city.latitude, city.longitude);
};

// Auto-detect location when component mounts
onMounted(() => {
  getUserLocation();
  
  // Check if device orientation is supported
  if (window.DeviceOrientationEvent) {
    orientationSupported.value = true;
  }
});

// Clean up event listeners when component unmounts
onBeforeUnmount(() => {
  if (isLiveCompass.value) {
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
  }
});

const toggleLiveHeading = () => {
  if (!orientationSupported.value) {
    error.value = 'Maaf, browser Anda tidak mendukung sensor orientasi perangkat.';
    return;
  }
  
  if (isLiveHeadingActive.value) {
    // Nonaktifkan
    isLiveHeadingActive.value = false;
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
  } else {
    // Aktifkan
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS 13+ requires permission
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            isLiveHeadingActive.value = true;
            hasOrientationPermission.value = true;
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          } else {
            hasOrientationPermission.value = false;
            error.value = 'Izin untuk mengakses sensor orientasi perangkat ditolak.';
          }
        })
        .catch((e: Error) => {
          console.error(e);
          hasOrientationPermission.value = false;
          error.value = 'Terjadi kesalahan saat meminta izin sensor orientasi.';
        });
    } else {
      // Browser lain yang tidak memerlukan izin
      isLiveHeadingActive.value = true;
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  }
};

// Modifikasi fungsi handleDeviceOrientation untuk juga mengecek arah kiblat
const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
  // alpha memberi arah kompas (0-360)
  if (event.alpha !== null) {
    deviceHeading.value = event.alpha;
    
    // Cek apakah heading mendekati arah kiblat
    if (qiblaData.value) {
      const qiblaDirection = qiblaData.value.direction;
      const currentHeading = deviceHeading.value;
      
      // Menghitung perbedaan sudut dengan mempertimbangkan wraparound di 0/360
      let angleDiff = Math.abs(qiblaDirection - currentHeading);
      angleDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
      
      // Update status apakah dekat dengan arah kiblat
      isNearQiblaDirection.value = angleDiff <= qiblaTolerance;
    }
    
    // Jika belum memiliki permission, event ini terpicu artinya kita mendapatkannya
    if (hasOrientationPermission.value === null) {
      hasOrientationPermission.value = true;
    }
  }
};

// Fungsi untuk memberikan instruksi arah ke pengguna
const getQiblaGuidance = () => {
  if (!qiblaData.value || deviceHeading.value === null) return '';
  
  const qiblaDirection = qiblaData.value.direction;
  const currentHeading = deviceHeading.value;
  
  // Tentukan arah putar yang terpendek
  let angleDiff = qiblaDirection - currentHeading;
  
  // Normalisasi ke range -180 hingga 180 derajat
  if (angleDiff > 180) angleDiff -= 360;
  if (angleDiff < -180) angleDiff += 360;
  
  if (Math.abs(angleDiff) <= qiblaTolerance) {
    return 'Arah Anda sudah tepat menghadap kiblat.';
  }
  
  // Beri instruksi untuk berputar
  if (angleDiff > 0) {
    return `Putar ke KANAN sekitar ${Math.round(angleDiff)}° untuk menghadap kiblat.`;
  } else {
    return `Putar ke KIRI sekitar ${Math.abs(Math.round(angleDiff))}° untuk menghadap kiblat.`;
  }
};

// Perbarui onBeforeUnmount untuk membersihkan event listener
onBeforeUnmount(() => {
  if (isLiveHeadingActive.value) {
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
  }
});
</script>

<template>
  <div>
    <h1 class="text-center mb-4 text-success">Arah Kiblat</h1>
    
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">
          <i class="bi bi-compass me-2"></i>
          Temukan Arah Kiblat
        </h5>
      </div>
      <div class="card-body">
        <p class="mb-3">
          Fitur ini menggunakan lokasi Anda untuk menentukan arah kiblat. Anda dapat menggunakan lokasi saat ini atau memilih kota tertentu.
        </p>
        
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <button @click="getUserLocation" class="btn btn-primary w-100" :disabled="loading">
              <i class="bi bi-geo-alt-fill me-2"></i>
              Gunakan Lokasi Saat Ini
            </button>
          </div>
          <div class="col-md-6">
            <button @click="toggleManualInput" class="btn btn-outline-secondary w-100">
              <i class="bi bi-pencil-square me-2"></i>
              {{ showManualInput ? 'Sembunyikan Input Manual' : 'Input Koordinat Manual' }}
            </button>
          </div>
        </div>
        
        <!-- Manual input form -->
        <div v-if="showManualInput" class="card mb-4">
          <div class="card-body">
            <h6 class="card-title">Input Koordinat Manual</h6>
            <div class="row g-3">
              <div class="col-md-5">
                <label for="latitude" class="form-label">Latitude</label>
                <input 
                  type="text" 
                  id="latitude" 
                  class="form-control" 
                  v-model="manualLatitude"
                  placeholder="-6.2088"
                >
              </div>
              <div class="col-md-5">
                <label for="longitude" class="form-label">Longitude</label>
                <input 
                  type="text" 
                  id="longitude" 
                  class="form-control" 
                  v-model="manualLongitude"
                  placeholder="106.8456"
                >
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button @click="submitManualLocation" class="btn btn-success w-100">Cari</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- City selection -->
        <div class="card mb-4">
          <div class="card-header bg-light">
            <h6 class="mb-0">Pilih Kota di Indonesia</h6>
          </div>
          <div class="card-body">
            <div class="row row-cols-2 row-cols-md-5 g-2">
              <div v-for="city in indonesianCities" :key="city.name" class="col">
                <button 
                  @click="selectCity(city)" 
                  class="btn btn-outline-success w-100 h-100"
                  :disabled="loading"
                >
                  {{ city.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Location status and error messages -->
        <div v-if="locationStatus" class="alert alert-info">{{ locationStatus }}</div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
        <!-- Loading indicator -->
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Memuat...</span>
          </div>
          <p class="mt-2">Mendapatkan arah kiblat...</p>
        </div>
        
        <!-- Qibla direction results -->
        <div v-if="qiblaData && !loading" class="kiblat-indicator mt-4">
            <div class="card">
                <div class="card-header bg-success text-white">
                <h5 class="mb-0">Arah Kiblat</h5>
                </div>
                <div class="card-body text-center">
                <!-- Informasi arah kiblat -->
                <h2 class="mb-3">{{ qiblaData.direction.toFixed(2) }}°</h2>
                <p class="mb-2">Arah kiblat dari lokasi Anda adalah {{ getDirection(qiblaData.direction) }}</p>
                
                <hr class="my-4">
                
                <!-- Tombol aktivasi sensor -->
                <button @click="toggleLiveHeading" class="btn btn-lg mb-4" 
                    :class="isLiveHeadingActive ? 'btn-success' : 'btn-outline-success'">
                    <i class="bi" :class="isLiveHeadingActive ? 'bi-compass-fill' : 'bi-compass'"></i>
                    {{ isLiveHeadingActive ? 'Sensor Arah Aktif' : 'Aktifkan Sensor Arah' }}
                </button>
                
                <!-- Indikator heading saat aktif -->
                <div v-if="isLiveHeadingActive" class="heading-indicator mb-4">
                    <div class="heading-circle">
                    <div class="heading-value">{{ Math.round(deviceHeading) }}°</div>
                    </div>
                    
                    <!-- Status arah kiblat -->
                    <div class="qibla-status mt-3">
                    <div v-if="isNearQiblaDirection" class="alert alert-success">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        <strong>Anda menghadap kiblat!</strong>
                    </div>
                    <div v-else class="alert alert-warning">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        <span>
                        {{ getQiblaGuidance() }}
                        </span>
                    </div>
                    </div>
                </div>
                
                <!-- Petunjuk pengguna -->
                <div v-if="isLiveHeadingActive" class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Pegang perangkat Anda dengan layar menghadap ke atas dan putar perlahan sampai 
                    arah perangkat menuju {{ Math.round(qiblaData.direction) }}°.
                </div>
                
                <!-- Lokasi pengguna -->
                <div class="mt-4">
                    <p class="mb-1"><strong>Lokasi Anda:</strong></p>
                    <p>Latitude: {{ qiblaData.latitude.toFixed(6) }}</p>
                    <p>Longitude: {{ qiblaData.longitude.toFixed(6) }}</p>
                </div>
                
                <!-- Peringatan jika sensor tidak didukung -->
                <div v-if="isLiveHeadingActive && !orientationSupported" class="alert alert-danger mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Perangkat Anda tidak mendukung sensor orientasi. Fitur ini tidak akan berfungsi.
                </div>
                
                <!-- Peringatan jika izin ditolak -->
                <div v-if="isLiveHeadingActive && !hasOrientationPermission && hasOrientationPermission !== null" 
                    class="alert alert-warning mt-3">
                    <i class="bi bi-shield-exclamation me-2"></i>
                    Izin sensor orientasi ditolak. Sensor arah tidak dapat diaktifkan.
                </div>
                </div>
            </div>
            </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Helper function to get cardinal direction from degrees
function getDirection(degrees: number): string {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
</script>

<style scoped>
.heading-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: #28a745;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.heading-value {
  font-size: 2.5rem;
  font-weight: bold;
}

/* Animasi ketika mendekati arah kiblat */
.heading-circle.near-qibla {
  background-color: #ffc107;
  transform: scale(1.05);
}

.heading-circle.on-qibla {
  background-color: #28a745;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(40, 167, 69, 0.5);
}

.qibla-status {
  margin-top: 1rem;
}
</style>