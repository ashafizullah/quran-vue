// src/utils/bookmarkStore.ts
import { ref, watch } from 'vue';

export interface SurahBookmark {
  surahNumber: number;
  surahName: string;
  timestamp: number;
}

export interface AyahBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  timestamp: number;
}

const SURAH_BOOKMARKS_KEY = 'quran-app-surah-bookmarks';
const AYAH_BOOKMARKS_KEY = 'quran-app-ayah-bookmarks';

// Initialize with data from localStorage
const surahBookmarks = ref<SurahBookmark[]>(
  JSON.parse(localStorage.getItem(SURAH_BOOKMARKS_KEY) || '[]')
);

const ayahBookmarks = ref<AyahBookmark[]>(
  JSON.parse(localStorage.getItem(AYAH_BOOKMARKS_KEY) || '[]')
);

// Watch for changes and update localStorage
watch(
  surahBookmarks,
  (newBookmarks) => {
    localStorage.setItem(SURAH_BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  },
  { deep: true }
);

watch(
  ayahBookmarks,
  (newBookmarks) => {
    localStorage.setItem(AYAH_BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  },
  { deep: true }
);

// Surah bookmark functions
export function addSurahBookmark(bookmark: Omit<SurahBookmark, 'timestamp'>): void {
  const exists = surahBookmarks.value.some(b => b.surahNumber === bookmark.surahNumber);
  
  if (!exists) {
    surahBookmarks.value.push({
      ...bookmark,
      timestamp: Date.now()
    });
  }
}

export function removeSurahBookmark(surahNumber: number): void {
  surahBookmarks.value = surahBookmarks.value.filter(
    bookmark => bookmark.surahNumber !== surahNumber
  );
}

export function isSurahBookmarked(surahNumber: number): boolean {
  return surahBookmarks.value.some(bookmark => bookmark.surahNumber === surahNumber);
}

export function getAllSurahBookmarks(): SurahBookmark[] {
  return [...surahBookmarks.value].sort((a, b) => a.surahNumber - b.surahNumber);
}

// Ayah bookmark functions
export function addAyahBookmark(bookmark: Omit<AyahBookmark, 'timestamp'>): void {
  const exists = ayahBookmarks.value.some(
    b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber
  );
  
  if (!exists) {
    ayahBookmarks.value.push({
      ...bookmark,
      timestamp: Date.now()
    });
  }
}

export function removeAyahBookmark(surahNumber: number, ayahNumber: number): void {
  ayahBookmarks.value = ayahBookmarks.value.filter(
    bookmark => !(bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber)
  );
}

export function isAyahBookmarked(surahNumber: number, ayahNumber: number): boolean {
  return ayahBookmarks.value.some(
    bookmark => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber
  );
}

export function getAllAyahBookmarks(): AyahBookmark[] {
  return [...ayahBookmarks.value].sort((a, b) => {
    // Sort by surah number first, then by ayah number
    if (a.surahNumber !== b.surahNumber) {
      return a.surahNumber - b.surahNumber;
    }
    return a.ayahNumber - b.ayahNumber;
  });
}