import { Soal } from '../types';
import { bank01 } from './bank01';
import { bank02 } from './bank02';
import { bank03 } from './bank03';
import { bank04 } from './bank04';

// Daftar topik standar KKA Konten Digital Multimedia
export const TOPIK_LIST = [
  'Pengertian dan Elemen Multimedia',
  'Interaktivitas, Perkembangan Multimedia, AR dan VR',
  'Perangkat Lunak Pembuat Konten',
  'Tahapan Produksi dan Storyboard',
  'Gambar Digital (Bitmap, Vektor, Warna)',
  'Audio dan Video Digital',
  'Format File dan Kompresi',
  'Hak Cipta, Lisensi CC, dan Etika',
  'Publikasi, SEO, dan Distribusi',
  'AI dan Koding dalam Konten Digital',
];

const LOCAL_STORAGE_CUSTOM_SOAL_KEY = 'kka_custom_soal_v1';
const LOCAL_STORAGE_SEEN_IDS_KEY = 'kka_seen_soal_ids_v1';

// Base bank soal gabungan (Lengkap 100 Soal: bank01 s/d bank04)
export function getBaseBank(): Soal[] {
  return [...bank01, ...bank02, ...bank03, ...bank04];
}

// Mendapatkan semua soal gabungan (soal bawaan + soal tambahan dari localStorage)
export function getAllSoal(): Soal[] {
  const base = getBaseBank();
  try {
    const custom = localStorage.getItem(LOCAL_STORAGE_CUSTOM_SOAL_KEY);
    if (custom) {
      const parsed: Soal[] = JSON.parse(custom);
      if (Array.isArray(parsed)) {
        return [...base, ...parsed];
      }
    }
  } catch (e) {
    console.error('Error reading custom soal:', e);
  }
  return base;
}

// Simpan soal kustom
export function saveCustomSoal(customList: Soal[]) {
  localStorage.setItem(LOCAL_STORAGE_CUSTOM_SOAL_KEY, JSON.stringify(customList));
}

// Reset soal kustom ke bawaan
export function resetCustomSoal() {
  localStorage.removeItem(LOCAL_STORAGE_CUSTOM_SOAL_KEY);
}

// Riwayat soal yang pernah muncul di sesi sebelumnya
export function getSeenSoalIds(): number[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SEEN_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markSoalAsSeen(ids: number[]) {
  try {
    const current = new Set(getSeenSoalIds());
    ids.forEach((id) => current.add(id));
    localStorage.setItem(LOCAL_STORAGE_SEEN_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

export function clearSeenHistory() {
  localStorage.removeItem(LOCAL_STORAGE_SEEN_IDS_KEY);
}

// Helper untuk mengambil sejumlah soal dengan filter topik, level, dan hindari soal sebelumnya
export function selectQuestions(
  requestedCount: number,
  selectedTopik: string[],
  levelFilter: 'all' | '1' | '2' | '3',
  avoidSeen: boolean
): { questions: Soal[]; adjustedCount: number; message?: string } {
  let pool = getAllSoal();

  // Filter topik jika dipilih
  if (selectedTopik.length > 0) {
    pool = pool.filter((s) => selectedTopik.includes(s.topik));
  }

  // Filter level jika bukan 'all'
  if (levelFilter !== 'all') {
    const targetLevel = Number(levelFilter);
    pool = pool.filter((s) => s.level === targetLevel);
  }

  let finalPool = [...pool];

  // Hindari soal yang sudah dilihat jika diaktifkan
  if (avoidSeen) {
    const seenIds = new Set(getSeenSoalIds());
    const unseen = pool.filter((s) => !seenIds.has(s.id));
    if (unseen.length >= requestedCount) {
      finalPool = unseen;
    } else if (unseen.length > 0) {
      // Jika yang belum terlihat kurang dari jumlah yang diminta, gunakan yang belum terlihat ditambah sebagian yang sudah terlihat
      finalPool = pool;
    }
  }

  // Acak pool (Fisher-Yates shuffle)
  const shuffled = [...finalPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const actualCount = Math.min(requestedCount, shuffled.length);
  const selected = shuffled.slice(0, actualCount);

  let message: string | undefined = undefined;
  if (actualCount < requestedCount) {
    message = `Hanya tersedia ${actualCount} soal yang cocok dengan filter yang dipilih (dari ${requestedCount} yang diminta).`;
  }

  return {
    questions: selected,
    adjustedCount: actualCount,
    message,
  };
}
