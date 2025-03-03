<script setup lang="ts">
// src/views/About.vue
</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h1 class="text-center mb-4 text-success">Tentang Aplikasi</h1>
            
            <div class="mb-4">
              <h4>Aplikasi Al-Quran</h4>
              <p>
                Aplikasi ini dibuat untuk memudahkan umat muslim dalam membaca dan mendengarkan Al-Quran kapan saja dan di mana saja.
                Dengan fitur bookmark, pengaturan ukuran teks, dan dukungan audio dari berbagai qari terkenal.
              </p>
            </div>
            
            <div class="mb-4">
              <h4>API dan Sumber Data</h4>
              <p>
                Aplikasi ini menggunakan data dari <a href="https://alquran.cloud/api" target="_blank" class="text-success">Quran Cloud API</a>, 
                yang menyediakan teks Al-Quran, terjemahan, dan audio murottal dari berbagai qari.
              </p>
              <p>
                Untuk fitur jadwal sholat, asmaul husna, dan arah kiblat aplikasi ini menggunakan <a href="https://aladhan.com/" target="_blank" class="text-success">AlAdhan API</a>,
                yang menyediakan waktu sholat akurat untuk berbagai kota di seluruh dunia dengan beberapa metode perhitungan.
              </p>
            </div>
            
            <div class="mb-4">
              <h4>Developer</h4>
              <p>
                Aplikasi ini dikembangkan oleh Adam Suchi Hafizullah dengan tujuan memberikan pengalaman membaca Al-Quran yang 
                nyaman dan mudah diakses.
              </p>
            </div>
            
            <div class="mb-4">
              <h4>Hubungi Saya</h4>
              <p>
                Jika Anda memiliki masukan, saran, atau menemukan bug, silakan hubungi saya melalui:
              </p>
              <ul class="list-group">
                <li class="list-group-item">
                  <i class="bi bi-linkedin me-2 text-primary"></i>
                  <a href="https://www.linkedin.com/in/ashafizullah/" target="_blank">linkedin.com/in/ashafizullah</a>
                </li>
                <li class="list-group-item">
                  <i class="bi bi-whatsapp me-2 text-success"></i>
                  <a href="https://wa.me/6282179392018" target="_blank">+62 821-7939-2018</a>
                </li>
              </ul>
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
.card {
  border-left: 4px solid var(--bs-success);
}

h4 {
  color: var(--bs-success);
  margin-bottom: 1rem;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>