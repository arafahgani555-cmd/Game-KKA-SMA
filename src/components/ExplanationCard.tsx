import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';
import { Soal, Pengecoh } from '../types';

interface ExplanationCardProps {
  soal: Soal;
  jawabanBenarTeks: string;
  jawabanSalahTeks?: string;
  alasanSalahTeks?: string;
  pengecohList: Pengecoh[];
  isCorrect: boolean;
  poinDidapat: number;
  onNextSoal: () => void;
  isLastSoal: boolean;
  roundTypeName?: string;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  soal,
  jawabanBenarTeks,
  jawabanSalahTeks,
  alasanSalahTeks,
  pengecohList,
  isCorrect,
  poinDidapat,
  onNextSoal,
  isLastSoal,
  roundTypeName,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Banner Status Hasil */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isCorrect
              ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-emerald-500/40 text-emerald-300'
              : 'bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider block opacity-80">
                {roundTypeName ? `Hasil Ronde: ${roundTypeName}` : 'Kunci Jawaban'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isCorrect ? 'Jawaban Benar!' : 'Jawaban Kurang Tepat!'}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-300 block font-semibold">Poin Ronde</span>
            <span
              className={`text-2xl sm:text-3xl font-black ${
                poinDidapat > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {poinDidapat > 0 ? `+${poinDidapat}` : poinDidapat}
            </span>
          </div>
        </div>

        {/* Konten Penjelasan */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Pertanyaan yang dibahas */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Topik: {soal.topik}
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{soal.pertanyaan}"
            </p>
          </div>

          {/* Kotak Jawaban Benar & Penjelasan */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <span>Jawaban Benar:</span>
              <span className="text-white text-base sm:text-lg font-black bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                {jawabanBenarTeks}
              </span>
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed pl-7">
              {soal.penjelasan}
            </p>
          </div>

          {/* Jika ada jawaban salah yang dipilih atau ditampilkan pada ronde */}
          {jawabanSalahTeks && (
            <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Mengapa pilihan "{jawabanSalahTeks}" keliru?</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed pl-6">
                {alasanSalahTeks || 'Pilihan ini bukan merupakan konsep yang tepat untuk pertanyaan tersebut.'}
              </p>
            </div>
          )}

          {/* Rincian Pengecoh Lainnya (Materi Tambahan Edukatif) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pelajari Istilah Pengecoh Lainnya:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pengecohList.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    p.jebakan
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span className="font-bold block text-white mb-0.5">
                    {p.teks} {p.jebakan && <span className="text-[10px] text-amber-400 font-semibold">(Kata Jebakan)</span>}
                  </span>
                  <span>{p.alasan}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Tombol Lanjut */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-end">
          <button
            onClick={onNextSoal}
            autoFocus
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-95"
          >
            <span>{isLastSoal ? 'Lihat Rekap Akhir' : 'Soal Berikutnya'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
