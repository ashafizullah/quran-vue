<script setup lang="ts">
</script>

<template>
  <div class="container-fluid">
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
              <router-link class="nav-link" to="/">Beranda</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/bookmarks">
                <i class="bi bi-bookmarks me-1"></i>Bookmark
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/about">
                <i class="bi bi-info-circle me-1"></i>Tentang
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/changelog">
                <i class="bi bi-list-check me-1"></i>Changelog
              </router-link>
            </li>
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