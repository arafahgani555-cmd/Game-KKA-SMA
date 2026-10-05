import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { TeamScore, SoalHistoryItem } from '../types';
import { soundManager } from '../utils/sound';

interface GameSummaryProps {
  gameTitle: string;
  totalScore: number;
  totalQuestions: number;
  totalCorrect: number;
  teamScores?: TeamScore[];
  history: SoalHistoryItem[];
  onPlayAgain: () => void;
  onReturnMenu: () => void;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  gameTitle,
  totalScore,
  totalQuestions,
  totalCorrect,
  teamScores,
  history,
  onPlayAgain,
  onReturnMenu,
}) => {
  const [expandedSoalId, setExpandedSoalId] = React.useState<number | null>(null);

  const percentage = Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100);

  // Tentukan Lencana Prestasi
  let badgeTitle = 'Eksplorator Multimedia';
  let badgeColor = 'from-blue-500 to-cyan-500';
  let badgeDesc = 'Awal yang baik dalam memahami konsep dasar konten digital!';

  if (percentage >= 85) {
    badgeTitle = 'Master Konten Digital KKA';
    badgeColor = 'from-amber-400 via-yellow-300 to-orange-500';
    badgeDesc = 'Luar biasa! Penguasaan materi multimedia dan AI Anda sempurna!';
  } else if (percentage >= 65) {
    badgeTitle = 'Kreator Multimedia Handal';
    badgeColor = 'from-emerald-400 to-teal-500';
    badgeDesc = 'Hebat! Anda memahami sebagian besar teknik dan alur produksi konten!';
  }

  useEffect(() => {
    soundManager.playGameOver();
    if (percentage >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [percentage]);

  // Urutkan tim pemenang jika ada lebih dari 1 tim
  const sortedTeams = teamScores ? [...teamScores].sort((a, b) => b.skor - a.skor) : [];
  const winnerTeam = sortedTeams.length > 1 ? sortedTeams[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center animate-fadeIn">
      <div className="max-w-4xl w-full space-y-6">
        {/* Banner Juara / Skor Utama */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl text-center">
          {/* Latar Bercahaya */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <Trophy className="w-12 h-12 animate-bounce" />
            </div>

            <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400 mb-1">
              {gameTitle} - Selesai
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
              Permainan Berakhir!
            </h1>

            {/* Tim Juara jika ada */}
            {winnerTeam && (
              <div className="my-3 px-6 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-lg sm:text-2xl flex items-center gap-2">
                <span>🏆 Juara 1: {winnerTeam.nama} ({winnerTeam.skor} Poin)</span>
              </div>
            )}

            {/* Kartu Lencana Penghargaan */}
            <div className="mt-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-md w-full shadow-inner">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-6 h-6 text-amber-400" />
                <span className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${badgeColor} bg-clip-text text-transparent`}>
                  {badgeTitle}
                </span>
              </div>
              <p className="text-xs text-slate-300">{badgeDesc}</p>
            </div>

            {/* Statistik Angka */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 w-full max-w-lg">
              <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700">
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-bold block">Total Skor</span>
                <span className="text-2xl sm:text-4xl font-black text-amber-400">{totalScore}</span>
              </div>
              <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700">
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-bold block">Akurasi</span>
                <span className="text-2xl sm:text-4xl font-black text-cyan-400">{percentage}%</span>
              </div>
              <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700">
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-bold block">Benar/Total</span>
                <span className="text-2xl sm:text-4xl font-black text-emerald-400">{totalCorrect}/{totalQuestions}</span>
              </div>
            </div>

            {/* Leaderboard Tim (jika multipemain) */}
            {sortedTeams.length > 1 && (
              <div className="mt-6 w-full max-w-lg space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  Klasemen Tim:
                </h3>
                <div className="space-y-2">
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold ${
                        idx === 0
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-700 text-xs flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>{team.nama}</span>
                        {team.tereliminasi && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                            Tereliminasi
                          </span>
                        )}
                      </div>
                      <span className="text-base font-black">{team.skor} Poin</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
              <button
                onClick={onPlayAgain}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base tracking-wide flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Main Lagi</span>
              </button>
              <button
                onClick={onReturnMenu}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm sm:text-base tracking-wide flex items-center gap-2 transition active:scale-95"
              >
                <Home className="w-5 h-5 text-cyan-400" />
                <span>Menu Utama</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rekap Seluruh Soal & Penjelasan */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white">
              Rekap Pembahasan Soal ({history.length})
            </h2>
            <span className="text-xs text-slate-400">Klik untuk melihat rincian alasan</span>
          </div>

          <div className="space-y-3">
            {history.map((item, idx) => {
              const isExpanded = expandedSoalId === item.soal.id;
              return (
                <div
                  key={idx}
                  className="border border-slate-800 rounded-2xl bg-slate-800/40 overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedSoalId(isExpanded ? null : item.soal.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/70 transition gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Soal #{idx + 1} • {item.soal.topik}
                        </span>
                        <p className="text-sm font-bold text-white line-clamp-1">
                          {item.soal.pertanyaan}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-black ${item.poinDidapat > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        +{item.poinDidapat} Pts
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-800 bg-slate-900/60 text-xs sm:text-sm space-y-2">
                      <p className="text-slate-200">
                        <strong className="text-emerald-400">Jawaban Benar:</strong> {item.jawabanBenar}
                      </p>
                      <p className="text-slate-300/90 leading-relaxed">
                        <strong className="text-cyan-400">Penjelasan:</strong> {item.soal.penjelasan}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <strong className="text-slate-400 block text-xs mb-1">Pengecoh & Alasan:</strong>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                          {item.soal.pengecoh.map((p, pIdx) => (
                            <li key={pIdx}>
                              <strong className={p.jebakan ? 'text-amber-400' : 'text-slate-200'}>
                                {p.teks}{p.jebakan ? ' (Jebakan)' : ''}:
                              </strong>{' '}
                              {p.alasan}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
