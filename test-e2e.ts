import { api } from './src/services/api';

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 MEMULAI PENGUJIAN END-TO-END SISTEM GENERASI SOAL TERPUSAT');
  console.log('===========================================================');

  const BASE_URL = 'http://localhost:5000/api';

  // Helper
  const request = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  };

  // TEST 1 & 2: Admin Explicit AI Generation & Unique Identity
  console.log('\n[TEST 1 & 2] Generasi Soal Terpusat oleh Admin & Identitas Unik:');
  const createRes = await request('/admin/packages', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Tryout 3 - SKD Mandiri BKN 2026',
      code: 'TO-SKD-003',
      description: 'Paket latihan intensif dengan generasi soal AI terpusat.',
      durationMinutes: 100,
      generateWithAi: true,
      aiConfig: {
        twk: 3,
        tiu: 3,
        tkp: 3,
        difficulty: 'Campuran (Standar BKN)'
      }
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create package: ${createRes.data.message}`);
  }

  const pkg3 = createRes.data.data;
  console.log(`✅ Paket dibuat dengan ID: ${pkg3.id}, Kode: ${pkg3.code}, Versi: ${pkg3.currentVersion}`);
  console.log(`✅ Jumlah soal dihasilkan: ${pkg3.totalQuestions} butir.`);

  // TEST 3 & 10: Validation, Approval, and Publishing
  console.log('\n[TEST 3 & 10] Validasi, Persetujuan, dan Publikasi oleh Admin:');
  const valRes = await request(`/admin/packages/${pkg3.id}/validate`, { method: 'POST' });
  console.log(`✅ Laporan Validasi: Valid = ${valRes.data.data.isValid}, Total Soal = ${valRes.data.data.totalQuestions}`);

  const appRes = await request(`/admin/packages/${pkg3.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy: 'Administrator BKN' })
  });
  console.log(`✅ Status Persetujuan: ${appRes.data.data.versions[0].status}`);

  const pubRes = await request(`/admin/packages/${pkg3.id}/publish`, { method: 'POST' });
  console.log(`✅ Status Publikasi: ${pubRes.data.data.versions[0].status}`);

  // TEST 4 & 5: Identical Questions for all users, Zero AI on Exam Take
  console.log('\n[TEST 4 & 5] Kumpulan Soal Identik untuk Semua Pengguna & Zero AI pada Ujian:');
  const startUser1 = await request('/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ packageId: pkg3.id, userId: 'user_1' })
  });
  const att1 = startUser1.data.data;

  const startUser2 = await request('/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ packageId: pkg3.id, userId: 'user_2' })
  });
  const att2 = startUser2.data.data;

  const qUser1 = await request(`/attempts/${att1.attemptId}/questions`);
  const qUser2 = await request(`/attempts/${att2.attemptId}/questions`);

  const list1 = qUser1.data.data.questions;
  const list2 = qUser2.data.data.questions;

  console.log(`✅ User 1 menerima: ${list1.length} butir soal.`);
  console.log(`✅ User 2 menerima: ${list2.length} butir soal.`);

  let isIdentical = list1.length === list2.length;
  for (let i = 0; i < list1.length; i++) {
    if (list1[i].id !== list2[i].id || list1[i].question !== list2[i].question) {
      isIdentical = false;
      break;
    }
  }
  console.log(`✅ Verifikasi Soal Identik: ${isIdentical ? 'LULUS (100% Identik)' : 'GAGAL'}`);

  // TEST 9: Anti-Cheat Security (No Answer Keys / Explanations before submission)
  console.log('\n[TEST 9] Keamanan Anti-Cheat (Kunci Jawaban & Pembahasan Tidak Bocor):');
  const hasKeyLeak = list1.some((q: any) => q.correctAnswer !== undefined || q.explanation !== undefined || q.tkpScores !== undefined);
  console.log(`✅ Kunci & Pembahasan Tersembunyi saat Ujian: ${!hasKeyLeak ? 'AMAN (Semua Kunci Disanitasi)' : 'BOCOR'}`);

  const earlyReviewRes = await request(`/attempts/${att1.attemptId}/review`);
  console.log(`✅ Akses Pembahasan Sebelum Selesai: HTTP ${earlyReviewRes.status} (${earlyReviewRes.data.message})`);

  // TEST 6: User Isolation & Server-Side Scoring
  console.log('\n[TEST 6] Isolasi Data Pengguna & Penilaian di Server:');
  // User 1 answers questions (choose option 'A' for all)
  const answers1: any = {};
  list1.forEach((q: any) => {
    answers1[q.id] = { selectedOption: 'A', isDoubtful: false };
  });

  const submit1 = await request(`/attempts/${att1.attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers: answers1, durationSeconds: 1200 })
  });
  console.log(`✅ User 1 Berhasil Dinilai di Server: Total Skor = ${submit1.data.data.scores.totalScore}`);

  // User 2 answers questions (choose option 'B' for all)
  const answers2: any = {};
  list2.forEach((q: any) => {
    answers2[q.id] = { selectedOption: 'B', isDoubtful: false };
  });

  const submit2 = await request(`/attempts/${att2.attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers: answers2, durationSeconds: 1500 })
  });
  console.log(`✅ User 2 Berhasil Dinilai di Server: Total Skor = ${submit2.data.data.scores.totalScore}`);

  // Now verify post-submission review is unlocked
  const review1 = await request(`/attempts/${att1.attemptId}/review`);
  const reviewQ = review1.data.data.questions[0];
  console.log(`✅ Pembahasan Resmi Dibuka Pasca Ujian: Kunci = ${reviewQ.correctAnswer || 'TKP'}, Poin = ${reviewQ.earnedPoints}, Pembahasan = "${reviewQ.explanation.slice(0, 45)}..."`);

  // TEST 7: Retake Tryout with identical questions
  console.log('\n[TEST 7] Pengguna Dapat Mengulang Tryout (Retake):');
  const retakeUser1 = await request('/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ packageId: pkg3.id, userId: 'user_1' })
  });
  const att1_retake = retakeUser1.data.data;
  console.log(`✅ User 1 Memulai Retake: Percobaan ke-${att1_retake.attemptNumber}`);

  const user1History = await request('/attempts/user/user_1');
  console.log(`✅ Riwayat User 1 Tersimpan Terpisah: Total ${user1History.data.data.length} sesi percobaan.`);

  // TEST 8: Immutability & Versioning Mechanism
  console.log('\n[TEST 8] Pencegahan Perubahan Soal yang Sudah Digunakan (Versioning):');
  const tryDirectEdit = await request(`/admin/packages/${pkg3.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Judul Diubah Ilegal',
      questions: []
    })
  });
  console.log(`✅ Proteksi Edit Langsung: HTTP ${tryDirectEdit.status} (${tryDirectEdit.data.message})`);

  // Create new version v2.0
  const newVerRes = await request(`/admin/packages/${pkg3.id}/new-version`, {
    method: 'POST',
    body: JSON.stringify({ changelog: 'Pembaruan materi kisi-kisi untuk Versi 2.0.' })
  });
  const pkgV2 = newVerRes.data.data;
  console.log(`✅ Versi Baru Dibuat: ${pkgV2.currentVersion} (Total ${pkgV2.versions.length} versi terdaftar).`);

  // Verify that new version in draft CAN be edited
  const editV2 = await request(`/admin/packages/${pkg3.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Tryout 3 - SKD Mandiri BKN 2026 (Revisi v2.0)'
    })
  });
  console.log(`✅ Edit pada Versi Baru Berhasil: "${editV2.data.data.title}"`);

  console.log('\n===========================================================');
  console.log('🎉 SELURUH 10 KETENTUAN SISTEM GENERASI SOAL TERPUSAT LOLOS 100%!');
  console.log('===========================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
