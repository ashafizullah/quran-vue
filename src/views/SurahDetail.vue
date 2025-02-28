<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { 
  addSurahBookmark, 
  removeSurahBookmark, 
  isSurahBookmarked as checkSurahBookmark,
  addAyahBookmark,
  removeAyahBookmark,
  isAyahBookmarked as checkAyahBookmark
} from '../utils/bookmarkStore';
import { surahNamesIndonesian } from '../utils/surahTranslations';

const route = useRoute();
const router = useRouter();

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  audio: string;
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
const audioPlayer = ref<HTMLAudioElement | null>(null);
const currentAyahIndex = ref<number | null>(null);
const isPlaying = ref(false);
const selectedReciter = ref('ar.alafasy'); // Default reciter (Mishary Rashid Alafasy)
const isSurahBookmarked = ref(false);
const ayahBookmarks = ref<Record<number, boolean>>({});

// Text size control
const arabicTextSize = ref(4); // Default size (fs-4)
const translationTextSize = ref(0); // Default size (normal)
const MIN_TEXT_SIZE = 1;
const MAX_TEXT_SIZE = 6;

// Repeat functionality for both full surah and individual ayahs
const repeatCount = ref(1); // Default: play once
const currentRepeatIndex = ref(0);
const isRepeating = ref(false);
const playingFullSurah = ref(false);

// Auto-play setting
const autoPlay = ref(true); // Default: auto-play until end of surah is enabled

// Individual ayah repeat settings
const ayahRepeatSettings = ref<Record<number, number>>({});
const defaultRepeatOptions = [1, 2, 3, 5, 10];

// References for scrolling
const ayahRefs = ref<Record<number, HTMLElement | null>>({});

// Auto-scroll setting
const autoScroll = ref(true); // Default: auto-scroll to the current ayah is enabled

// Available reciters
const reciters = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Murattal' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahmaan As-Sudais' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq al-Minshawi' },
  { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify' }
];

// Mapping for revelation type translation
const revelationTypeMap = {
  'Meccan': 'Makkiyah',
  'Medinan': 'Madaniyah'
};

// Track full surah repetition
const surahRepeatCount = ref(1); // Default to 1
const currentSurahRepeatIndex = ref(0);

const fetchSurah = async (id: string | string[]) => {
  loading.value = true;
  error.value = '';
  
  try {
    // Fetch Arabic text with audio
    const arabicResponse = await axios.get(`https://api.alquran.cloud/v1/surah/${id}/${selectedReciter.value}`);
    surah.value = arabicResponse.data.data;
    
    // Fetch Indonesian translation
    const translationResponse = await axios.get(`https://api.alquran.cloud/v1/surah/${id}/id.indonesian`);
    translation.value = translationResponse.data.data;
    
    loading.value = false;
    
    // Initialize repeat settings for each ayah in the surah
    if (surah.value && surah.value.ayahs) {
      const settings: Record<number, number> = {};
      surah.value.ayahs.forEach(ayah => {
        settings[ayah.numberInSurah] = 1; // Default to 1 repeat
      });
      ayahRepeatSettings.value = settings;
    }
    
    // Check bookmark status after loading
    checkBookmarkStatus();
  } catch (err) {
    error.value = 'Gagal memuat Surah. Silakan coba lagi nanti.';
    loading.value = false;
    console.error(err);
  }
};

const scrollToBookmarkedAyah = () => {
  if (route.params.ayah && surah.value) {
    const ayahNumber = parseInt(route.params.ayah as string);
    
    // Create a function to attempt scrolling with retries
    const attemptScroll = (attemptsLeft = 5) => {
      if (attemptsLeft <= 0) return; // Stop trying after several attempts
      
      const ayahElement = ayahRefs.value[ayahNumber];
      if (ayahElement) {
        // Element found, scroll to it
        ayahElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // Highlight the ayah
        ayahElement.classList.add('highlight-ayah');
        setTimeout(() => {
          ayahElement.classList.remove('highlight-ayah');
        }, 3000);
      } else {
        // Element not found yet, retry after delay
        setTimeout(() => attemptScroll(attemptsLeft - 1), 300);
      }
    };
    
    // Start attempting to scroll after DOM has updated
    nextTick(() => {
      attemptScroll();
    });
  }
};

