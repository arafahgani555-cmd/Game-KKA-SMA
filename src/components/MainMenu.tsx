import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Hand,
  Settings,
  Users,
  ShieldCheck,
  Video,
  FlipHorizontal,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';
import { GameMode, GameSettings, Level } from '../types';
import { TOPIK_LIST, getAllSoal, getSeenSoalIds, clearSeenHistory } from '../data/bankSoal';

interface MainMenuProps {
  onStartGame: (gameMode: GameMode, settings: GameSettings) => void;
  onOpenCamTest: () => void;
  onOpenInstructions: () => void;
  isMirrored: boolean;
  onToggleMirror: () => void;
  onOpenEditSoal?: () => void;
}

const QUICK_COUNTS = [10, 15, 20, 25, 30, 50, 100];

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenCamTest,
  onOpenInstructions,
  isMirrored,
  onToggleMirror,
  onOpenEditSoal,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameMode>('kiri-kanan');
  const [jumlahSoal, setJumlahSoal] = useState<number>(15);
  const [customInputCount, setCustomInputCount] = useState<string>('15');
  const [selectedTopik, setSelectedTopik] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [avoidSeen, setAvoidSeen] = useState<boolean>(true);
  const [jumlahTim, setJumlahTim] = useState<1 | 2 | 3 | 4>(1);
  const [namaTim, setNamaTim] = useState<string[]>([
    'Tim Pixel',
    'Tim Vektor',
    'Tim Audio',
    'Tim Render',
  ]);
  const [eliminationMode, setEliminationMode] = useState<boolean>(false);

  const allSoal = getAllSoal();
  const seenIds = getSeenSoalIds();

  // Hitung jumlah soal tersedia berdasarkan filter saat ini
  let availablePool = allSoal;
  if (selectedTopik.length > 0) {
    availablePool = availablePool.filter((s) => selectedTopik.includes(s.topik));
  }
  if (levelFilter !== 'all') {
    availablePool = availablePool.filter((s) => s.level === Number(levelFilter));
  }
  const unseenPoolCount = availablePool.filter((s) => !seenIds.includes(s.id)).length;

  const handleSelectAllTopik = () => {
    setSelectedTopik([]); // array kosong berarti semua topik
  };

  const handleToggleTopik = (topik: string) => {
    if (selectedTopik.includes(topik)) {
      setSelectedTopik(selectedTopik.filter((t) => t !== topik));
    } else {
      setSelectedTopik([...selectedTopik, topik]);
    }
  };

  const handleCountChange = (val: number) => {
    const clamped = Math.max(10, Math.min(100, val));
    setJumlahSoal(clamped);
    setCustomInputCount(String(clamped));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomInputCount(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed)) {
      setJumlahSoal(Math.max(10, Math.min(100, parsed)));
    }
  };

  const handleStart = () => {
    const settings: GameSettings = {
      jumlahSoal,
      selectedTopik,
      levelFilter,
      avoidSeenQuestions: avoidSeen,
      jumlahTim,
      namaTim,
      eliminationMode: selectedGame === 'kiri-kanan' ? eliminationMode : false,
    };
    onStartGame(selectedGame, settings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">
        {/* Banner Hero & Judul */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Koding & Kecerdasan Artifisial (KKA) Kelas X SMA
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              KONTEN DIGITAL <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">MULTIMEDIA</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Arena kuis interaktif dengan AI kamera lokal. Belajar elemen multimedia, produksi, grafis digital, hingga etika AI!
            </p>
          </div>

          {/* Tombol Aksi Cepat Kamera & Privasi */}
          <div className="relative z-10 flex flex-wrap gap-2.5 justify-center md:justify-end">
            <button
              onClick={onOpenCamTest}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Uji Kamera</span>
            </button>
            <button
              onClick={onToggleMirror}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 ${
                isMirrored
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span>Cermin: {isMirrored ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={onOpenInstructions}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Petunjuk</span>
            </button>
          </div>
        </div>

        {/* Pernyataan Privasi Singkat */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Privasi Aman:</strong> Seluruh pemrosesan video kamera diproses lokal di browser perangkat Anda; tidak ada data video yang dikirim ke server.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            Offline & Local Only
          </span>
        </div>

        {/* Pemilihan Dua Game */}
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> PILIH GAME EDUKASI:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Game 1: Kiri atau Kanan */}
            <div
              onClick={() => setSelectedGame('kiri-kanan')}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                selectedGame === 'kiri-kanan'
                  ? 'bg-gradient-to-br from-teal-950/90 to-slate-900 border-cyan-400 shadow-2xl shadow-cyan-500/20 scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 w-fit">
                    <ArrowLeftRight className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Tiny Face Detector
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">1. Kiri atau Kanan</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Siswa berdiri dan bergeser di sisi kiri (Teal - Pilihan A) atau sisi kanan (Oranye - Pilihan B). Kamera menghitung jumlah wajah siswa di tiap sisi!
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Pilihan A/B</span>
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Benar/Salah</span>
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Cari BUKAN</span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">Ronde Kilat</span>
                </div>
              </div>

              {selectedGame === 'kiri-kanan' && (
                <div className="mt-4 pt-3 border-t border-teal-500/30 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={eliminationMode}
                      onChange={(e) => setEliminationMode(e.target.checked)}
                      className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Aktifkan Mode Eliminasi (Salah = Duduk)</span>
                  </label>
                  <span className="text-cyan-400 font-black text-xs">PILIHAN AKTIF ✓</span>
                </div>
              )}
            </div>

            {/* Game 2: Tangkap Kata */}
            <div
              onClick={() => setSelectedGame('tangkap-kata')}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                selectedGame === 'tangkap-kata'
                  ? 'bg-gradient-to-br from-amber-950/90 to-slate-900 border-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 w-fit">
                    <Hand className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Motion Detection
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">2. Tangkap Kata</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Lambaikan tangan di depan kamera atau sentuh layar untuk menangkap kapsul kata jawaban benar yang meluncur turun dari atas. Awas kata jebakan!
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Tangkap Satu</span>
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Tangkap Semua</span>
                  <span className="text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg">Urutkan Tahapan</span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">Bintang Bonus</span>
                </div>
              </div>

              {selectedGame === 'tangkap-kata' && (
                <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-end">
                  <span className="text-amber-400 font-black text-xs">PILIHAN AKTIF ✓</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pengaturan Sesi & Filter Soal */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              PENGATURAN SESI & JUMLAH SOAL
            </h2>
            <span className="text-xs text-slate-400">
              Total Soal Tersedia: <strong className="text-cyan-300">{availablePool.length}</strong>
            </span>
          </div>

          {/* 1. PEMILIH JUMLAH SOAL */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Jumlah Soal yang Dimainkan:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => handleCountChange(count)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                    jumlahSoal === count
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {count}
                </button>
              ))}

              {/* Input Angka Bebas 10 - 100 */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-slate-400">Atau ketik bebas (10–100):</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={customInputCount}
                  onChange={handleCustomInputChange}
                  className="w-20 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center font-black text-cyan-300 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            {jumlahSoal > availablePool.length && (
              <p className="text-xs text-amber-300 font-semibold">
                * Catatan: Jumlah soal yang diminta ({jumlahSoal}) akan disesuaikan otomatis dengan {availablePool.length} soal yang tersedia di bank soal saat ini.
              </p>
            )}
          </div>

          {/* 2. FILTER TINGKAT KESULITAN */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Tingkat Kesulitan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'all', label: 'Campuran (Semua Level)' },
                { id: '1', label: 'Level 1: Mudah' },
                { id: '2', label: 'Level 2: Sedang' },
                { id: '3', label: 'Level 3: Sulit' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevelFilter(lvl.id as 'all' | '1' | '2' | '3')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    levelFilter === lvl.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. FILTER TOPIK (Centang 1 atau beberapa dari 10 topik) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pilih Topik Materi KKA:
              </label>
              <button
                onClick={handleSelectAllTopik}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                {selectedTopik.length === 0 ? '✓ Semua Topik Aktif' : 'Pilih Semua Topik'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
              {TOPIK_LIST.map((topik, idx) => {
                const isChecked = selectedTopik.length === 0 || selectedTopik.includes(topik);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleTopik(topik)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition ${
                      isChecked
                        ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate">{topik}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. RIWAYAT SOAL (Hindari yang sudah muncul) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-200">
              <input
                type="checkbox"
                checked={avoidSeen}
                onChange={(e) => setAvoidSeen(e.target.checked)}
                className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
              />
              <span>Hindari soal yang sudah muncul di sesi sebelumnya</span>
            </label>
            {seenIds.length > 0 && (
              <button
                onClick={clearSeenHistory}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset Riwayat ({seenIds.length} soal)
              </button>
            )}
          </div>

          {/* 5. MODE TIM (1 Kelas atau 2–4 Tim) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Mode Tim Permainan:
              </label>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                {([1, 2, 3, 4] as const).map((num) => (
                  <button
                    key={num}
                    onClick={() => setJumlahTim(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                      jumlahTim === num
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {num === 1 ? '1 Kelas' : `${num} Tim`}
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Tim jika 2-4 Tim */}
            {jumlahTim > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {Array.from({ length: jumlahTim }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tim {i + 1}</span>
                    <input
                      type="text"
                      value={namaTim[i] || `Tim ${i + 1}`}
                      onChange={(e) => {
                        const copy = [...namaTim];
                        copy[i] = e.target.value;
                        setNamaTim(copy);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tombol Mulai Permainan & Edit Soal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {onOpenEditSoal ? (
            <button
              onClick={onOpenEditSoal}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Kelola & Edit Bank Soal</span>
            </button>
          ) : <div />}

          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950 font-black text-lg tracking-wide shadow-2xl shadow-cyan-500/30 flex items-center justify-center gap-3 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>MULAI PERMAINAN SEKARANG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
