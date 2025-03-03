<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
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
import { 
  surahNamesIndonesian, 
  surahMeaningsIndonesian 
} from '../utils/surahTranslations';

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
const goToAyahNumber = ref<string | number>("1"); 

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
const viewMode = ref<'list' | 'book'>('list'); // Default mode tampilan baris per baris

const ayahsByPage = computed(() => {
  if (!surah.value) return {};
  
  const grouped: Record<number, Ayah[]> = {};
  
  surah.value.ayahs.forEach((ayah) => {
    if (!grouped[ayah.page]) {
      grouped[ayah.page] = [];
    }
    grouped[ayah.page].push(ayah);
  });
  
  return grouped;
});

const availablePages = computed(() => {
  return Object.keys(ayahsByPage.value).map(Number).sort((a, b) => a - b);
});

// Ubah currentPage dan totalPages untuk bekerja dengan halaman mushaf sesungguhnya
const currentPage = ref(1); // Akan diinisialisasi dengan halaman mushaf pertama dalam onMounted
const totalPages = computed(() => availablePages.value.length);

// Tambahkan getter untuk halaman mushaf saat ini
const currentMushaPage = computed(() => {
  return availablePages.value[currentPage.value - 1] || 1;
});

// Tambahkan getter untuk ayat-ayat pada halaman mushaf saat ini
const currentMushaPageAyahs = computed(() => {
  return ayahsByPage.value[currentMushaPage.value] || [];
});

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

  const savedViewMode = localStorage.getItem('quran-app-view-mode');
  if (savedViewMode === 'list' || savedViewMode === 'book') {
    viewMode.value = savedViewMode;
  }

  fetchSurah(route.params.id).then(() => {
    // Inisialisasi halaman dengan halaman mushaf pertama yang memiliki ayat dari surah ini
    if (surah.value && surah.value.ayahs.length > 0) {
      currentPage.value = 1; // Ini adalah index halaman (1-based), bukan nomor halaman mushaf
    }
  });
  
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

watch(() => surah.value, (newSurah) => {
  if (newSurah) {
    // Update title
    document.title = `Surah ${getIndonesianName(newSurah.englishName)} - Al-Quran`;
    
    // Update description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 
      `Baca Surah ${newSurah.englishName} (${getIndonesianName(newSurah.englishName)}) dengan terjemahan Bahasa Indonesia`
    );
    
    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `Surah ${newSurah.englishName} - ${getIndonesianName(newSurah.englishName)}`);
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 
      `Baca dan dengarkan Surah ${newSurah.englishName} (${newSurah.numberOfAyahs} ayat) dengan terjemahan Bahasa Indonesia`
    );
  }
}, { immediate: true });

// Tambahkan fungsi untuk structured data
const updateStructuredData = () => {
  if (!surah.value) return;
  
  // Hapus schema lama jika ada
  const existingSchema = document.querySelector('script[type="application/ld+json"]');
  if (existingSchema) {
    existingSchema.remove();
  }
  
  // Buat schema baru
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'name': surah.value.englishName,
    'headline': `Surah ${surah.value.englishName} - ${getIndonesianName(surah.value.englishName)}`,
    'description': `Baca dan dengarkan Surah ${surah.value.englishName} dengan terjemahan Bahasa Indonesia`,
    'articleSection': 'Al-Quran',
    'numberOfItems': surah.value.numberOfAyahs,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://quran.ashafizullah.com/surah/${surah.value.number}`
    }
  };
  
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

// Panggil updateStructuredData saat surah berubah
watch(() => surah.value, updateStructuredData, { immediate: true });

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