onMounted(() => {
  audioPlayer.value = new Audio();
  audioPlayer.value.addEventListener('ended', handleAudioEnded);
  fetchSurah(route.params.id);
  
  const unregisterRouterGuard = router.beforeEach((_, from) => {
    // If we're navigating away from this page, stop the audio
    if (from.name === undefined || from.path.includes('/surah/')) {
      stopAudio();
    }
    return true;
  });
  
  // Store the unregister function to clean up when component unmounts
  onBeforeUnmount(() => {
    unregisterRouterGuard();
  });
  
  // Check bookmark status for the current surah
  checkBookmarkStatus();

  const savedArabicSize = localStorage.getItem('quran-app-arabic-size');
  const savedTranslationSize = localStorage.getItem('quran-app-translation-size');
    
  if (savedArabicSize) {
    arabicTextSize.value = parseInt(savedArabicSize);
  }
    
  if (savedTranslationSize) {
    translationTextSize.value = parseInt(savedTranslationSize);
  }
});

watch(() => loading.value, (isLoading) => {
  if (!isLoading && surah.value && route.params.ayah) {
    // Now data is loaded, attempt to scroll
    scrollToBookmarkedAyah();
  }
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    stopAudio();
    fetchSurah(newId);
  }
});

watch(() => selectedReciter.value, () => {
  stopAudio();
  fetchSurah(route.params.id);
});

watch(arabicTextSize, (newSize) => {
  localStorage.setItem('quran-app-arabic-size', newSize.toString());
});

watch(translationTextSize, (newSize) => {
  localStorage.setItem('quran-app-translation-size', newSize.toString());
});

// Watch currentAyahIndex to scroll to the currently playing ayah
watch(currentAyahIndex, async (newIndex) => {
  if (newIndex !== null && autoScroll.value) {
    await nextTick(); // Wait for DOM to update
    scrollToAyah(newIndex);
  }
});

// Clean up event listeners and stop audio when component unmounts
const beforeUnmount = () => {
  if (audioPlayer.value) {
    audioPlayer.value.removeEventListener('ended', handleAudioEnded);
  }
  stopAudio();
};

// Make sure Vue calls our beforeUnmount function
onBeforeUnmount(beforeUnmount);

const increaseTextSize = () => {
    if (arabicTextSize.value < MAX_TEXT_SIZE) {
      arabicTextSize.value++;
    }
    if (translationTextSize.value < MAX_TEXT_SIZE - 1) {
      translationTextSize.value++;
    }
  };

  const decreaseTextSize = () => {
    if (arabicTextSize.value > MIN_TEXT_SIZE) {
      arabicTextSize.value--;
    }
    if (translationTextSize.value > MIN_TEXT_SIZE - 1) {
      translationTextSize.value--;
    }
  };

  const resetTextSize = () => {
    arabicTextSize.value = 4; // Reset to default (fs-4)
    translationTextSize.value = 0; // Reset to default (normal)
  };

// Function to scroll to a specific ayah
const scrollToAyah = (index: number) => {
  if (!surah.value) return;
  
  const ayahNumberInSurah = surah.value.ayahs[index].numberInSurah;
  const ayahElement = ayahRefs.value[ayahNumberInSurah];
  
  if (ayahElement) {
    // Scroll with smooth behavior
    ayahElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
};

const playAyah = (index: number) => {
  if (!surah.value || !audioPlayer.value) return;
  
  const ayah = surah.value.ayahs[index];
  
  // If already playing this ayah, just toggle play/pause
  if (currentAyahIndex.value === index) {
    togglePlayPause();
    return;
  }
  
  // Setup for playing individual ayah (not part of full surah playback)
  playingFullSurah.value = false;
  
  // Configure repeat settings for this specific ayah
  isRepeating.value = ayahRepeatSettings.value[ayah.numberInSurah] > 1;
  currentRepeatIndex.value = 0; // Reset repeat counter
  
  // Play the new ayah
  currentAyahIndex.value = index;
  audioPlayer.value.src = ayah.audio;
  audioPlayer.value.play()
    .then(() => {
      isPlaying.value = true;
    })
    .catch(error => {
      console.error('Error playing audio:', error);
    });
};

const togglePlayPause = () => {
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  }
  
  isPlaying.value = !isPlaying.value;
};

const stopAudio = () => {
  if (!audioPlayer.value) return;
  
  audioPlayer.value.pause();
  audioPlayer.value.currentTime = 0;
  isPlaying.value = false;
  currentAyahIndex.value = null;
  isRepeating.value = false;
  currentRepeatIndex.value = 0;
  playingFullSurah.value = false;
  currentSurahRepeatIndex.value = 0;
};

