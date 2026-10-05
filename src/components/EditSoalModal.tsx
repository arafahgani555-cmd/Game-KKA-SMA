import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Soal, Level, Pengecoh } from '../types';
import {
  getAllSoal,
  saveCustomSoal,
  resetCustomSoal,
  TOPIK_LIST,
  getBaseBank,
} from '../data/bankSoal';

interface EditSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsUpdated?: () => void;
}

export const EditSoalModal: React.FC<EditSoalModalProps> = ({
  isOpen,
  onClose,
  onQuestionsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'pipe' | 'json'>('list');
  const [soalList, setSoalList] = useState<Soal[]>(() => getAllSoal());
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State untuk Tambah Soal Baru
  const [formTopik, setFormTopik] = useState<string>(TOPIK_LIST[0]);
  const [formLevel, setFormLevel] = useState<Level>(1);
  const [formPertanyaan, setFormPertanyaan] = useState<string>('');
  const [formJawabanBenar, setFormJawabanBenar] = useState<string>('');
  const [formPenjelasan, setFormPenjelasan] = useState<string>('');
  const [formP1Teks, setFormP1Teks] = useState<string>('');
  const [formP1Alasan, setFormP1Alasan] = useState<string>('');
  const [formP2Teks, setFormP2Teks] = useState<string>('');
  const [formP2Alasan, setFormP2Alasan] = useState<string>('');
  const [formTrapTeks, setFormTrapTeks] = useState<string>('');
  const [formTrapAlasan, setFormTrapAlasan] = useState<string>('');

  // Pipe Delimited State
  const [pipeInput, setPipeInput] = useState<string>(
    'Pengertian dan Elemen Multimedia|1|Perangkat input kamera digital yang dipakai siaran langsung adalah...|Webcam|Webcam menangkap video langsung ke komputer.|Mikrofon|Hanya menangkap suara audio.|Printer|Mencetak pada kertas fisik.|Scanner Flatbed|Memindai dokumen kertas statis.'
  );

  // JSON State
  const [jsonInput, setJsonInput] = useState<string>('');

  const refreshList = () => {
    setSoalList(getAllSoal());
    if (onQuestionsUpdated) onQuestionsUpdated();
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Simpan satu soal baru dari Formulir
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPertanyaan.trim() || !formJawabanBenar.trim()) {
      showNotification('Pertanyaan dan jawaban benar wajib diisi!', 'error');
      return;
    }

    let finalQ = formPertanyaan.trim();
    if (!finalQ.endsWith('...')) {
      finalQ = finalQ.replace(/[.?]+$/, '') + '...';
    }

    const pengecohArray: [Pengecoh, Pengecoh, Pengecoh] = [
      { teks: formP1Teks.trim() || 'Opsi Pengecoh 1', alasan: formP1Alasan.trim() || 'Bukan konsep yang dimaksud.' },
      { teks: formP2Teks.trim() || 'Opsi Pengecoh 2', alasan: formP2Alasan.trim() || 'Tidak tepat untuk pertanyaan ini.' },
      { teks: formTrapTeks.trim() || 'Opsi Jebakan', alasan: formTrapAlasan.trim() || 'Istilah ini sering tertukar.', jebakan: true },
    ];

    const newId = Date.now();
    const newSoal: Soal = {
      id: newId,
      topik: formTopik,
      level: formLevel,
      pertanyaan: finalQ,
      jawabanBenar: formJawabanBenar.trim(),
      penjelasan: formPenjelasan.trim() || 'Konsep ini merupakan materi inti dalam kurikulum KKA.',
      pengecoh: pengecohArray,
    };

    // Ambil custom soal yang ada saat ini
    const existingCustom = localStorage.getItem('kka_custom_soal_v1');
    const customArray: Soal[] = existingCustom ? JSON.parse(existingCustom) : [];
    customArray.push(newSoal);
    saveCustomSoal(customArray);

    refreshList();
    showNotification('Soal baru berhasil ditambahkan ke bank soal!', 'success');

    // Reset Form
    setFormPertanyaan('');
    setFormJawabanBenar('');
    setFormPenjelasan('');
    setFormP1Teks('');
    setFormP1Alasan('');
    setFormP2Teks('');
    setFormP2Alasan('');
    setFormTrapTeks('');
    setFormTrapAlasan('');
    setActiveTab('list');
  };

  // Impor Format Satu Baris per Soal dengan Pemisah Bar "|"
  // Format: Topik|Level|Pertanyaan...|JawabanBenar|Penjelasan|Pengecoh1|Alasan1|Pengecoh2|Alasan2|Jebakan|AlasanJebakan
  const handleImportPipe = () => {
    try {
      const lines = pipeInput.split('\n').filter((l) => l.trim().length > 0);
      const imported: Soal[] = [];

      lines.forEach((line, idx) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length >= 4) {
          const topik = parts[0] || 'Pengertian dan Elemen Multimedia';
          const levelNum = (parseInt(parts[1], 10) || 1) as Level;
          let q = parts[2] || 'Pertanyaan...';
          if (!q.endsWith('...')) q += '...';
          const jawabanBenar = parts[3] || 'Jawaban';
          const penjelasan = parts[4] || 'Penjelasan materi terkait.';
          const p1Teks = parts[5] || 'Pengecoh A';
          const p1Alasan = parts[6] || 'Alasan keliru.';
          const p2Teks = parts[7] || 'Pengecoh B';
          const p2Alasan = parts[8] || 'Alasan keliru.';
          const p3Teks = parts[9] || 'Pengecoh C';
          const p3Alasan = parts[10] || 'Alasan keliru (jebakan).';

          imported.push({
            id: Date.now() + idx,
            topik,
            level: levelNum,
            pertanyaan: q,
            jawabanBenar,
            penjelasan,
            pengecoh: [
              { teks: p1Teks, alasan: p1Alasan },
              { teks: p2Teks, alasan: p2Alasan },
              { teks: p3Teks, alasan: p3Alasan, jebakan: true },
            ],
          });
        }
      });

      if (imported.length === 0) {
        showNotification('Format bar tidak valid. Minimal harus ada 4 kolom dipisah tanda |', 'error');
        return;
      }

      const existingCustom = localStorage.getItem('kka_custom_soal_v1');
      const customArray: Soal[] = existingCustom ? JSON.parse(existingCustom) : [];
      saveCustomSoal([...customArray, ...imported]);
      refreshList();
      showNotification(`Berhasil mengimpor ${imported.length} soal dari format bar!`, 'success');
      setActiveTab('list');
    } catch {
      showNotification('Gagal memproses baris teks.', 'error');
    }
  };

  // Impor JSON
  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        showNotification('JSON harus berupa Array soal [ { ... } ]', 'error');
        return;
      }
      const existingCustom = localStorage.getItem('kka_custom_soal_v1');
      const customArray: Soal[] = existingCustom ? JSON.parse(existingCustom) : [];
      saveCustomSoal([...customArray, ...parsed]);
      refreshList();
      showNotification(`Berhasil mengimpor ${parsed.length} soal dari JSON!`, 'success');
      setActiveTab('list');
    } catch {
      showNotification('Format JSON tidak valid!', 'error');
    }
  };

  // Ekspor Seluruh Soal ke Berkas JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(soalList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bank_soal_kka_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Berkas JSON berhasil diunduh!', 'success');
  };

  // Kembalikan ke Bank Bawaan (Hapus Soal Kustom)
  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan seluruh soal ke 100 soal bawaan sistem?')) {
      resetCustomSoal();
      refreshList();
      showNotification('Soal berhasil dikembalikan ke 100 soal bawaan!', 'success');
    }
  };

  if (!isOpen) return null;

  const baseCount = getBaseBank().length;
  const customCount = soalList.length - baseCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Kelola & Edit Bank Soal KKA</h2>
              <p className="text-xs text-slate-400">
                Total: <strong className="text-cyan-300">{soalList.length} soal</strong> ({baseCount} bawaan + {customCount > 0 ? `${customCount} kustom` : '0 kustom'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/90 overflow-x-auto">
          {[
            { id: 'list', label: 'Daftar Soal', icon: FileText },
            { id: 'form', label: 'Tambah Soal (Formulir)', icon: Plus },
            { id: 'pipe', label: 'Impor Format Bar (|)', icon: Upload },
            { id: 'json', label: 'Impor / Ekspor JSON', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleReset}
            className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 py-1"
            title="Hapus soal kustom dan kembalikan ke bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Soal Bawaan</span>
          </button>
        </div>

        {/* Notifikasi Status Pop-up */}
        {statusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Isi Tab */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          {/* TAB 1: DAFTAR SOAL */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Daftar {soalList.length} Soal Aktif</span>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Ekspor JSON
                </button>
              </div>

              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {soalList.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-cyan-400">
                        #{idx + 1} • {s.topik}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px] font-bold text-slate-300">
                        Level {s.level}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white leading-snug">{s.pertanyaan}</p>
                    <div className="text-xs text-emerald-400 font-semibold">
                      Jawaban Benar: <span className="text-white">{s.jawabanBenar}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Penjelasan: {s.penjelasan}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FORMULIR TAMBAH SOAL */}
          {activeTab === 'form' && (
            <form onSubmit={handleSaveForm} className="space-y-4 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Topik Materi:</label>
                  <select
                    value={formTopik}
                    onChange={(e) => setFormTopik(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    {TOPIK_LIST.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Tingkat Kesulitan:</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(Number(e.target.value) as Level)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={1}>Level 1: Mudah</option>
                    <option value={2}>Level 2: Sedang</option>
                    <option value={3}>Level 3: Sulit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Kalimat Pertanyaan (akhiri dengan "..."):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Format gambar yang mendukung latar belakang transparan adalah..."
                  value={formPertanyaan}
                  onChange={(e) => setFormPertanyaan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-400">Jawaban Benar (maks 5 kata):</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PNG"
                    value={formJawabanBenar}
                    onChange={(e) => setFormJawabanBenar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-emerald-500/50 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Penjelasan Singkat (1–2 kalimat):</label>
                  <input
                    type="text"
                    placeholder="Contoh: PNG mendukung saluran transparansi alpha 24-bit tanpa kompresi yang merusak."
                    value={formPenjelasan}
                    onChange={(e) => setFormPenjelasan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Pengecoh 1, 2, dan Jebakan */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Pengecoh & Alasan:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pengecoh 1 (misal: JPEG)"
                    value={formP1Teks}
                    onChange={(e) => setFormP1Teks(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Alasan mengapa Pengecoh 1 salah"
                    value={formP1Alasan}
                    onChange={(e) => setFormP1Alasan(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Pengecoh 2 (misal: BMP)"
                    value={formP2Teks}
                    onChange={(e) => setFormP2Teks(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Alasan mengapa Pengecoh 2 salah"
                    value={formP2Alasan}
                    onChange={(e) => setFormP2Alasan(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <input
                    type="text"
                    placeholder="Pengecoh Jebakan (misal: SVG)"
                    value={formTrapTeks}
                    onChange={(e) => setFormTrapTeks(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-xs text-amber-200"
                  />
                  <input
                    type="text"
                    placeholder="Alasan mengapa jebakan ini sering tertukar"
                    value={formTrapAlasan}
                    onChange={(e) => setFormTrapAlasan(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-xs text-amber-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wider transition"
                >
                  SIMPAN SOAL BARU
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: IMPOR FORMAT BAR (|) */}
          {activeTab === 'pipe' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 space-y-1">
                <span className="font-bold block text-white">Panduan Format Satu Baris per Soal:</span>
                <p>Gunakan tanda pemisah garis tegak (|) antar kolom:</p>
                <code className="block p-2 rounded-lg bg-slate-950/80 text-[11px] text-cyan-300 overflow-x-auto whitespace-pre">
                  Topik|Level(1-3)|Pertanyaan...|JawabanBenar|Penjelasan|Pengecoh1|Alasan1|Pengecoh2|Alasan2|Jebakan|AlasanJebakan
                </code>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Masukkan Baris Teks:</label>
                <textarea
                  rows={8}
                  value={pipeInput}
                  onChange={(e) => setPipeInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportPipe}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs tracking-wider transition"
                >
                  PROSES & TAMBAHKAN SOAL
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: IMPOR & EKSPOR JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <div>
                  <span className="font-bold text-white block text-sm">Unduh Cadangan Seluruh Soal</span>
                  <span className="text-xs text-slate-400">Simpan 100+ soal saat ini ke format .json</span>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Unduh Berkas JSON
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tempel JSON Soal di Sini:</label>
                <textarea
                  rows={8}
                  placeholder='[ { "id": 101, "topik": "...", "pertanyaan": "...", "jawabanBenar": "...", ... } ]'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportJSON}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs tracking-wider transition"
                >
                  IMPOR DATA JSON
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
