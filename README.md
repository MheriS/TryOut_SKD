# Sistem Tryout SKD CPNS Terpusat (BKN Standard)

Sistem Simulasi CAT SKD CPNS modern dengan arsitektur **AI Question Generation Terpusat**, penyimpanan permanen ke database, validasi kurikulum, penguncian integritas soal (*immutability*), dan mekanisme versioning.

---

## 🏛️ 10 Ketentuan Wajib Sistem Terpusat

| No | Ketentuan Sistem | Implementasi Teknis | Status |
|:---|:---|:---|:---:|
| 1 | **AI Hanya Dipanggil oleh Admin** | AI (`@google/genai` Gemini SDK) hanya dipanggil ketika Admin menekan tombol *"Buat Paket Baru"* di Admin Dashboard. | ✅ Lolos |
| 2 | **Identitas Unik Paket Tryout** | Setiap paket memiliki ID unik, kode resmi (`TO-SKD-001`, `TO-SKD-002`, dst.), judul, durasi, dan spesifikasi passing grade. | ✅ Lolos |
| 3 | **Penyimpanan Permanen ke Database** | Soal hasil generasi disimpan secara permanen di database (`data/packages.json`) setelah lolos validasi otomatis dan persetujuan Admin (*DRAFT* → *IN REVIEW* → *APPROVED* → *PUBLISHED*). | ✅ Lolos |
| 4 | **Kumpulan Soal Identik untuk Seluruh Pengguna** | Semua peserta yang mengakses paket atau versi yang sama menerima urutan butir soal, narasi pertanyaan, pilihan A–E, dan kunci yang 100% seragam langsung dari database. | ✅ Lolos |
| 5 | **Zero AI saat Ujian Berlangsung** | Sistem **TIDAK PERNAH memanggil AI** saat peserta memulai atau mengerjakan ujian. Ujian berjalan cepat, stabil, tanpa latensi LLM dan hemat kuota. | ✅ Lolos |
| 6 | **Pemisahan Data Peserta** | Jawaban, skor (TWK, TIU, TKP), sisa waktu, dan histori tiap peserta diisolasi dalam record terpisah (`data/attempts.json`). | ✅ Lolos |
| 7 | **Pengguna Dapat Mengulang Tryout (Retake)** | Peserta dapat menekan tombol *"Kerjakan Ulang"* untuk menguji kemampuan kembali dengan paket soal yang sama. Sistem mencatat *Percobaan #1*, *Percobaan #2*, dst. | ✅ Lolos |
| 8 | **Immutability & Mekanisme Versi** | Jika suatu paket/versi telah memiliki minimal 1 pengerjaan oleh peserta, pengeditan langsung diblokir (*HTTP 403 Forbidden*). Revisi soal wajib menggunakan fitur *"Buat Versi Baru"* (misal: v1.0 → v2.0) sehingga riwayat peserta sebelumnya tetap valid. | ✅ Lolos |
| 9 | **Keamanan Anti-Cheat (Kunci & Pembahasan)** | Endpoint pengambilan soal ujian (`GET /api/attempts/:id/questions`) **menghapus secara total** field `correctAnswer`, bobot `tkpScores`, dan `explanation`. Penilaian dilakukan *server-side* saat submit. Pembahasan baru dibuka di endpoint review setelah ujian berstatus selesai. | ✅ Lolos |
| 10 | **Dashboard Admin Lengkap** | Tersedia antarmuka lengkap untuk membuat paket (AI/manual), mengedit soal, automated checklist validator, menyetujui, memublikasikan, mengarsipkan, membuat versi baru, dan memonitor leaderboard peserta. | ✅ Lolos |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Mode Produksi (Fullstack Terpadu)
Menjalankan server backend Express sekaligus menyajikan antarmuka frontend web:
```bash
npm start
```
Buka peramban di: **`http://localhost:5000`**

### 2. Mode Pengembangan (Dev Server)
Menjalankan backend dengan live-reload dan Vite frontend:
```bash
npm run dev
```
- Frontend Vite: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### 3. Menjalankan Uji Otomatis (E2E Test)
Untuk memverifikasi kesepuluh ketentuan arsitektur terpusat:
```bash
npx tsx test-e2e.ts
```

---

## ⚙️ Konfigurasi API Key (Opsional)
Sistem dilengkapi dengan **Dual-Engine Generator**:
1. **Google Gemini Generative AI**: Aktif otomatis jika `GEMINI_API_KEY` diisi di file `.env` atau dikonfigurasi melalui menu *"AI Settings"* di antarmuka Admin.
2. **Authentic SKD BKN Engine (Fallback)**: Berjalan otomatis jika belum ada API Key atau saat kuota habis, menghasilkan butir soal TWK, TIU, dan TKP berstandar resmi tanpa galat.