const handleAudioEnded = () => {
  if (currentAyahIndex.value === null || !surah.value) return;
  
  // Get the current ayah
  const ayah = surah.value.ayahs[currentAyahIndex.value];
  
  // Handle individual ayah repeat (only if not in full surah mode)
  if (!playingFullSurah.value && isRepeating.value) {
    // Increment the current repeat counter
    currentRepeatIndex.value++;
    
    // Get the target repeat count for this specific ayah
    const targetRepeatCount = ayahRepeatSettings.value[ayah.numberInSurah];
    
    // If we haven't reached the desired number of repeats
    if (currentRepeatIndex.value < targetRepeatCount) {
      // Replay the same ayah
      if (audioPlayer.value) {
        audioPlayer.value.currentTime = 0;
        audioPlayer.value.play().catch(error => {
          console.error('Error replaying audio:', error);
        });
        return;
      }
    } else {
      // Reset repeat counter
      currentRepeatIndex.value = 0;
      
      // Check if autoplay is enabled and we're not at the last ayah
      if (autoPlay.value && currentAyahIndex.value < surah.value.ayahs.length - 1) {
        // Continue to the next ayah
        playNextAyah();
        return;
      } else if (!autoPlay.value) {
        // Auto-play is disabled, stop playback
        stopAudio();
        return;
      } else {
        // Last ayah reached
        stopAudio();
        return;
      }
    }
  }
  
  // Full surah playback logic
  if (playingFullSurah.value) {
    if (currentAyahIndex.value < surah.value.ayahs.length - 1) {
      // Move to next ayah in the surah
      playNextAyah();
    } else {
      // Reached the end of the surah
      // Check if we should repeat the entire surah
      if (surahRepeatCount.value > 1) {
        currentSurahRepeatIndex.value++;
        
        if (currentSurahRepeatIndex.value < surahRepeatCount.value) {
          // Start again from the first ayah for another full playthrough
          currentAyahIndex.value = 0;
          if (audioPlayer.value && surah.value) {
            audioPlayer.value.src = surah.value.ayahs[0].audio;
            audioPlayer.value.play().catch(error => {
              console.error('Error replaying surah:', error);
            });
          }
        } else {
          // All repeats of the full surah completed
          stopAudio();
        }
      } else {
        // No surah repetition configured, just end playback
        stopAudio();
      }
    }
  } else if (autoPlay.value && !isRepeating.value && currentAyahIndex.value < surah.value.ayahs.length - 1) {
    // Not in full surah mode or repeating, but auto-play is enabled and we're not at the last ayah
    // Continue to the next ayah
    playNextAyah();
  } else {
    // Not playing full surah, not repeating, and either auto-play is disabled or we're at the last ayah
    stopAudio();
  }
};

// Helper function to play the next ayah
const playNextAyah = () => {
  if (!surah.value || currentAyahIndex.value === null) return;
  
  // Move to next ayah
  currentAyahIndex.value++;
  
  // Safety check
  if (currentAyahIndex.value >= surah.value.ayahs.length) {
    stopAudio();
    return;
  }
  
  const nextAyah = surah.value.ayahs[currentAyahIndex.value];
  
  // Configure repeat settings for next ayah
  isRepeating.value = ayahRepeatSettings.value[nextAyah.numberInSurah] > 1;
  currentRepeatIndex.value = 0; // Reset repeat counter
  
  // Play next ayah
  if (audioPlayer.value) {
    audioPlayer.value.src = nextAyah.audio;
    audioPlayer.value.play().catch(error => {
      console.error('Error playing next ayah:', error);
    });
  }
};

const playFullSurah = () => {
  if (surah.value && surah.value.ayahs.length > 0) {
    // Set flag that we're playing the full surah
    playingFullSurah.value = true;
    
    // Apply the repeat count from the dropdown
    surahRepeatCount.value = repeatCount.value;
    
    // Reset the repetition counter
    currentSurahRepeatIndex.value = 0;
    
    // Individual ayah repeats are not used in full surah mode
    isRepeating.value = false;
    currentRepeatIndex.value = 0;
    
    // Start from the first ayah
    currentAyahIndex.value = 0;
    
    // Play first ayah
    if (audioPlayer.value && surah.value) {
      audioPlayer.value.src = surah.value.ayahs[0].audio;
      audioPlayer.value.play()
        .then(() => {
          isPlaying.value = true;
        })
        .catch(error => {
          console.error('Error playing audio:', error);
        });
    }
  }
};

