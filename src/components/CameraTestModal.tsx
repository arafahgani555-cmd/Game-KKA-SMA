import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, AlertTriangle, CheckCircle, FlipHorizontal, Eye } from 'lucide-react';
import { faceDetectorService, FaceBox } from '../utils/faceDetector';

interface CameraTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMirrored: boolean;
  onToggleMirror: () => void;
}

export const CameraTestModal: React.FC<CameraTestModalProps> = ({
  isOpen,
  onClose,
  isMirrored,
  onToggleMirror,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camStatus, setCamStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [detectedFaces, setDetectedFaces] = useState<FaceBox[]>([]);
  const [countLeft, setCountLeft] = useState<number>(0);
  const [countRight, setCountRight] = useState<number>(0);
  const [isHttpsOk, setIsHttpsOk] = useState<boolean>(true);

  // Periksa HTTPS / Localhost
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      setIsHttpsOk(isHttps || isLocal);
    }
  }, []);

  const startCamera = async () => {
    setCamStatus('loading');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamStatus('active');
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCamStatus('error');
      setErrorMessage('Kamera tidak diizinkan atau tidak ditemukan pada perangkat Anda. Pastikan izin kamera aktif di browser.');
    }
  };

  const loadFaceModel = async () => {
    setModelStatus('loading');
    const res = await faceDetectorService.loadModel();
    if (res.success) {
      setModelStatus('ready');
    } else {
      setModelStatus('missing');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      loadFaceModel();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Loop deteksi berkala setiap 250ms saat modal terbuka
  useEffect(() => {
    if (!isOpen || camStatus !== 'active') return;

    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const cWidth = canvasRef.current.width || 640;
        const cHeight = canvasRef.current.height || 480;

        const res = await faceDetectorService.detectFaces(
          videoRef.current,
          cWidth,
          cHeight,
          isMirrored
        );
        setDetectedFaces(res.boxes);
        setCountLeft(res.countLeft);
        setCountRight(res.countRight);

        // Gambar kotak deteksi di canvas
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cWidth, cHeight);

          // Garis pemisah tengah
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cWidth / 2, 0);
          ctx.lineTo(cWidth / 2, cHeight);
          ctx.stroke();
          ctx.setLineDash([]);

          // Gambar kotak wajah
          res.boxes.forEach((box) => {
            ctx.lineWidth = 3;
            if (box.side === 'kiri') {
              ctx.strokeStyle = '#14b8a6'; // Teal
              ctx.fillStyle = 'rgba(20, 184, 166, 0.2)';
            } else {
              ctx.strokeStyle = '#f97316'; // Orange
              ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
            }
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            ctx.fillRect(box.x, box.y, box.width, box.height);

            // Label kecil
            ctx.fillStyle = box.side === 'kiri' ? '#14b8a6' : '#f97316';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(box.side.toUpperCase(), box.x + 4, box.y - 4);
          });
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen, camStatus, isMirrored]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Uji Kamera & Deteksi AI</h2>
              <p className="text-xs text-slate-400">Pastikan kamera mendeteksi wajah siswa di sisi Kiri dan Kanan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Peringatan HTTP bila tidak secure */}
          {!isHttpsOk && (
            <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/50 flex items-center gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Peringatan: Browser mewajibkan protokol <strong>HTTPS</strong> atau <strong>localhost</strong> agar kamera dapat diakses secara resmi.
              </span>
            </div>
          )}

          {/* Area Pratinjau Video & Canvas Deteksi */}
          <div className="relative aspect-video w-full max-h-[420px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {camStatus === 'loading' && (
              <div className="flex flex-col items-center gap-3 text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-sm font-semibold">Menginisialisasi Kamera...</span>
              </div>
            )}

            {camStatus === 'error' && (
              <div className="p-6 text-center max-w-md space-y-3">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
                <h4 className="text-white font-bold">Kamera Tidak Dapat Diakses</h4>
                <p className="text-xs text-slate-300">{errorMessage}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Coba Lagi
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${camStatus === 'active' ? 'block' : 'hidden'}`}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full pointer-events-none ${camStatus === 'active' ? 'block' : 'hidden'}`}
            />

            {/* Overlay Pembagi Kiri & Kanan */}
            {camStatus === 'active' && (
              <div className="absolute inset-0 pointer-events-none flex justify-between p-4">
                {/* Sisi Kiri (Teal) */}
                <div className="bg-teal-950/70 border border-teal-500/50 backdrop-blur-sm rounded-2xl px-4 py-2 self-start flex items-center gap-2 text-teal-300">
                  <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block">Sisi Kiri (A)</span>
                    <span className="text-2xl font-black">{countLeft} Wajah</span>
                  </div>
                </div>

                {/* Sisi Kanan (Orange) */}
                <div className="bg-orange-950/70 border border-orange-500/50 backdrop-blur-sm rounded-2xl px-4 py-2 self-start flex items-center gap-2 text-orange-300">
                  <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block">Sisi Kanan (B)</span>
                    <span className="text-2xl font-black">{countRight} Wajah</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kontrol Cermin & Status Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">Pencerminan Kamera</span>
              <button
                onClick={onToggleMirror}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-bold transition flex items-center gap-2"
              >
                <FlipHorizontal className="w-4 h-4" />
                {isMirrored ? 'Mode Cermin (Aktif)' : 'Mode Asli (Non-Cermin)'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">Status Model AI (TinyFace)</span>
              {modelStatus === 'ready' ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Siap Digunakan
                </span>
              ) : modelStatus === 'loading' ? (
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memeriksa...
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-400 font-semibold">Belum Terpasang</span>
                  <button
                    onClick={loadFaceModel}
                    className="p-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs"
                    title="Coba Muat Ulang"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Informasi jika model belum ditaruh di public/models */}
          {modelStatus === 'missing' && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Catatan Berkas Model Wajah:
              </p>
              <p className="text-amber-200/80">
                Letakkan berkas model <code>tiny_face_detector_model-weights_manifest.json</code> dan <code>tiny_face_detector_model.bin</code> ke dalam folder <code>public/models/</code>.
              </p>
              <p className="text-emerald-300 font-semibold">
                ✓ Jangan khawatir: Game tetap 100% bisa dimainkan dengan tombol koreksi manual (A+/A- dan B+/B-) di layar!
              </p>
            </div>
          )}

          {/* Tips Posisi & Cahaya */}
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Tips Akurasi Deteksi:
            </span>
            <p>1. Hadapkan proyektor atau webcam ke seluruh ruangan kelas dengan pencahayaan terang dan merata.</p>
            <p>2. Buat jarak pemisah yang jelas di tengah kelas agar kelompok A (kiri) dan B (kanan) tidak saling bertumpuk.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wider transition"
          >
            SELESAI UJI COBA
          </button>
        </div>
      </div>
    </div>
  );
};
