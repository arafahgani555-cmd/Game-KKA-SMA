export type Level = 1 | 2 | 3; // 1: Mudah, 2: Sedang, 3: Sulit

export interface Pengecoh {
  teks: string;
  alasan: string;
  jebakan?: boolean;
}

export interface Soal {
  id: number;
  topik: string;
  level: Level;
  pertanyaan: string; // Kalimat yang diakhiri "..."
  jawabanBenar: string;
  penjelasan: string;
  pengecoh: [Pengecoh, Pengecoh, Pengecoh]; // 2 pengecoh biasa + 1 jebakan
  jawabanBenarTambahan?: string[]; // opsional untuk mode multi-tangkapan
  tahapanUrutan?: string[]; // opsional untuk mode urutan
}

export type GameMode = 'kiri-kanan' | 'tangkap-kata';

export type Game1RoundType = 
  | 'pilih-ab'       // Opsi A vs B
  | 'benar-salah'    // Kiri = BENAR, Kanan = SALAH
  | 'bukan'          // Cari yang BUKAN
  | 'kilat';         // Waktu setengah, poin x2

export type Game2RoundType =
  | 'tangkap-satu'
  | 'tangkap-semua'
  | 'urutkan'
  | 'bintang-bonus';

export interface GameSettings {
  jumlahSoal: number;
  selectedTopik: string[];
  levelFilter: 'all' | '1' | '2' | '3';
  avoidSeenQuestions: boolean;
  jumlahTim: 1 | 2 | 3 | 4;
  namaTim: string[];
  eliminationMode?: boolean; // Khusus Game 1
}

export interface TeamScore {
  nama: string;
  skor: number;
  benar: number;
  salah: number;
  tereliminasi?: boolean;
}

export interface SoalHistoryItem {
  soal: Soal;
  rondeType: string;
  jawabanTerpilih: string;
  jawabanBenar: string;
  isCorrect: boolean;
  poinDidapat: number;
  timName?: string;
  deteksiKiri?: number;
  deteksiKanan?: number;
}