// Toggle auto-play functionality
const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value;
};

// Toggle auto-scroll functionality
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
};

// Function to change repeat count for a specific ayah
const changeAyahRepeatCount = (ayahNumber: number, count: number) => {
  ayahRepeatSettings.value[ayahNumber] = count;
};

// Function to translate revelation type
const translateRevelationType = (type: string): string => {
  return revelationTypeMap[type as keyof typeof revelationTypeMap] || type;
};

// Function to get Indonesian translation of surah name
const getIndonesianName = (englishName: string): string => {
  return surahNamesIndonesian[englishName] || englishName;
};

// Computed property to get current ayah status
const getAyahStatus = (index: number) => {
  if (currentAyahIndex.value === index) {
    return isPlaying.value ? 'playing' : 'paused';
  }
  return 'notPlaying';
};

// Register ayah ref
const setAyahRef = (el: any, ayahNumber: number) => {
  if (el) {
    ayahRefs.value[ayahNumber] = el;
  }
};

// Bookmark functions
const checkBookmarkStatus = () => {
  if (surah.value) {
    // Check if the current surah is bookmarked
    isSurahBookmarked.value = checkSurahBookmark(surah.value.number);
    
    // Check which ayahs are bookmarked
    const newBookmarks: Record<number, boolean> = {};
    if (surah.value.ayahs) {
      surah.value.ayahs.forEach(ayah => {
        newBookmarks[ayah.numberInSurah] = checkAyahBookmark(
          surah.value!.number, 
          ayah.numberInSurah
        );
      });
    }
    ayahBookmarks.value = newBookmarks;
  }
};

const toggleSurahBookmark = () => {
  if (surah.value) {
    if (isSurahBookmarked.value) {
      removeSurahBookmark(surah.value.number);
      isSurahBookmarked.value = false;
    } else {
      addSurahBookmark({
        surahNumber: surah.value.number,
        surahName: surah.value.englishName
      });
      isSurahBookmarked.value = true;
    }
  }
};

const toggleAyahBookmark = (index: number) => {
  if (surah.value && surah.value.ayahs) {
    const ayah = surah.value.ayahs[index];
    const surahNumber = surah.value.number;
    const ayahNumber = ayah.numberInSurah;
    
    if (ayahBookmarks.value[ayahNumber]) {
      removeAyahBookmark(surahNumber, ayahNumber);
      ayahBookmarks.value[ayahNumber] = false;
    } else {
      addAyahBookmark({
        surahNumber,
        surahName: surah.value.englishName,
        ayahNumber,
        ayahText: ayah.text
      });
      ayahBookmarks.value[ayahNumber] = true;
    }
  }
};

