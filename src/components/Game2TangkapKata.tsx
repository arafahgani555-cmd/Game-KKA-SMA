import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Flame,
  Volume2,
  Hand,
  Sliders,
  Gauge,
  Star,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Soal, GameSettings, TeamScore, SoalHistoryItem, Pengecoh, Game2RoundType } from '../types';
import { soundManager } from '../utils/sound';
import { ExplanationCard } from './ExplanationCard';

interface Game2TangkapKataProps {
  questions: Soal[];
  settings: GameSettings;
  isMirrored: boolean;
  onFinishGame: (history: SoalHistoryItem[], totalScore: number, teamScores?: TeamScore[]) => void;
  onReturnMenu: () => void;
}

interface CapsuleItem {
  id: string;
  teks: string;
  isCorrect: boolean;
  isTrap?: boolean;
  isBonusStar?: boolean;
  alasan?: string;
  lane: number; // 0, 1, 2, 3
  y: number; // in percentage of screen height (0 - 100)
  speed: number;
  caught: boolean;
  consecutiveMotionFrames: number;
  stepIndex?: number; // untuk mode urutkan
}

export const Game2TangkapKata: React.FC<Game2TangkapKataProps> = ({
  questions,
  settings,
  isMirrored,
  onFinishGame,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  // Pengaturan Gameplay Dinamis
  const [speedMode, setSpeedMode] = useState<'lambat' | 'sedang' | 'cepat'>('sedang');
  const [sensitivity, setSensitivity] = useState<number>(0.12); // Ambang rasio piksel bergerak (0.06 - 0.25)
  const [combo, setCombo] = useState<number>(0); // Combo streak

  // Kamera & Deteksi Gerakan
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [noMotionCounter, setNoMotionCounter] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null); // Grid 80x45 untuk hitung selisih
  const feedbackCanvasRef = useRef<HTMLCanvasElement | null>(null); // Visual feedback partikel gerakan
  const prevFrameDataRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Kapsul yang Sedang Melayang
  const [capsules, setCapsules] = useState<CapsuleItem[]>([]);
  const capsulesRef = useRef<CapsuleItem[]>([]);
  capsulesRef.current = capsules;

  // Notifikasi Kesalahan Sementara saat menangkap pengecoh
  const [wrongToast, setWrongToast] = useState<{ teks: string; alasan: string; isTrap?: boolean } | null>(null);

  // State Ronde Berjalan
  const currentSoal = questions[currentIdx];
  const [roundType, setRoundType] = useState<Game2RoundType>('tangkap-satu');
  const [targetStepOrder, setTargetStepOrder] = useState<number>(0);
  const [remainingCorrectCount, setRemainingCorrectCount] = useState<number>(1);
  const [initialDelayPassed, setInitialDelayPassed] = useState<boolean>(false);

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
  const [history, setHistory] = useState<SoalHistoryItem[]>([]);

  // Inisialisasi Kamera
  useEffect(() => {
    let isMounted = true;
    const startCam = async () => {
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
        console.warn('Camera failed:', e);
        setCameraAvailable(false);
      }
    };

    startCam();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Inisialisasi Soal & Kapsul Kata
  useEffect(() => {
    if (!currentSoal) return;

    // Tentukan mode variasi ronde
    let determinedMode: Game2RoundType = 'tangkap-satu';
    if (currentSoal.tahapanUrutan && currentSoal.tahapanUrutan.length >= 3) {
      determinedMode = 'urutkan';
    } else if (currentSoal.jawabanBenarTambahan && currentSoal.jawabanBenarTambahan.length > 0 && Math.random() > 0.4) {
      determinedMode = 'tangkap-semua';
    } else if (Math.random() < 0.25) {
      determinedMode = 'bintang-bonus';
    }

    setRoundType(determinedMode);
    setInitialDelayPassed(false);
    setIsLocked(false);
    setShowExplanation(false);
    setWrongToast(null);
    setTargetStepOrder(0);

    const baseSpeed = speedMode === 'lambat' ? 0.14 : speedMode === 'sedang' ? 0.22 : 0.32;

    const newCapsules: CapsuleItem[] = [];
    const lanes = [0, 1, 2, 3];
    // Acak penempatan jalur
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    if (determinedMode === 'urutkan' && currentSoal.tahapanUrutan) {
      // Masukkan tahapan secara berurutan dengan penundaan vertikal berbeda
      currentSoal.tahapanUrutan.slice(0, 4).forEach((stepText, idx) => {
        newCapsules.push({
          id: `step-${idx}`,
          teks: stepText,
          isCorrect: true,
          stepIndex: idx,
          lane: lanes[idx % 4],
          y: -10 - idx * 22,
          speed: baseSpeed,
          caught: false,
          consecutiveMotionFrames: 0,
        });
      });
      setRemainingCorrectCount(newCapsules.length);
    } else if (determinedMode === 'tangkap-semua') {
      // 2 jawaban benar + 2 pengecoh
      const extraCorrect = currentSoal.jawabanBenarTambahan![0] || 'Multimedia Interaktif';
      const items = [
        { teks: currentSoal.jawabanBenar, isCorrect: true },
        { teks: extraCorrect, isCorrect: true },
        { teks: currentSoal.pengecoh[0].teks, isCorrect: false, alasan: currentSoal.pengecoh[0].alasan },
        { teks: currentSoal.pengecoh[1].teks, isCorrect: false, alasan: currentSoal.pengecoh[1].alasan },
      ];
      items.forEach((item, idx) => {
        newCapsules.push({
          id: `capsule-${idx}`,
          teks: item.teks,
          isCorrect: item.isCorrect,
          alasan: item.alasan,
          lane: lanes[idx],
          y: -5 - Math.random() * 15,
          speed: baseSpeed * (0.9 + Math.random() * 0.2),
          caught: false,
          consecutiveMotionFrames: 0,
        });
      });
      setRemainingCorrectCount(2);
    } else {
      // Mode Standar (1 Benar, 2 Pengecoh Biasa, 1 Jebakan)
      const trapItem = currentSoal.pengecoh.find((p) => p.jebakan) || currentSoal.pengecoh[2];
      const norm1 = currentSoal.pengecoh[0];
      const norm2 = currentSoal.pengecoh[1];

      const items = [
        { teks: currentSoal.jawabanBenar, isCorrect: true },
        { teks: norm1.teks, isCorrect: false, alasan: norm1.alasan },
        { teks: norm2.teks, isCorrect: false, alasan: norm2.alasan },
        { teks: trapItem.teks, isCorrect: false, isTrap: true, alasan: trapItem.alasan },
      ];

      items.forEach((item, idx) => {
        newCapsules.push({
          id: `capsule-${idx}`,
          teks: item.teks,
          isCorrect: item.isCorrect,
          isTrap: item.isTrap,
          alasan: item.alasan,
          lane: lanes[idx],
          y: -5 - Math.random() * 18,
          speed: baseSpeed * (0.9 + Math.random() * 0.2),
          caught: false,
          consecutiveMotionFrames: 0,
        });
      });

      // Tambahkan kapsul bintang bonus jika ronde bonus
      if (determinedMode === 'bintang-bonus') {
        newCapsules.push({
          id: 'bonus-star',
          teks: '⭐ BINTANG +5',
          isCorrect: false,
          isBonusStar: true,
          lane: Math.floor(Math.random() * 4),
          y: -25,
          speed: baseSpeed * 1.25,
          caught: false,
          consecutiveMotionFrames: 0,
        });
      }

      setRemainingCorrectCount(1);
    }

    setCapsules(newCapsules);
    setTimeLeft(22);

    // Jeda awal 1,2 detik tiap soal agar tidak langsung tertangkap oleh gerakan sebelumnya
    const delayTimer = setTimeout(() => {
      setInitialDelayPassed(true);
    }, 1200);

    return () => clearTimeout(delayTimer);
  }, [currentIdx, currentSoal, speedMode]);

  // Loop Fisika Kapsul Meluncur Turun
  useEffect(() => {
    if (isLocked) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 16.666; // Normalize to 60fps
      lastTime = time;

      setCapsules((prev) => {
        let allPassed = true;
        const updated = prev.map((cap) => {
          if (cap.caught) return cap;
          const nextY = cap.y + cap.speed * dt;
          if (nextY < 95) allPassed = false;
          return { ...cap, y: nextY };
        });

        // Jika semua kapsul jawaban benar sudah lewat ke bawah dan belum ditangkap
        if (allPassed && !isLocked && initialDelayPassed) {
          handleTimeoutOrMiss();
        }

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLocked, initialDelayPassed]);

  // Timer Hitung Mundur
  useEffect(() => {
    if (isLocked || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeoutOrMiss();
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

  // Loop Deteksi Gerakan (Frame Differencing pada Canvas 80x45, Threshold 28)
  useEffect(() => {
    if (isLocked || !cameraAvailable) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const mCanvas = motionCanvasRef.current;
      const fCanvas = feedbackCanvasRef.current;
      if (!video || !mCanvas || !fCanvas || video.readyState < 2) return;

      const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
      const fCtx = fCanvas.getContext('2d');
      if (!mCtx || !fCtx) return;

      const w = 80;
      const h = 45;

      // Gambar frame video ke grid 80x45
      mCtx.drawImage(video, 0, 0, w, h);
      const imgData = mCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Konversi ke skala kecerahan (grayscale)
      const currentGray = new Uint8Array(w * h);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        currentGray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }

      // Selisih dengan frame sebelumnya (ambang selisih kecerahan 28)
      const prevGray = prevFrameDataRef.current;
      const motionMask = new Uint8Array(w * h);
      let totalMotionPixels = 0;

      fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);
      const scaleX = fCanvas.width / w;
      const scaleY = fCanvas.height / h;

      if (prevGray) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const diff = Math.abs(currentGray[idx] - prevGray[idx]);
            if (diff > 28) {
              motionMask[idx] = 1;
              totalMotionPixels++;

              // Gambar partikel umpan balik tembus pandang
              let renderX = x * scaleX;
              if (isMirrored) {
                renderX = fCanvas.width - (renderX + scaleX);
              }
              fCtx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan transparan
              fCtx.fillRect(renderX, y * scaleY, scaleX * 0.9, scaleY * 0.9);
            }
          }
        }
      }

      prevFrameDataRef.current = currentGray;

      // Pantau apakah ada gerakan
      if (totalMotionPixels > 10) {
        setNoMotionCounter(0);
      } else {
        setNoMotionCounter((p) => p + 0.08);
      }

      // Periksa interaksi dengan kapsul yang sedang melayang jika jeda 1.2 detik sudah lewat
      if (!initialDelayPassed) return;

      const currentCaps = capsulesRef.current;
      let stateChanged = false;

      const updatedCaps = currentCaps.map((cap) => {
        if (cap.caught || cap.y < 0 || cap.y > 90) return cap;

        // Tentukan batas kotak kapsul pada grid 80x45
        // 4 jalur horizontal:
        // lane 0: 5% - 25% (x=4 to x=20)
        // lane 1: 28% - 48% (x=22 to x=38)
        // lane 2: 52% - 72% (x=41 to x=57)
        // lane 3: 75% - 95% (x=60 to x=76)
        const laneXStarts = [4, 22, 41, 60];
        let boxX = laneXStarts[cap.lane];
        const boxWidth = 16;
        const boxY = Math.floor((cap.y / 100) * h);
        const boxHeight = 6;

        // Jika dicerminkan, sesuaikan koordinat x kotak untuk perbandingan dengan video asli
        if (isMirrored) {
          boxX = w - (boxX + boxWidth);
        }

        let movingInside = 0;
        let totalInside = 0;

        for (let py = boxY; py < boxY + boxHeight && py < h; py++) {
          for (let px = boxX; px < boxX + boxWidth && px < w; px++) {
            totalInside++;
            if (motionMask[py * w + px] === 1) {
              movingInside++;
            }
          }
        }

        const ratio = totalInside > 0 ? movingInside / totalInside : 0;
        let consecutive = cap.consecutiveMotionFrames;

        if (ratio >= sensitivity) {
          consecutive += 1;
        } else {
          consecutive = Math.max(0, consecutive - 1);
        }

        // Jika rasio gerakan melebihi ambang selama 3 frame berturut-turut, KATA TERTANGKAP!
        if (consecutive >= 3) {
          stateChanged = true;
          triggerCapture(cap);
          return { ...cap, caught: true, consecutiveMotionFrames: 0 };
        }

        return { ...cap, consecutiveMotionFrames: consecutive };
      });

      if (stateChanged) {
        setCapsules(updatedCaps);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isLocked, cameraAvailable, isMirrored, sensitivity, initialDelayPassed]);

  // Logika Menangkap Kapsul Kata (melalui lambaian kamera ATAU klik mouse / layar sentuh)
  const triggerCapture = (captured: CapsuleItem) => {
    if (isLocked || captured.caught) return;

    // Tandai langsung di UI
    setCapsules((prev) =>
      prev.map((c) => (c.id === captured.id ? { ...c, caught: true } : c))
    );

    // Kasus 1: Bintang Bonus
    if (captured.isBonusStar) {
      soundManager.playBonus();
      setTotalScore((prev) => prev + 5);
      if (teamScores.length > 0) {
        setTeamScores((prev) => {
          const copy = [...prev];
          if (copy[currentTeamIdx]) copy[currentTeamIdx].skor += 5;
          return copy;
        });
      }
      return;
    }

    // Kasus 2: Mode Urutkan Tahapan
    if (roundType === 'urutkan') {
      if (captured.stepIndex === targetStepOrder) {
        // Urutan Benar!
        soundManager.playCorrect();
        const nextOrder = targetStepOrder + 1;
        setTargetStepOrder(nextOrder);
        setTotalScore((prev) => prev + 10);
        setCombo((prev) => prev + 1);

        if (nextOrder >= (currentSoal.tahapanUrutan?.length || 3)) {
          // Seluruh tahapan berhasil diurutkan!
          finishRoundSuccess(10);
        }
      } else {
        // Salah Urutan
        soundManager.playWrong();
        setCombo(0);
        setTotalScore((prev) => Math.max(0, prev - 5));
        setWrongToast({
          teks: captured.teks,
          alasan: `Urutan belum tepat! Cari tahapan urutan ke-${targetStepOrder + 1} terlebih dahulu.`,
        });
      }
      return;
    }

    // Kasus 3: Jawaban Benar Tertangkap
    if (captured.isCorrect) {
      soundManager.playCorrect();
      const currentCombo = combo + 1;
      setCombo(currentCombo);
      const multiplier = currentCombo >= 3 ? 2 : currentCombo >= 2 ? 1.5 : 1;
      const earned = Math.round(10 * multiplier);

      setTotalScore((prev) => prev + earned);

      if (teamScores.length > 0) {
        setTeamScores((prev) => {
          const copy = [...prev];
          const t = copy[currentTeamIdx];
          if (t) {
            t.skor += earned;
            t.benar += 1;
          }
          return copy;
        });
      }

      if (roundType === 'tangkap-semua') {
        const nextRemaining = remainingCorrectCount - 1;
        setRemainingCorrectCount(nextRemaining);
        if (nextRemaining <= 0) {
          finishRoundSuccess(earned);
        }
      } else {
        finishRoundSuccess(earned);
      }
    } else {
      // Kasus 4: Pengecoh Biasa atau Jebakan Tertangkap
      soundManager.playWrong();
      setCombo(0); // Reset combo saat salah
      setTotalScore((prev) => Math.max(0, prev - 5));

      if (teamScores.length > 0) {
        setTeamScores((prev) => {
          const copy = [...prev];
          const t = copy[currentTeamIdx];
          if (t) {
            t.skor = Math.max(0, t.skor - 5);
            t.salah += 1;
          }
          return copy;
        });
      }

      setWrongToast({
        teks: captured.teks,
        isTrap: captured.isTrap,
        alasan: captured.alasan || 'Pilihan ini tidak sesuai dengan konsep pertanyaan.',
      });
    }
  };

  const finishRoundSuccess = (earned: number) => {
    setIsLocked(true);

    const historyItem: SoalHistoryItem = {
      soal: currentSoal,
      rondeType: `Tangkap Kata (${roundType})`,
      jawabanTerpilih: currentSoal.jawabanBenar,
      jawabanBenar: currentSoal.jawabanBenar,
      isCorrect: true,
      poinDidapat: earned,
      timName: teamScores[currentTeamIdx]?.nama,
    };
    setHistory((prev) => [...prev, historyItem]);

    setTimeout(() => {
      setShowExplanation(true);
    }, 1200);
  };

  const handleTimeoutOrMiss = () => {
    if (isLocked) return;
    setIsLocked(true);
    soundManager.playWrong();
    setCombo(0);

    if (teamScores.length > 0) {
      setTeamScores((prev) => {
        const copy = [...prev];
        const t = copy[currentTeamIdx];
        if (t) t.salah += 1;
        return copy;
      });
    }

    const historyItem: SoalHistoryItem = {
      soal: currentSoal,
      rondeType: `Tangkap Kata (${roundType})`,
      jawabanTerpilih: '(Waktu Habis / Terlewat)',
      jawabanBenar: currentSoal.jawabanBenar,
      isCorrect: false,
      poinDidapat: 0,
      timName: teamScores[currentTeamIdx]?.nama,
    };
    setHistory((prev) => [...prev, historyItem]);

    setTimeout(() => {
      setShowExplanation(true);
    }, 1000);
  };

  const handleNextSoal = () => {
    setShowExplanation(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      if (teamScores.length > 1) {
        setCurrentTeamIdx((prev) => (prev + 1) % teamScores.length);
      }
    } else {
      onFinishGame(history, totalScore, teamScores.length > 1 ? teamScores : undefined);
    }
  };

  if (!currentSoal) return null;

  const currentTeam = teamScores[currentTeamIdx];
  const laneLeftPercentages = ['4%', '28%', '52%', '76%'];

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Video Kamera (mirror, agak digelapkan) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
        {/* Canvas Deteksi Selisih Frame (Tersembunyi 80x45) */}
        <canvas ref={motionCanvasRef} width={80} height={45} className="hidden" />
        {/* Canvas Visual Feedback Gerakan Piksel Tembus Pandang */}
        <canvas
          ref={feedbackCanvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* Bagian Atas: Banner Pertanyaan & Kontrol Kecepatan/Sensitivitas */}
      <div className="relative z-10 p-4 sm:p-6 max-w-5xl mx-auto w-full text-center">
        {/* Bar Indikator Status & Ronde */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              {roundType === 'tangkap-semua'
                ? 'TANGKAP SEMUA JAWABAN BENAR'
                : roundType === 'urutkan'
                ? `URUTKAN TAHAPAN (${targetStepOrder + 1}/${currentSoal.tahapanUrutan?.length || 3})`
                : roundType === 'bintang-bonus'
                ? 'RONDE BONUS BINTANG ⭐'
                : 'TANGKAP KATA BENAR'}
            </span>

            {combo >= 2 && (
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 font-black animate-pulse flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> COMBO ×{combo >= 3 ? '2' : '1.5'}
              </span>
            )}
          </div>

          {/* Pengaturan Sensitivitas & Kecepatan Cepat */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700">
            {/* Kecepatan */}
            <div className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <button
                onClick={() =>
                  setSpeedMode((prev) =>
                    prev === 'lambat' ? 'sedang' : prev === 'sedang' ? 'cepat' : 'lambat'
                  )
                }
                className="text-[11px] font-bold text-slate-300 hover:text-white capitalize"
                title="Ganti Kecepatan Turun"
              >
                Kecepatan: {speedMode}
              </button>
            </div>

            <div className="w-px h-3.5 bg-slate-700"></div>

            {/* Sensitivitas Gerakan */}
            <div className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">Sensitif:</span>
              <button
                onClick={() => setSensitivity((p) => Math.max(0.06, Number((p - 0.03).toFixed(2))))}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                title="Kurangi Sensitivitas"
              >
                −
              </button>
              <button
                onClick={() => setSensitivity((p) => Math.min(0.24, Number((p + 0.03).toFixed(2))))}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                title="Tambah Sensitivitas"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Teks Pertanyaan Utama */}
        <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-slate-700/80 shadow-2xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">
            {currentSoal.pertanyaan}
          </h1>
          {!initialDelayPassed && (
            <span className="text-xs font-bold text-cyan-400 mt-2 block animate-pulse">
              ⚡ Bersiap... Kapsul meluncur dalam hitungan detik!
            </span>
          )}
        </div>

        {/* Notifikasi Pop-up jika menangkap Pengecoh / Jebakan */}
        {wrongToast && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-950/85 border border-rose-500/50 text-rose-200 text-xs max-w-lg mx-auto flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="font-bold text-white block">
                {wrongToast.isTrap ? '⚠️ KATA JEBAKAN TERTANGKAP! (-5 Poin)' : '❌ KATA SALAH (-5 Poin)'}: "{wrongToast.teks}"
              </span>
              <span className="text-rose-200/90 leading-tight">{wrongToast.alasan}</span>
            </div>
          </div>
        )}

        {/* Saran jika gerakan tangan tidak terdeteksi >3 detik */}
        {noMotionCounter > 3 && cameraAvailable && !isLocked && (
          <div className="mt-2 py-1 px-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 animate-fadeIn">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Lambaikan tangan lebih dekat ke kamera proyektor, atau klik kapsul secara langsung dengan mouse/layar sentuh!</span>
          </div>
        )}
      </div>

      {/* Bagian Tengah: Jalur Kapsul Meluncur Turun (4 Lanes) */}
      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto h-[480px] sm:h-[540px]">
        {/* Pemandu 4 Jalur Halus */}
        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none border-x border-slate-800/40">
          <div className="border-r border-slate-800/30"></div>
          <div className="border-r border-slate-800/30"></div>
          <div className="border-r border-slate-800/30"></div>
          <div></div>
        </div>

        {/* Kapsul Kata yang Meluncur */}
        {capsules.map((cap) => {
          if (cap.caught) {
            // Efek Hilang / Tertangkap
            return (
              <div
                key={cap.id}
                style={{
                  left: laneLeftPercentages[cap.lane],
                  top: `${cap.y}%`,
                  width: '20%',
                }}
                className={`absolute p-4 rounded-3xl font-black text-center text-sm sm:text-base border-2 shadow-2xl transition-all duration-300 scale-125 opacity-0 pointer-events-none ${
                  cap.isCorrect || cap.isBonusStar
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-rose-600 text-white border-rose-300'
                }`}
              >
                {cap.teks}
              </div>
            );
          }

          // Kapsul Aktif Meluncur
          const isBonus = cap.isBonusStar;
          const isDanger = cap.isTrap;

          return (
            <div
              key={cap.id}
              onClick={() => triggerCapture(cap)}
              style={{
                left: laneLeftPercentages[cap.lane],
                top: `${cap.y}%`,
                width: '20%',
              }}
              className={`absolute cursor-pointer transition-transform duration-75 select-none rounded-3xl p-3 sm:p-5 border-2 text-center shadow-2xl flex flex-col items-center justify-center min-h-[70px] sm:min-h-[85px] active:scale-95 ${
                isBonus
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 border-amber-200 text-slate-950 font-black animate-pulse shadow-amber-400/40'
                  : isDanger
                  ? 'bg-slate-900/90 border-orange-500/70 text-orange-200 hover:border-orange-400 hover:scale-105'
                  : 'bg-slate-900/90 border-cyan-500/70 text-cyan-100 hover:border-cyan-400 hover:scale-105'
              }`}
            >
              {/* Umpan balik frame gerakan pada kapsul ini */}
              {cap.consecutiveMotionFrames > 0 && (
                <div className="absolute -top-2 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black animate-ping">
                  MENANGKAP...
                </div>
              )}

              <span className="text-sm sm:text-lg md:text-xl font-black leading-tight drop-shadow">
                {cap.teks}
              </span>

              {roundType === 'urutkan' && cap.stepIndex !== undefined && (
                <span className="text-[10px] text-slate-400 mt-1 font-bold">
                  (Sentuh urutan #{cap.stepIndex + 1})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bagian Bawah: Bar Skor, Sisa Waktu, & Tim */}
      <div className="relative z-10 p-4 max-w-7xl mx-auto w-full flex items-center justify-between bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {currentTeam && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tim:</span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm">
                {currentTeam.nama} ({currentTeam.skor} Poin)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Sisa Waktu:</span>
            <span
              className={`text-lg font-black ${
                timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
              }`}
            >
              {timeLeft}d
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Skor:</span>
            <span className="text-xl font-black text-amber-400">{totalScore} Pts</span>
          </div>
        </div>
      </div>

      {/* Kartu Penjelasan Muncul Setelah Jawaban Terkunci */}
      {showExplanation && (
        <ExplanationCard
          soal={currentSoal}
          jawabanBenarTeks={currentSoal.jawabanBenar}
          pengecohList={currentSoal.pengecoh}
          isCorrect={history[history.length - 1]?.isCorrect ?? false}
          poinDidapat={history[history.length - 1]?.poinDidapat ?? 0}
          onNextSoal={handleNextSoal}
          isLastSoal={currentIdx + 1 >= questions.length}
          roundTypeName={roundType.toUpperCase()}
        />
      )}
    </div>
  );
};