const getIndonesianMeaning = (englishName: string): string => {
  return surahMeaningsIndonesian[englishName] || '';
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
        surahName: getIndonesianName(surah.value.englishName)
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
        surahName: getIndonesianName(surah.value.englishName),
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

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const goToPage = (pageIndex: number) => {
  if (pageIndex >= 1 && pageIndex <= totalPages.value) {
    currentPage.value = pageIndex;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'book' : 'list';
  // Reset ke halaman pertama saat beralih mode
  currentPage.value = 1;
  // Simpan preferensi mode di localStorage
  localStorage.setItem('quran-app-view-mode', viewMode.value);
};

const isAyahPlaying = (ayahNumber: number) => {
  if (currentAyahIndex.value === null || !surah.value) return false;
  return surah.value.ayahs[currentAyahIndex.value].numberInSurah === ayahNumber;
};

const goToAyah = () => {
  if (!surah.value) return;
  
  // Validasi input
  const ayahNum = Number(goToAyahNumber.value);
  if (isNaN(ayahNum) || ayahNum < 1 || ayahNum > surah.value.numberOfAyahs) {
    alert(`Masukkan nomor ayat antara 1 - ${surah.value.numberOfAyahs}`);
    return;
  }
  
  if (viewMode.value === 'list') {
    // Mode baris: cari dan scroll ke ayat
    const ayahElement = ayahRefs.value[ayahNum];
    if (ayahElement) {
      ayahElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Highlight untuk menarik perhatian
      ayahElement.classList.add('highlight-ayah');
      setTimeout(() => {
        ayahElement.classList.remove('highlight-ayah');
      }, 3000);
    }
  } else {
    // Mode mushaf/book: cari halaman yang memuat ayat tersebut
    if (surah.value && ayahsByPage.value) {
      // Cari halaman mushaf yang berisi ayat ini
      let targetPage = null;
      for (const [page, ayahs] of Object.entries(ayahsByPage.value)) {
        if (ayahs.some(a => a.numberInSurah === ayahNum)) {
          targetPage = parseInt(page);
          break;
        }
      }
      
      if (targetPage) {
        // Cari indeks halaman dalam availablePages
        const pageIndex = availablePages.value.indexOf(targetPage);
        if (pageIndex !== -1) {
          // Set ke halaman yang benar (pageIndex + 1 karena currentPage dimulai dari 1)
          currentPage.value = pageIndex + 1;
          
          // Scroll ke ayat dalam halaman tersebut setelah render
          nextTick(() => {
            const ayahElement = document.getElementById(`ayah-${ayahNum}`);
            if (ayahElement) {
              ayahElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              
              // Highlight untuk menarik perhatian
              ayahElement.classList.add('highlight-ayah');
              setTimeout(() => {
                ayahElement.classList.remove('highlight-ayah');
              }, 3000);
            }
          });
        }
      }
    }
  }
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
          <router-link to="/" class="btn btn-sm btn-outline-success">
            <i class="bi bi-arrow-left"></i> Kembali ke Daftar Surah
          </router-link>
          
          <button 
            @click="toggleSurahBookmark" 
            class="btn btn-sm"
            :class="isSurahBookmarked ? 'btn-success' : 'btn-outline-success'"
          >
            <i class="bi" :class="isSurahBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'"></i>
            {{ isSurahBookmarked ? 'Tersimpan' : 'Simpan Surah' }}
          </button>
        </div>
        
        <div class="text-center mb-4">
          <h1 class="text-success">{{ getIndonesianName(surah.englishName) }}</h1>
          <h2 class="arabic-text fs-2">{{ surah.name }}</h2>
          <p class="text-muted">
            <strong>{{ getIndonesianMeaning(surah.englishName) }}</strong> • 
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

            <div class="form-group mb-3">
              <label class="form-label">Cari Ayat:</label>
              <div class="input-group">
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="goToAyahNumber" 
                  min="1" 
                  :max="surah?.numberOfAyahs || 1" 
                  placeholder="Nomor ayat..."
                  @keyup.enter="goToAyah"
                />
                <button class="btn btn-success" @click="goToAyah">
                  <i class="bi bi-search"></i> Cari
                </button>
              </div>
              <small class="form-text text-muted">
                Masukkan nomor ayat (1-{{ surah.numberOfAyahs }})
              </small>
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

          <div class="view-mode-toggle mb-4">
            <div class="btn-group" role="group">
              <button 
                class="btn" 
                :class="(viewMode as 'list' | 'book') === 'list' ? 'btn-success' : 'btn-outline-success'" 
                @click="toggleViewMode"
                v-if="(viewMode as 'list' | 'book') === 'book'"
              >
                <i class="bi bi-list-ul me-1"></i> Mode Baris
              </button>
              <button 
                class="btn" 
                :class="(viewMode as 'list' | 'book') === 'book' ? 'btn-success' : 'btn-outline-success'" 
                @click="toggleViewMode"
                v-if="(viewMode as 'list' | 'book') === 'list'"
              >
                <i class="bi bi-book me-1"></i> Mode Mushaf
              </button>
            </div>
          </div>
          
          <div class="bismillah text-center my-4 fs-3 arabic-text" v-if="surah.number !== 1 && surah.number !== 9">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
      </div>
      <div v-if="viewMode === 'list'">
        <div 
          class="card mb-4" 
          v-for="(ayah, index) in surah.ayahs" 
          :key="ayah.number"
          :ref="el => setAyahRef(el, ayah.numberInSurah)"
          :class="{ 'currently-playing': currentAyahIndex === index }"
        >
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-primary">Ayat {{ ayah.numberInSurah }}</span>
              
              <div class="d-flex">
                <!-- Combined action dropdown for less visual clutter -->
                <div class="dropdown ayah-action-dropdown me-2">
                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                    <i class="bi bi-gear-fill"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end dropdown-menu-lg-start">
                    <!-- Repeat options -->
                    <li><h6 class="dropdown-header">Pengulangan</h6></li>
                    <li v-for="option in defaultRepeatOptions" :key="option">
                      <a 
                        class="dropdown-item" 
                        href="#" 
                        @click.prevent="changeAyahRepeatCount(ayah.numberInSurah, option)"
                      >
                        <i class="bi bi-check-lg me-2" v-if="ayahRepeatSettings[ayah.numberInSurah] === option"></i>
                        <span v-else class="me-4"></span>
                        {{ option === 1 ? '1x (tanpa pengulangan)' : option + 'x' }}
                      </a>
                    </li>
                    
                    <li><hr class="dropdown-divider"></li>
                    
                    <!-- Page info -->
                    <li>
                      <span class="dropdown-item-text">
                        <i class="bi bi-book me-2"></i>
                        Halaman {{ ayah.page }}
                      </span>
                    </li>
                  </ul>
                </div>
                
                <!-- Bookmark button - simplified to just icon -->
                <button 
                  @click="toggleAyahBookmark(index)" 
                  class="btn btn-sm me-2" 
                  :class="{
                    'btn-warning': ayahBookmarks[ayah.numberInSurah],
                    'btn-outline-secondary': !ayahBookmarks[ayah.numberInSurah]
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
                
                <!-- Play button - simplified -->
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
      <!-- Mode Book (Mushaf) -->
      <div v-else-if="viewMode === 'book'" class="book-mode">
      <div class="card book-page mb-4">
        <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            Halaman {{ currentPage }} dari {{ totalPages }}
            <small class="ms-2">(Mushaf hal. {{ currentMushaPage }})</small>
          </h5>
          <div class="btn-group">
            <button @click="prevPage" class="btn btn-sm btn-light" :disabled="currentPage === 1">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button @click="nextPage" class="btn btn-sm btn-light" :disabled="currentPage === totalPages">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        
        <div class="card-body p-4">
          <div class="mushaf-page arabic-text" :class="`fs-${arabicTextSize}`">
            <template v-for="ayah in currentMushaPageAyahs" :key="ayah.number">
              <!-- Tampilkan teks Arab -->
              <span class="ayah-text">
                {{ 
                  ayah.numberInSurah === 1 && surah.number !== 1 ? 
                  removeBismillahIfNeeded(ayah.text, surah.number) : 
                  ayah.text 
                }}
              </span>
              <span class="ayah-container">
                <!-- Nomor ayat dengan style lingkaran -->
                <span class="ayah-number" 
                  :id="`ayah-${ayah.numberInSurah}`"
                  :class="{ 'playing': isAyahPlaying(ayah.numberInSurah) }"
                >
                  {{ ayah.numberInSurah }}
                </span>
                
                <!-- Audio dan bookmark controls (muncul saat hover nomor ayat) -->
                <span class="ayah-controls">
                  <button 
                    @click="isAyahPlaying(ayah.numberInSurah) ? togglePlayPause() : playAyah(surah.ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah))" 
                    class="btn btn-sm"
                    :class="isAyahPlaying(ayah.numberInSurah) ? (isPlaying ? 'btn-success' : 'btn-outline-success') : 'btn-outline-success'"
                  >
                    <i class="bi" :class="isAyahPlaying(ayah.numberInSurah) ? (isPlaying ? 'bi-pause-fill' : 'bi-play-fill') : 'bi-play-fill'"></i>
                  </button>
                  <button 
                    @click="toggleAyahBookmark(surah.ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah))" 
                    class="btn btn-sm" 
                    :class="ayahBookmarks[ayah.numberInSurah] ? 'btn-warning' : 'btn-outline-secondary'"
                  >
                    <i class="bi" :class="ayahBookmarks[ayah.numberInSurah] ? 'bi-bookmark-star-fill' : 'bi-bookmark-star'"></i>
                  </button>
                </span>
              </span>
            </template>
          </div>
        </div>
        
        <!-- Tampilkan info halaman mushaf -->
        <div class="card-footer bg-light">
          <div class="d-flex justify-content-center align-items-center">
            <span class="badge bg-secondary me-3">
              Mushaf halaman: {{ currentMushaPage }}
            </span>
            <span class="text-muted">
              Ayat: {{ currentMushaPageAyahs.length > 0 ? 
              `${currentMushaPageAyahs[0].numberInSurah} - ${currentMushaPageAyahs[currentMushaPageAyahs.length-1].numberInSurah}` : '0' }}
            </span>
          </div>
        </div>
        
        <!-- Pagination controls -->
        <div class="card-footer">
          <nav aria-label="Page navigation">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="prevPage">
                  <i class="bi bi-chevron-left"></i>
                </a>
              </li>
              
              <!-- Show first page -->
              <li class="page-item" :class="{ active: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="goToPage(1)">1</a>
              </li>
              
              <!-- Ellipsis if needed -->
              <li class="page-item disabled" v-if="currentPage > 3">
                <span class="page-link">...</span>
              </li>
              
              <!-- Show current page and adjacent pages -->
              <template v-for="offset in [-1, 0, 1]" :key="'page-' + (currentPage + offset)">
                <li 
                  v-if="(currentPage + offset) > 1 && (currentPage + offset) < totalPages"
                  class="page-item" 
                  :class="{ active: offset === 0 }"
                >
                  <a class="page-link" href="#" @click.prevent="goToPage(currentPage + offset)">
                    {{ currentPage + offset }}
                  </a>
                </li>
              </template>
              
              <!-- Ellipsis if needed -->
              <li class="page-item disabled" v-if="currentPage < totalPages - 2">
                <span class="page-link">...</span>
              </li>
              
              <!-- Show last page -->
              <li class="page-item" :class="{ active: currentPage === totalPages }" v-if="totalPages > 1">
                <a class="page-link" href="#" @click.prevent="goToPage(totalPages)">{{ totalPages }}</a>
              </li>
              
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="nextPage">
                  <i class="bi bi-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
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
}

.currently-playing .card-body {
  background-color: rgba(40, 167, 69, 0.05);
}

.card, .currently-playing {
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

.highlight-ayah {
  animation: highlight-pulse 3s ease;
}

@keyframes highlight-pulse {
  0% { background-color: rgba(255, 193, 7, 0.1); }
  50% { background-color: rgba(255, 193, 7, 0.3); }
  100% { background-color: rgba(255, 193, 7, 0); }
}

.ayah-action-dropdown .dropdown-menu {
  z-index: 1100; /* Higher than Bootstrap's default */
  position: absolute !important;
}

/* Fix positioning issues */
.card {
  overflow: visible !important; /* Ensures dropdowns aren't cut off */
}

/* Prevent hover issues */
.dropdown-menu.show {
  transform: translate3d(0px, -100%, 0px) !important; /* Force dropdown to appear above the button */
}

.mushaf-page {
  text-align: right;
  direction: rtl;
  line-height: 2.5;
  padding: 1rem;
  background-color: #fff9f0; /* Warna background sedikit kekuningan seperti kertas */
}

.ayah-text {
  display: inline;
}

.ayah-number {
  display: inline-block;
  font-family: Arial, sans-serif;
  font-size: 0.8em;
  width: auto;
  min-width: 25px;
  padding: 0 5px;
  height: 25px;
  line-height: 25px;
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 50%;
  margin: 0 5px;
  position: relative;
  cursor: pointer;
  border: 2px solid #28a745;
  color: #28a745;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(40, 167, 69, 0.3);
  transition: all 0.2s ease;
}

.ayah-number:hover {
  background-color: #28a745;
  color: white;
  transform: scale(1.1);
}

.ayah-controls {
  display: none;
  position: absolute;
  bottom: -40px;
  right: 0;
  background-color: white;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 10;
  transition: visibility 0s, opacity 0.3s;
  opacity: 0;
  visibility: hidden;
}

.ayah-container {
  position: relative;
  display: inline-block;
}

.ayah-container:hover .ayah-controls {
  display: inline-block;
  opacity: 1;
  visibility: visible;
}

.ayah-number:hover + .ayah-controls {
  display: inline-block;
  opacity: 1;
  visibility: visible;
}

.ayah-number:hover + .ayah-controls,
.ayah-controls:hover {
  display: inline-block;
}

.pagination .page-link {
  color: var(--primary-color);
}

.pagination .page-item.active .page-link {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.view-mode-toggle {
  text-align: center;
}

/* Memperbaiki ikon mode */
.view-mode-toggle .btn-group .btn .bi {
  margin-right: 4px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.ayah-number.playing {
  background-color: #28a745;
  color: white;
  border-color: #28a745;
  animation: pulse 1s infinite;
}

.book-mode .card-footer.bg-light {
  border-top: 1px dashed #dee2e6;
  padding: 0.75rem;
}

.mushaf-page {
  min-height: 60vh;
  background-image: linear-gradient(to bottom, #fff9f0 0%, #fff9f0 99%);
  background-size: 100% 2.5em;
  background-attachment: local;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
  padding: 1.5rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  position: relative;
}

.mushaf-page::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #28a745;
  opacity: 0.3;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

input[type="number"] {
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

.highlight-ayah {
  animation: highlight-pulse 3s ease;
}

@keyframes highlight-pulse {
  0% { background-color: rgba(40, 167, 69, 0.1); }
  50% { background-color: rgba(40, 167, 69, 0.3); }
  100% { background-color: rgba(40, 167, 69, 0); }
}
</style>