const removeBismillahIfNeeded = (text: string, surahNumber: number): string => {
  // Jika bukan surat Al-Fatihah (karena bismillah adalah bagian dari surat)
  if (surahNumber !== 1) {
    // Pola Bismillah dalam teks Arab
    const bismillahPattern = /^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ/;
    return text.replace(bismillahPattern, '').trim();
  }
  return text;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
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
        <div class="d-flex justify-content-between mb-3">
          <router-link to="/" class="btn btn-outline-primary">
            <i class="bi bi-arrow-left"></i> Kembali ke Daftar Surah
          </router-link>
          
          <button 
            @click="toggleSurahBookmark" 
            class="btn"
            :class="isSurahBookmarked ? 'btn-success' : 'btn-outline-success'"
          >
            <i class="bi" :class="isSurahBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'"></i>
            {{ isSurahBookmarked ? 'Tersimpan' : 'Simpan Surah' }}
          </button>
        </div>
        
        <div class="text-center mb-4">
          <h1 class="text-success">{{ surah.englishName }}</h1>
          <h2 class="arabic-text fs-2">{{ surah.name }}</h2>
          <p class="text-muted">
            <strong>{{ getIndonesianName(surah.englishName) }}</strong> • 
            {{ surah.numberOfAyahs }} ayat • 
            {{ translateRevelationType(surah.revelationType) }}
          </p>
          
          <!-- Audio Controls -->
          <div class="audio-controls card mb-4 p-3">
            <div class="mb-3">
              <h5 class="mb-3">Audio Murottal</h5>
              <div class="row g-2">
                <div class="col-md-6 mb-2">
                  <label for="repeatSelect" class="form-label">Pengulangan Surah:</label>
                  <select id="repeatSelect" class="form-select" v-model="repeatCount">
                    <option value="1">1x (tanpa pengulangan)</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="5">5x</option>
                    <option value="10">10x</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-end mb-2">
                  <button @click="playFullSurah" class="btn btn-success w-100" :disabled="loading">
                    <i class="bi bi-play-fill"></i> Putar Surah Lengkap
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Auto-Play and Auto-Scroll Options -->
            <div class="d-flex gap-4 mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="autoPlaySwitch" :checked="autoPlay" @change="toggleAutoPlay">
                <label class="form-check-label" for="autoPlaySwitch">
                  Auto-Play (otomatis putar ayat selanjutnya)
                </label>
              </div>
              
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="autoScrollSwitch" :checked="autoScroll" @change="toggleAutoScroll">
                <label class="form-check-label" for="autoScrollSwitch">
                  Auto-Scroll (otomatis gulir ke ayat yang diputar)
                </label>
              </div>
            </div>
            
            <div class="form-group mb-3">
              <label for="reciterSelect" class="form-label">Pilih Qari:</label>
              <select id="reciterSelect" class="form-select" v-model="selectedReciter">
                <option v-for="reciter in reciters" :key="reciter.id" :value="reciter.id">
                  {{ reciter.name }}
                </option>
              </select>
            </div>
            
            <div v-if="currentAyahIndex !== null" class="current-playing alert alert-success">
              <div class="d-flex justify-content-between align-items-center">
                <span>
                  <strong>Memutar Ayat {{ surah.ayahs[currentAyahIndex].numberInSurah }}</strong>
                  <span v-if="playingFullSurah && currentSurahRepeatIndex > 0">
                    (Pengulangan Surah {{ currentSurahRepeatIndex + 1 }} dari {{ surahRepeatCount }})
                  </span>
                  <span v-else-if="isRepeating">
                    (Pengulangan Ayat {{ currentRepeatIndex + 1 }} dari {{ ayahRepeatSettings[surah.ayahs[currentAyahIndex].numberInSurah] }})
                  </span>
                </span>
                <div>
                  <button @click="togglePlayPause" class="btn btn-sm btn-primary me-2">
                    <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                  </button>
                  <button @click="stopAudio" class="btn btn-sm btn-secondary">
                    <i class="bi bi-stop-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bismillah text-center my-4 fs-3 arabic-text" v-if="surah.number !== 1 && surah.number !== 9">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
      </div>
      
      <div 
        class="card mb-4" 
        v-for="(ayah, index) in surah.ayahs" 
        :key="ayah.number"
        :ref="el => setAyahRef(el, ayah.numberInSurah)"
        :class="{ 'currently-playing': currentAyahIndex === index }"
      >
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <span class="badge bg-primary">Ayat {{ ayah.numberInSurah }}</span>
            <div>
              <span class="badge bg-secondary me-2">Halaman {{ ayah.page }}</span>
              
              <!-- Ayah repeat control -->
              <div class="btn-group me-2">
                <button 
                  class="btn btn-sm btn-outline-info dropdown-toggle" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  Ulang {{ ayahRepeatSettings[ayah.numberInSurah] }}x
                </button>
                <ul class="dropdown-menu">
                  <li v-for="option in defaultRepeatOptions" :key="option">
                    <a 
                      class="dropdown-item" 
                      href="#" 
                      @click.prevent="changeAyahRepeatCount(ayah.numberInSurah, option)"
                      :class="{ 'active': ayahRepeatSettings[ayah.numberInSurah] === option }"
                    >
                      {{ option === 1 ? '1x (tanpa pengulangan)' : option + 'x' }}
                    </a>
                  </li>
                </ul>
              </div>
              
              <button 
                @click="toggleAyahBookmark(index)" 
                class="btn btn-sm me-2" 
                :class="{
                  'btn-warning': ayahBookmarks[ayah.numberInSurah],
                  'btn-outline-warning': !ayahBookmarks[ayah.numberInSurah]
                }"
              >
                <i 
                  class="bi" 
                  :class="{
                    'bi-bookmark-star-fill': ayahBookmarks[ayah.numberInSurah],
                    'bi-bookmark-star': !ayahBookmarks[ayah.numberInSurah]
                  }"
                ></i>
              </button>
              <button 
                @click="playAyah(index)" 
                class="btn btn-sm" 
                :class="{
                  'btn-success': getAyahStatus(index) === 'playing',
                  'btn-outline-success': getAyahStatus(index) !== 'playing'
                }"
              >
                <i 
                  class="bi" 
                  :class="{
                    'bi-pause-fill': getAyahStatus(index) === 'playing',
                    'bi-play-fill': getAyahStatus(index) !== 'playing'
                  }"
                ></i>
              </button>
            </div>
          </div>
          
          <p class="arabic-text text-end" :class="`fs-${arabicTextSize}`">
            {{ 
              ayah.numberInSurah === 1 && surah.number !== 1 ? 
              removeBismillahIfNeeded(ayah.text, surah.number) : 
              ayah.text 
            }}
          </p>

          <p v-if="translation && translation.ayahs[index]" class="mb-0" :class="translationTextSize > 0 ? `fs-${translationTextSize}` : ''">
            {{ translation.ayahs[index].text }}
          </p>
        </div>
      </div>
    </div>
    <div class="floating-controls">
      <div class="btn-group-vertical shadow">
        <button class="btn btn-success" @click="increaseTextSize" title="Perbesar Text">
          <i class="bi bi-zoom-in"></i>
        </button>
        <button class="btn btn-secondary" @click="resetTextSize" title="Ukuran Normal">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <button class="btn btn-success" @click="decreaseTextSize" title="Perkecil Text">
          <i class="bi bi-zoom-out"></i>
        </button>
        <button class="btn btn-primary" @click="scrollToTop" title="Kembali ke Atas">
          <i class="bi bi-arrow-up"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arabic-text {
  font-family: "LPMQ Isep Misbah", "Traditional Arabic", "Scheherazade New", serif;
  line-height: 2;
}

