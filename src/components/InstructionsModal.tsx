import React from 'react';
import { X, ShieldCheck, ArrowLeftRight, Hand, Sparkles, Award } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">Petunjuk Bermain & Privasi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Pernyataan Privasi Singkat */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-300 text-sm">Privasi & Keamanan Kamera Terjamin</h3>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                Seluruh pemrosesan video kamera (deteksi wajah & gerakan) dilakukan secara <strong>100% lokal di browser</strong> perangkat Anda. Tidak ada gambar, video, atau data biometrik yang dikirim ke server luar maupun disimpan.
              </p>
            </div>
          </div>

          {/* Panduan Game 1 */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <ArrowLeftRight className="w-5 h-5" />
              <span>Game 1: Kiri atau Kanan (Berdiri di Sisi Jawaban)</span>
            </div>
            <ul className="text-sm space-y-2 text-slate-300 list-disc list-inside">
              <li>
                <strong>Pilihan Layar:</strong> Layar terbagi menjadi dua sisi. Sisi <strong>Kiri (Teal)</strong> untuk pilihan A, dan sisi <strong>Kanan (Oranye)</strong> untuk pilihan B.
              </li>
              <li>
                <strong>Bergerak Fisik:</strong> Siswa di kelas diminta berdiri atau bergeser ke sisi kiri/kanan ruangan sesuai jawaban yang menurut mereka benar.
              </li>
              <li>
                <strong>Deteksi Otomatis & Kontrol Manual:</strong> Kamera mendeteksi jumlah wajah di tiap sisi. Guru atau operator juga dapat menekan tombol <strong>A+/A−</strong> dan <strong>B+/B−</strong> di layar jika ingin mengoreksi hitungan manual.
              </li>
              <li>
                <strong>Variasi Ronde:</strong> Pilihan A/B biasa, format <strong>Benar atau Salah</strong>, tebak <strong>Cari yang BUKAN</strong>, serta <strong>Ronde Kilat</strong> (waktu setengah & skor ganda).
              </li>
              <li>
                <strong>Mode Eliminasi:</strong> Jika diaktifkan, siswa yang berada di sisi salah akan tereliminasi/duduk, dan permainan selesai jika tersisa 1 pemenang utama!
              </li>
            </ul>
          </div>

          {/* Panduan Game 2 */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Hand className="w-5 h-5" />
              <span>Game 2: Tangkap Kata (Lambaian Tangan)</span>
            </div>
            <ul className="text-sm space-y-2 text-slate-300 list-disc list-inside">
              <li>
                <strong>Gerakan Tangan:</strong> Gerakkan tangan Anda di depan kamera proyektor/webcam untuk menyentuh kapsul kata yang meluncur turun dari atas.
              </li>
              <li>
                <strong>Target Benar:</strong> Tangkap kapsul jawaban benar (+10 poin). Hindari kata pengecoh dan kata jebakan (−5 poin).
              </li>
              <li>
                <strong>Cadangan Sentuh/Mouse:</strong> Jika kamera tidak dapat digunakan, Anda juga bisa mengklik langsung kapsul jawaban menggunakan mouse atau layar sentuh.
              </li>
              <li>
                <strong>Variasi Ronde:</strong> Tangkap satu jawaban, tangkap semua jawaban benar, mengurutkan tahapan proses multimedia, hingga kapsul Bintang Bonus (+5 poin)!
              </li>
            </ul>
          </div>

          {/* Tips Guru & Proyektor */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Tips Penyajian di Kelas:</strong> Gunakan kabel HDMI proyektor dan letakkan webcam menghadap siswa. Pastikan pencahayaan kelas merata agar deteksi wajah dan gerakan tangan bekerja optimal.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-cyan-500/20"
          >
            SAYA MENGERTI
          </button>
        </div>
      </div>
    </div>
  );
};
