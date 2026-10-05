import React from 'react';
import { Volume2, VolumeX, FlipHorizontal, HelpCircle, Video, Home } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface NavbarProps {
  title?: string;
  isMirrored?: boolean;
  onToggleMirror?: () => void;
  onOpenInstructions: () => void;
  onOpenCamTest?: () => void;
  onReturnHome?: () => void;
  currentSoalIndex?: number;
  totalSoal?: number;
  skor?: number;
  currentTeamName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  isMirrored,
  onToggleMirror,
  onOpenInstructions,
  onOpenCamTest,
  onReturnHome,
  currentSoalIndex,
  totalSoal,
  skor,
  currentTeamName,
}) => {
  const [muted, setMuted] = React.useState<boolean>(soundManager.getMuted());

  const handleToggleMute = () => {
    const newState = soundManager.toggleMute();
    setMuted(newState);
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-700/60 sticky top-0 z-40 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Sisi Kiri: Logo & Navigasi Home */}
        <div className="flex items-center gap-3">
          {onReturnHome && (
            <button
              onClick={onReturnHome}
              title="Kembali ke Menu Utama"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 text-sm font-semibold text-slate-200"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              {title || 'KKA MULTIMEDIA ARENA'}
            </span>
            {currentTeamName && (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Giliran: {currentTeamName}
              </span>
            )}
          </div>
        </div>

        {/* Tengah: Nomor Soal & Skor (jika sedang main) */}
        {totalSoal !== undefined && currentSoalIndex !== undefined && (
          <div className="flex items-center gap-3 sm:gap-6 bg-slate-800/90 px-3 sm:px-5 py-1.5 rounded-2xl border border-slate-700 shadow-inner">
            <div className="text-center">
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider block font-semibold">Soal</span>
              <span className="text-base sm:text-xl font-black text-cyan-300">
                {currentSoalIndex + 1}<span className="text-slate-500 text-xs sm:text-sm font-normal">/{totalSoal}</span>
              </span>
            </div>
            {skor !== undefined && (
              <>
                <div className="w-px h-6 bg-slate-700"></div>
                <div className="text-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider block font-semibold">Skor</span>
                  <span className="text-base sm:text-xl font-black text-amber-400">
                    {skor}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sisi Kanan: Utilitas Kamera, Suara, Bantuan */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onToggleMirror && (
            <button
              onClick={onToggleMirror}
              title={`Balik Cermin: ${isMirrored ? 'Aktif' : 'Mati'}`}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
                isMirrored
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Cermin</span>
            </button>
          )}

          {onOpenCamTest && (
            <button
              onClick={onOpenCamTest}
              title="Uji Kamera & Deteksi"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1 text-xs font-semibold"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Uji Kamera</span>
            </button>
          )}

          <button
            onClick={handleToggleMute}
            title={muted ? 'Nyalakan Suara' : 'Matikan Suara (Mute)'}
            className={`p-2 rounded-xl border transition ${
              muted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenInstructions}
            title="Petunjuk Bermain & Privasi"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