.audio-controls {
  border-left: 4px solid var(--primary-color);
}

.current-playing {
  margin-bottom: 0;
}

.dropdown-item.active {
  background-color: var(--primary-color);
  color: white;
}

/* Styling for currently playing ayah */
.currently-playing {
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.5);
  border: 2px solid #28a745;
  transition: all 0.3s ease;
}

.currently-playing .card-body {
  background-color: rgba(40, 167, 69, 0.05);
}

/* Smooth transition for better UX */
.card {
  transition: all 0.3s ease;
}

.floating-controls {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
}

.floating-controls .btn-group-vertical {
  background-color: rgba(255, 255, 255, 0.6); /* Latar belakang semi-transparan */
  border-radius: 0.25rem;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  opacity: 0.7; /* Opacity default */
}

.floating-controls .btn-group-vertical:hover {
  opacity: 1; /* Opacity penuh saat hover */
  background-color: rgba(255, 255, 255, 0.9);
}

.floating-controls .btn {
  border-radius: 0;
  background-color: rgba(40, 167, 69, 0.7); /* Warna tombol semi-transparan */
  border-color: rgba(40, 167, 69, 0.3);
  transition: all 0.2s ease;
}

.floating-controls .btn:hover {
  background-color: rgba(40, 167, 69, 0.9);
  border-color: rgba(40, 167, 69, 0.5);
}

.floating-controls .btn-secondary {
  background-color: rgba(108, 117, 125, 0.7);
  border-color: rgba(108, 117, 125, 0.3);
}

.floating-controls .btn-secondary:hover {
  background-color: rgba(108, 117, 125, 0.9);
  border-color: rgba(108, 117, 125, 0.5);
}

.floating-controls .btn:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.floating-controls .btn:last-child {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.floating-controls .btn-primary {
  background-color: rgba(13, 110, 253, 0.7);
  border-color: rgba(13, 110, 253, 0.3);
}

.floating-controls .btn-primary:hover {
  background-color: rgba(13, 110, 253, 0.9);
  border-color: rgba(13, 110, 253, 0.5);
}

.floating-controls .btn:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.floating-controls .btn:last-child {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.highlight-ayah {
  animation: highlight-pulse 3s ease;
}

@keyframes highlight-pulse {
  0% { background-color: rgba(255, 193, 7, 0.1); }
  50% { background-color: rgba(255, 193, 7, 0.3); }
  100% { background-color: rgba(255, 193, 7, 0); }
}
</style>