import React, { useEffect, useRef, useState } from 'react';
import { Play, FastForward, Plus, Minus, AlertTriangle, Users, Flame } from 'lucide-react';
import { Soal, Game1RoundType, GameSettings, TeamScore, SoalHistoryItem, Pengecoh } from '../types';
import { faceDetectorService, FaceBox } from '../utils/faceDetector';
import { soundManager } from '../utils/sound';
import { ExplanationCard } from './ExplanationCard';

interface Game1KiriKananProps {
  questions: Soal[];
  settings: GameSettings;
  isMirrored: boolean;
  onFinishGame: (history: SoalHistoryItem[], totalScore: number, teamScores?: TeamScore[]) => void;
  onReturnMenu: () => void;
}

interface RoundConfig {
  type: Game1RoundType;
  promptTeks: string;
  leftTeks: string;
  rightTeks: string;
  correctSide: 'kiri' | 'kanan';
  baseDuration: number;
  scoreMultiplier: number;
  jawabanSalahObj?: Pengecoh;
}

export const Game1KiriKanan: React.FC<Game1KiriKananProps> = ({
  questions,
  settings,
  isMirrored,
  onFinishGame,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [totalDuration, setTotalDuration] = useState<number>(15);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Deteksi & Hitungan Manual
  const [detectedBoxes, setDetectedBoxes] = useState<FaceBox[]>([]);
  const [countLeft, setCountLeft] = useState<number>(0);
  const [countRight, setCountRight] = useState<number>(0);
  const [noFaceCounter, setNoFaceCounter] = useState<number>(0); // hitung detik tanpa wajah terdeteksi
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);

  // Skor & Tim
  const [totalScore, setTotalScore] = useState<number>(0);
  const [teamScores, setTeamScores] = useState<TeamScore[]>(() => {
    return settings.namaTim.slice(0, settings.jumlahTim).map((nama) => ({
      nama,
      skor: 0,
      benar: 0,
      salah: 0,
      tereliminasi: false,
    }));
  });
  const [currentTeamIdx, setCurrentTeamIdx] = useState<number>(0);

  // Eliminasi peserta (jika mode eliminasi)
  const [eliminationParticipantsLeft, setEliminationParticipantsLeft] = useState<number>(30); // perkiraan awal peserta kelas

  // Riwayat Permainan
  const [history, setHistory] = useState<SoalHistoryItem[]>([]);

  // Setup Kamera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Round Configuration untuk soal saat ini
  const currentSoal = questions[currentIdx];
  const [roundConfig, setRoundConfig] = useState<RoundConfig | null>(null);

  // Inisialisasi jenis ronde saat soal berganti
  useEffect(() => {
    if (!currentSoal) return;

    // Tentukan jenis ronde: diacak dari 4 variasi
    const roundTypes: Game1RoundType[] = ['pilih-ab', 'benar-salah', 'bukan', 'kilat'];
    const selectedType = roundTypes[Math.floor(Math.random() * roundTypes.length)];

    let baseDuration = currentSoal.level === 1 ? 20 : currentSoal.level === 2 ? 15 : 12;
    let scoreMultiplier = 1;

    let promptTeks = currentSoal.pertanyaan;
    let leftTeks = '';
    let rightTeks = '';
    let correctSide: 'kiri' | 'kanan' = 'kiri';
    let chosenWrong: Pengecoh = currentSoal.pengecoh[Math.floor(Math.random() * currentSoal.pengecoh.length)];

    if (selectedType === 'kilat') {
      baseDuration = Math.max(7, Math.round(baseDuration / 2));
      scoreMultiplier = 2;
      // Format pilih A / B cepat
      const isCorrectLeft = Math.random() > 0.5;
      correctSide = isCorrectLeft ? 'kiri' : 'kanan';
      leftTeks = isCorrectLeft ? currentSoal.jawabanBenar : chosenWrong.teks;
      rightTeks = isCorrectLeft ? chosenWrong.teks : currentSoal.jawabanBenar;
    } else if (selectedType === 'benar-salah') {
      // Benar atau Salah: Kiri = BENAR, Kanan = SALAH
      leftTeks = 'BENAR';
      rightTeks = 'SALAH';
      const isTruth = Math.random() > 0.5;
      if (isTruth) {
        correctSide = 'kiri';
        promptTeks = `PERNYATAAN: "${currentSoal.pertanyaan.replace(/\.\.\.$/, '')} adalah ${currentSoal.jawabanBenar}."`;
      } else {
        correctSide = 'kanan';
        promptTeks = `PERNYATAAN: "${currentSoal.pertanyaan.replace(/\.\.\.$/, '')} adalah ${chosenWrong.teks}."`;
      }
    } else if (selectedType === 'bukan') {
      // Cari yang BUKAN: Sisi yang benar adalah sisi yang berisi pengecoh (karena itu yang BUKAN jawaban aslinya)
      const cleanQ = currentSoal.pertanyaan.replace(/\.\.\.$/, '');
      promptTeks = `Manakah yang BUKAN merupakan konsep dari: "${cleanQ}"?`;
      const isWrongLeft = Math.random() > 0.5;
      correctSide = isWrongLeft ? 'kiri' : 'kanan';
      leftTeks = isWrongLeft ? chosenWrong.teks : currentSoal.jawabanBenar;
      rightTeks = isWrongLeft ? currentSoal.jawabanBenar : chosenWrong.teks;
    } else {
      // Standard 'pilih-ab'
      const isCorrectLeft = Math.random() > 0.5;
      correctSide = isCorrectLeft ? 'kiri' : 'kanan';
      leftTeks = isCorrectLeft ? currentSoal.jawabanBenar : chosenWrong.teks;
      rightTeks = isCorrectLeft ? chosenWrong.teks : currentSoal.jawabanBenar;
    }

    setRoundConfig({
      type: selectedType,
      promptTeks,
      leftTeks,
      rightTeks,
      correctSide,
      baseDuration,
      scoreMultiplier,
      jawabanSalahObj: chosenWrong,
    });

    setTimeLeft(baseDuration);
    setTotalDuration(baseDuration);
    setIsLocked(false);
    setShowExplanation(false);
    setCountLeft(0);
    setCountRight(0);
    faceDetectorService.resetHistory();
  }, [currentIdx, currentSoal]);

  // Aktifkan Kamera
  useEffect(() => {
    let isMounted = true;
    const initCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraAvailable(true);
      } catch (e) {
        console.warn('Camera failed to start:', e);
        setCameraAvailable(false);
      }
    };

    initCam();
    faceDetectorService.loadModel();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Loop Deteksi Wajah (setiap ~250ms)
  useEffect(() => {
    if (isLocked || !cameraAvailable) return;

    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const cWidth = canvasRef.current.width || 640;
        const cHeight = canvasRef.current.height || 480;

        const result = await faceDetectorService.detectFaces(
          videoRef.current,
          cWidth,
          cHeight,
          isMirrored
        );

        setDetectedBoxes(result.boxes);
        if (result.boxes.length > 0) {
          setCountLeft(result.countLeft);
          setCountRight(result.countRight);
          setNoFaceCounter(0);
        } else {
          setNoFaceCounter((prev) => prev + 0.25);
        }

        // Gambar Kotak Wajah di Canvas
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cWidth, cHeight);

          result.boxes.forEach((box) => {
            ctx.lineWidth = 4;
            if (box.side === 'kiri') {
              ctx.strokeStyle = '#14b8a6'; // Teal
              ctx.fillStyle = 'rgba(20, 184, 166, 0.25)';
            } else {
              ctx.strokeStyle = '#f97316'; // Orange
              ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
            }
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            ctx.fillRect(box.x, box.y, box.width, box.height);
          });
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isLocked, cameraAvailable, isMirrored]);

  // Timer Hitung Mundur
  useEffect(() => {
    if (isLocked || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          lockAnswer();
          return 0;
        }
        if (prev <= 6) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, timeLeft]);

  // Fungsi Mengunci Jawaban saat waktu habis atau tombol "Akhiri Lebih Awal"
  const lockAnswer = () => {
    if (isLocked || !roundConfig) return;
    setIsLocked(true);

    const isCorrectSideLeft = roundConfig.correctSide === 'kiri';
    const studentsOnCorrect = isCorrectSideLeft ? countLeft : countRight;
    const studentsOnWrong = isCorrectSideLeft ? countRight : countLeft;

    // Perhitungan Poin: Jumlah siswa di sisi benar x 10 x pengali ronde
    // Jika tidak ada siswa terdeteksi (misal guru main sendiri atau solo), minimal 1 benar jika memilih benar
    const earnedPoints = studentsOnCorrect * 10 * roundConfig.scoreMultiplier;

    if (earnedPoints > 0) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    setTotalScore((prev) => prev + earnedPoints);

    // Update Skor Tim jika mode tim aktif
    if (teamScores.length > 0) {
      setTeamScores((prev) => {
        const copy = [...prev];
        const team = copy[currentTeamIdx];
        if (team) {
          team.skor += earnedPoints;
          if (earnedPoints > 0) team.benar += 1;
          else team.salah += 1;
        }
        return copy;
      });
    }

    // Update Mode Eliminasi jika aktif
    if (settings.eliminationMode) {
      setEliminationParticipantsLeft((prev) => Math.max(1, prev - studentsOnWrong));
    }

    // Catat ke riwayat
    const historyItem: SoalHistoryItem = {
      soal: currentSoal,
      rondeType: roundConfig.type,
      jawabanTerpilih: isCorrectSideLeft ? roundConfig.leftTeks : roundConfig.rightTeks,
      jawabanBenar: currentSoal.jawabanBenar,
      isCorrect: earnedPoints > 0,
      poinDidapat: earnedPoints,
      timName: teamScores[currentTeamIdx]?.nama,
      deteksiKiri: countLeft,
      deteksiKanan: countRight,
    };

    setHistory((prev) => [...prev, historyItem]);

    // Tampilkan kartu penjelasan setelah 1.2 detik jeda dramatis penguncian
    setTimeout(() => {
      setShowExplanation(true);
    }, 1400);
  };

  // Navigasi ke Soal Berikutnya atau Selesai
  const handleNextSoal = () => {
    setShowExplanation(false);

    // Jika mode eliminasi dan peserta sisa <= 1, langsung selesai!
    if (settings.eliminationMode && eliminationParticipantsLeft <= 1) {
      onFinishGame(history, totalScore, teamScores.length > 1 ? teamScores : undefined);
      return;
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      // Ganti giliran tim berikutnya
      if (teamScores.length > 1) {
        setCurrentTeamIdx((prev) => (prev + 1) % teamScores.length);
      }
    } else {
      // Selesai seluruh soal
      onFinishGame(history, totalScore, teamScores.length > 1 ? teamScores : undefined);
    }
  };

  if (!roundConfig) return null;

  const currentTeam = teamScores[currentTeamIdx];
  const timerPercent = (timeLeft / totalDuration) * 100;
  const isCorrectLeft = roundConfig.correctSide === 'kiri';
  const isCorrectRight = roundConfig.correctSide === 'kanan';

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Video Kamera Transparan */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Bagian Atas: Pertanyaan & Banner Ronde */}
      <div className="relative z-10 p-4 sm:p-6 max-w-5xl mx-auto w-full text-center">
        {/* Badge Tipe Ronde */}
        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
          {roundConfig.type === 'kilat' && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black tracking-wider flex items-center gap-1.5 animate-pulse">
              <Flame className="w-4 h-4" /> RONDE KILAT (POIN ×2)
            </span>
          )}
          {roundConfig.type === 'benar-salah' && (
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black tracking-wider">
              TENTUKAN: BENAR ATAU SALAH
            </span>
          )}
          {roundConfig.type === 'bukan' && (
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black tracking-wider">
              CARI YANG BUKAN
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 text-xs font-semibold">
            {currentSoal.topik}
          </span>
          {settings.eliminationMode && (
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Sisa: {eliminationParticipantsLeft} Siswa
            </span>
          )}
        </div>

        {/* Teks Pertanyaan Berukuran Sangat Besar */}
        <div className="bg-slate-900/85 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-slate-700/80 shadow-2xl">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-snug tracking-tight">
            {roundConfig.promptTeks}
          </h1>
        </div>

        {/* Saran Pencahayaan jika >3 detik tidak ada wajah */}
        {noFaceCounter > 3 && cameraAvailable && !isLocked && (
          <div className="mt-2 py-1 px-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Wajah belum terdeteksi. Pastikan cahaya terang atau gunakan tombol (+/−) di bawah untuk hitungan manual.</span>
          </div>
        )}
      </div>

      {/* Bagian Tengah: Dua Sisi (Kiri Teal vs Kanan Oranye) + Timer Lingkaran di Tengah */}
      <div className="relative z-10 flex-1 grid grid-cols-2 gap-4 sm:gap-8 px-4 sm:px-8 py-2 items-center max-w-7xl mx-auto w-full">
        {/* SISI KIRI (PILIHAN A - TEAL) */}
        <div
          className={`h-full min-h-[260px] sm:min-h-[340px] rounded-3xl p-4 sm:p-8 flex flex-col justify-between transition-all duration-500 relative border-4 ${
            isLocked
              ? isCorrectLeft
                ? 'bg-emerald-950/90 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 opacity-40 grayscale'
              : 'bg-teal-950/80 hover:bg-teal-950/90 border-teal-500/60 shadow-2xl'
          }`}
        >
          {/* Label Sisi A */}
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-sm font-black tracking-wider">
              SISI A (KIRI)
            </span>
            {isLocked && isCorrectLeft && (
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black animate-bounce">
                ★ JAWABAN BENAR!
              </span>
            )}
          </div>

          {/* Teks Pilihan A */}
          <div className="my-auto text-center py-4">
            <p className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-md">
              {roundConfig.leftTeks}
            </p>
          </div>

          {/* Hitungan Siswa & Koreksi Manual */}
          <div className="flex items-center justify-between pt-4 border-t border-teal-500/30">
            <div>
              <span className="text-xs text-teal-300 font-bold block uppercase tracking-wider">Peserta di Kiri:</span>
              <span className="text-3xl sm:text-5xl font-black text-teal-400">{countLeft}</span>
            </div>

            {/* Tombol Manual A+ / A- */}
            {!isLocked && (
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-teal-500/40">
                <button
                  onClick={() => setCountLeft((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 transition"
                  title="Kurang 1 Peserta di Kiri"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCountLeft((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                  title="Tambah 1 Peserta di Kiri"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TIMER LINGKARAN & TOMBOL CEPAT DI TENGAH */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
          {/* Lingkaran Countdown */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-950/90 border-4 border-slate-700 shadow-2xl flex items-center justify-center pointer-events-auto">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * timerPercent) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${
                  timeLeft <= 5 ? 'text-rose-500' : 'text-cyan-400'
                }`}
                fill="transparent"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span
                className={`text-2xl sm:text-4xl font-black ${
                  timeLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-white'
                }`}
              >
                {timeLeft}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400">Detik</span>
            </div>
          </div>

          {/* Tombol Akhiri Lebih Awal */}
          {!isLocked && (
            <button
              onClick={lockAnswer}
              className="mt-3 pointer-events-auto px-4 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 shadow-lg transition active:scale-95 flex items-center gap-1.5"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Kunci Sekarang</span>
            </button>
          )}
        </div>

        {/* SISI KANAN (PILIHAN B - ORANGE) */}
        <div
          className={`h-full min-h-[260px] sm:min-h-[340px] rounded-3xl p-4 sm:p-8 flex flex-col justify-between transition-all duration-500 relative border-4 ${
            isLocked
              ? isCorrectRight
                ? 'bg-emerald-950/90 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 opacity-40 grayscale'
              : 'bg-orange-950/80 hover:bg-orange-950/90 border-orange-500/60 shadow-2xl'
          }`}
        >
          {/* Label Sisi B */}
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 text-sm font-black tracking-wider">
              SISI B (KANAN)
            </span>
            {isLocked && isCorrectRight && (
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black animate-bounce">
                ★ JAWABAN BENAR!
              </span>
            )}
          </div>

          {/* Teks Pilihan B */}
          <div className="my-auto text-center py-4">
            <p className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-md">
              {roundConfig.rightTeks}
            </p>
          </div>

          {/* Hitungan Siswa & Koreksi Manual */}
          <div className="flex items-center justify-between pt-4 border-t border-orange-500/30">
            <div>
              <span className="text-xs text-orange-300 font-bold block uppercase tracking-wider">Peserta di Kanan:</span>
              <span className="text-3xl sm:text-5xl font-black text-orange-400">{countRight}</span>
            </div>

            {/* Tombol Manual B+ / B- */}
            {!isLocked && (
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-orange-500/40">
                <button
                  onClick={() => setCountRight((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 transition"
                  title="Kurang 1 Peserta di Kanan"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCountRight((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold transition"
                  title="Tambah 1 Peserta di Kanan"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Bar Info Tim & Skor */}
      <div className="relative z-10 p-4 max-w-7xl mx-auto w-full flex items-center justify-between bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {currentTeam && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tim Aktif:</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm">
                {currentTeam.nama} ({currentTeam.skor} Poin)
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Siswa berdiri di sisi kiri atau kanan proyektor sesuai pilihan jawaban
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Total Akumulasi:</span>
          <span className="text-xl font-black text-cyan-400">{totalScore} Pts</span>
        </div>
      </div>

      {/* Kartu Penjelasan Edukatif Muncul Setelah Jawaban Terkunci */}
      {showExplanation && (
        <ExplanationCard
          soal={currentSoal}
          jawabanBenarTeks={currentSoal.jawabanBenar}
          jawabanSalahTeks={roundConfig.jawabanSalahObj?.teks}
          alasanSalahTeks={roundConfig.jawabanSalahObj?.alasan}
          pengecohList={currentSoal.pengecoh}
          isCorrect={
            (roundConfig.correctSide === 'kiri' ? countLeft : countRight) > 0
          }
          poinDidapat={
            (roundConfig.correctSide === 'kiri' ? countLeft : countRight) *
            10 *
            roundConfig.scoreMultiplier
          }
          onNextSoal={handleNextSoal}
          isLastSoal={currentIdx + 1 >= questions.length}
          roundTypeName={roundConfig.type.toUpperCase()}
        />
      )}
    </div>
  );
};
