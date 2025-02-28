<script setup lang="ts">
// src/views/Changelog.vue
</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h1 class="text-center mb-4 text-success">Changelog</h1>
            
            <div class="timeline">
              <!-- Version 1.2.0 -->
              <div class="timeline-item">
              <div class="timeline-date">
                  <span class="badge bg-success">28 Februari 2025</span>
              </div>
              <div class="timeline-content">
                  <h4>Versi 1.2.0</h4>
                  <ul class="list-group mb-3">
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Ditambahkan tombol untuk memperbesar dan memperkecil ukuran teks
                  </li>
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Implementasi fitur untuk fokus pada ayat bookmark ketika diklik
                  </li>
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Implementasi font "LPMQ Isep Misbah" untuk tampilan teks Al-Quran yang lebih baik
                  </li>
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Ditambahkan halaman "Tentang" dengan informasi kontak developer
                  </li>
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Ditambahkan halaman Changelog untuk melacak perubahan aplikasi
                  </li>
                  <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Perbaikan tampilan Bismillah untuk menghindari duplikasi pada ayat pertama
                  </li>
                  </ul>
              </div>
              </div>
              
              <!-- Version 1.1.0 -->
              <div class="timeline-item">
                <div class="timeline-date">
                  <span class="badge bg-success">28 Februari 2025</span>
                </div>
                <div class="timeline-content">
                  <h4>Versi 1.1.0</h4>
                  <ul class="list-group mb-3">
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Ditambahkan fitur pengulangan ayat dengan opsi 1x, 2x, 3x, 5x, dan 10x
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Implementasi fitur bookmark untuk ayat-ayat tertentu
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Ditambahkan fitur auto-scroll ke ayat yang sedang diputar
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Perbaikan UI pada tampilan detail surah untuk pengalaman yang lebih baik
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Version 1.0.0 -->
              <div class="timeline-item">
                <div class="timeline-date">
                  <span class="badge bg-success">28 Februari 2025</span>
                </div>
                <div class="timeline-content">
                  <h4>Versi 1.0.0</h4>
                  <ul class="list-group mb-3">
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Rilis pertama aplikasi Al-Quran
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Fitur membaca Al-Quran lengkap 114 surah
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Terjemahan bahasa Indonesia untuk setiap ayat
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Fitur audio murottal dari 5 qari ternama
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Fitur bookmark untuk surah favorit
                    </li>
                    <li class="list-group-item">
                      <i class="bi bi-check-circle-fill text-success me-2"></i>
                      Pencarian surah berdasarkan nama atau nomor
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="text-center mt-5">
              <router-link to="/" class="btn btn-outline-primary">
                <i class="bi bi-arrow-left"></i> Kembali ke Beranda
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline::before {
  content: '';
  position: absolute;
  width: 3px;
  background-color: var(--bs-success);
  top: 0;
  bottom: 0;
  left: 120px;
  margin-left: -1.5px;
}

.timeline-item {
  position: relative;
  margin-bottom: 30px;
}

.timeline-date {
  position: absolute;
  width: 100px;
  text-align: right;
}

.timeline-content {
  margin-left: 150px;
  padding: 10px 15px;
  border-left: 4px solid var(--bs-success);
  background-color: #f8f9fa;
  border-radius: 0 5px 5px 0;
}

.timeline-content h4 {
  color: var(--bs-success);
  margin-bottom: 15px;
}

.list-group-item {
  border-left: none;
  border-right: none;
  border-top: none;
  padding-left: 0;
  padding-right: 0;
}

.list-group-item:last-child {
  border-bottom: none;
}

@media (max-width: 767.98px) {
  .timeline::before {
    left: 60px;
  }
  
  .timeline-date {
    width: 50px;
  }
  
  .timeline-content {
    margin-left: 80px;
  }
}
</style>