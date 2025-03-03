<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

// Function untuk menutup navbar
const closeNavbar = () => {
  const navbarElement = document.getElementById('navbarNav');
  if (navbarElement && navbarElement.classList.contains('show')) {
    // Dapatkan tombol toggle navbar
    const navbarToggler = document.querySelector('.navbar-toggler') as HTMLElement;
    if (navbarToggler) {
      navbarToggler.click();
    }
  }
};

// Handler untuk klik pada dokumen
const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const navbarElement = document.getElementById('navbarNav');
  
  // Periksa apakah navbar sedang terbuka
  if (navbarElement && navbarElement.classList.contains('show')) {
    // Periksa apakah klik berada di luar navbar dan bukan pada tombol toggler
    if (
      !navbarElement.contains(target) && 
      !target.closest('.navbar-toggler')
    ) {
      closeNavbar();
    }
  }
};

onMounted(() => {
  // Pasang event listener untuk klik pada dokumen
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  // Bersihkan event listener
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="container-lg">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container">
        <router-link class="navbar-brand" to="/">
          <i class="bi bi-book me-2"></i>Aplikasi Al-Quran
        </router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/" @click="closeNavbar">
                Beranda
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/bookmarks" @click="closeNavbar">
                <i class="bi bi-bookmarks me-1"></i>Bookmark
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/prayer-times">
                <i class="bi bi-clock me-1"></i>Jadwal Shalat
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/about" @click="closeNavbar">
                <i class="bi bi-info-circle me-1"></i>Tentang
              </router-link>
            </li>
            <!-- <li class="nav-item">
              <router-link class="nav-link" to="/changelog" @click="closeNavbar">
                <i class="bi bi-list-check me-1"></i>Changelog
              </router-link>
            </li> -->
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="container">
      <router-view></router-view>
    </div>
    
    <footer class="bg-dark text-white text-center py-3 mt-5">
      <div class="container">
        <p class="mb-0">Aplikasi Al-Quran &copy; {{ new Date().getFullYear() }}</p>
      </div>
    </footer>
  </div>
</template>

<style>
body {
  min-height: 100vh;
}
</style>