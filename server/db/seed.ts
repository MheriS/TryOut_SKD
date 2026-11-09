import { db } from './index.js';
import { TryoutPackage, Question } from '../types.js';

export function seedInitialData(): void {
  const existing = db.getPackages();
  if (existing.length > 0) {
    return; // Already initialized
  }

  console.log('🌱 Seeding initial Tryout SKD packages...');

  // Questions for Tryout 1 (authentic standard SKD)
  const tryout1Questions: Question[] = [
    // === TWK (Tes Wawasan Kebangsaan) ===
    {
      id: 'q_twk_01',
      number: 1,
      subtest: 'TWK',
      topic: 'Pancasila & Ideologi',
      difficulty: 'Sedang',
      question: 'Pancasila sebagai sumber dari segala sumber hukum di Indonesia berarti seluruh produk hukum yang berlaku tidak boleh bertentangan dengan nilai-nilai Pancasila. Hal ini secara yuridis ditegaskan dalam ketetapan...',
      options: {
        A: 'Tap MPRS No. XX/MPRS/1966 dan UU No. 12 Tahun 2011',
        B: 'UUD 1945 Pasal 1 ayat (2)',
        C: 'Ketetapan MPR No. VI/MPR/2001',
        D: 'Instruksi Presiden No. 12 Tahun 1968',
        E: 'Dekrit Presiden 5 Juli 1959'
      },
      correctAnswer: 'A',
      explanation: 'Pancasila dinyatakan sebagai sumber dari segala sumber hukum negara sesuai dengan Ketetapan MPRS No. XX/MPRS/1966 dan kembali ditegaskan dalam UU No. 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan.'
    },
    {
      id: 'q_twk_02',
      number: 2,
      subtest: 'TWK',
      topic: 'Bela Negara',
      difficulty: 'HOTS',
      question: 'Di era transformasi digital, ancaman terhadap kedaulatan bangsa berkembang menjadi ancaman hibrida (cyber warfare dan disinformasi). Perwujudan sikap bela negara yang paling tepat dilakukan oleh seorang ASN bidang IT adalah...',
      options: {
        A: 'Mengikuti pelatihan militer cadangan setiap akhir pekan',
        B: 'Mengembangkan sistem keamanan siber yang tangguh dan memverifikasi integritas data publik',
        C: 'Membuat petisi penolakan terhadap platform digital asing',
        D: 'Membatasi akses internet publik pada jam-jam kerja instansi',
        E: 'Melaporkan setiap akun media sosial yang berbeda pandangan politik'
      },
      correctAnswer: 'B',
      explanation: 'Bela negara profesi bagi ASN IT diwujudkan dengan keahlian teknisnya menjaga keamanan data dan infrastruktur digital negara dari serangan siber dan distorsi informasi publik.'
    },
    {
      id: 'q_twk_03',
      number: 3,
      subtest: 'TWK',
      topic: 'UUD 1945',
      difficulty: 'Sedang',
      question: 'Berdasarkan Pasal 23A UUD 1945 hasil amandemen, ketentuan mengenai pajak dan pungutan lain yang bersifat memaksa untuk keperluan negara diatur dengan...',
      options: {
        A: 'Peraturan Pemerintah',
        B: 'Peraturan Presiden',
        C: 'Undang-Undang',
        D: 'Keputusan Menteri Keuangan',
        E: 'Ketetapan MPR'
      },
      correctAnswer: 'C',
      explanation: 'Pasal 23A UUD 1945 secara eksplisit berbunyi: "Pajak dan pungutan lain yang bersifat memaksa untuk keperluan negara diatur dengan undang-undang".'
    },
    {
      id: 'q_twk_04',
      number: 4,
      subtest: 'TWK',
      topic: 'Nasionalisme & Sejarah',
      difficulty: 'Sedang',
      question: 'Sumpah Pemuda 28 Oktober 1928 merupakan tonggak penting persatuan nasional. Kongres Pemuda II yang melahirkan ikrar tersebut diketuai oleh...',
      options: {
        A: 'Soegondo Djojopoespito',
        B: 'Mohammad Yamin',
        C: 'Amir Sjarifuddin',
        D: 'Djoko Marsaid',
        E: 'Johannes Leimena'
      },
      correctAnswer: 'A',
      explanation: 'Kongres Pemuda II diketuai oleh Soegondo Djojopoespito (PPPI), sedangkan Mohammad Yamin bertindak sebagai sekretaris yang merumuskan ikrar Sumpah Pemuda.'
    },
    {
      id: 'q_twk_05',
      number: 5,
      subtest: 'TWK',
      topic: 'Integritas & Anti-Korupsi',
      difficulty: 'HOTS',
      question: 'Seorang pejabat pengadaan barang dan jasa menolak parcel hari raya mewah senilai Rp 10 juta dari rekanan pemenang tender, lalu melaporkannya ke Unit Pengendalian Gratifikasi (UPG). Tindakan ini mencerminkan integritas pada dimensi...',
      options: {
        A: 'Kejujuran kognitif',
        B: 'Konsistensi moral dan kepatuhan kode etik antikorupsi',
        C: 'Pencitraan akuntabilitas institusi',
        D: 'Kewaspadaan hubungan diplomatik kerja',
        E: 'Solidaritas sosial antar pegawai'
      },
      correctAnswer: 'B',
      explanation: 'Menolak gratifikasi yang berhubungan dengan jabatan dan melaporkannya ke UPG/KPK mencerminkan nilai integritas tinggi, kepatuhan kode etik, dan komitmen anti benturan kepentingan.'
    },

    // === TIU (Tes Inteligensia Umum) ===
    {
      id: 'q_tiu_01',
      number: 6,
      subtest: 'TIU',
      topic: 'Analogi Kata',
      difficulty: 'Sedang',
      question: 'KAPAL : BURITAN = BURUNG : ...',
      options: {
        A: 'Sayap',
        B: 'Ekor',
        C: 'Paruh',
        D: 'Cakar',
        E: 'Bulu'
      },
      correctAnswer: 'B',
      explanation: 'Buritan adalah bagian belakang kapal. Bagian belakang burung adalah ekor.'
    },
    {
      id: 'q_tiu_02',
      number: 7,
      subtest: 'TIU',
      topic: 'Deret Angka',
      difficulty: 'Sedang',
      question: 'Tentukan angka berikutnya dari deret: 3, 6, 11, 18, 27, ...',
      options: {
        A: '36',
        B: '38',
        C: '39',
        D: '40',
        E: '42'
      },
      correctAnswer: 'B',
      explanation: 'Pola selisih: +3, +5, +7, +9, selisih berikutnya +11. Maka 27 + 11 = 38.'
    },
    {
      id: 'q_tiu_03',
      number: 8,
      subtest: 'TIU',
      topic: 'Silogisme Logika',
      difficulty: 'Sedang',
      question: 'Semua calon ASN yang lulus SKD memiliki kartu ujian asli.\nSebagian peserta di ruangan A tidak memiliki kartu ujian asli.\nKesimpulan yang sah adalah...',
      options: {
        A: 'Semua peserta di ruangan A tidak lulus SKD',
        B: 'Sebagian peserta di ruangan A bukan calon ASN yang lulus SKD',
        C: 'Sebagian peserta di ruangan A lulus SKD dengan kartu susulan',
        D: 'Semua calon ASN yang tidak punya kartu ujian ada di ruangan A',
        E: 'Tidak dapat ditarik kesimpulan'
      },
      correctAnswer: 'B',
      explanation: 'Karena semua yang lulus pasti punya kartu asli, maka siapa pun yang tidak punya kartu asli (termasuk sebagian peserta di ruangan A) dipastikan bukan calon ASN yang lulus SKD.'
    },
    {
      id: 'q_tiu_04',
      number: 9,
      subtest: 'TIU',
      topic: 'Aritmetika & Perbandingan',
      difficulty: 'Sedang',
      question: 'Sebuah proyek pembangunan jembatan dapat diselesaikan oleh 18 pekerja dalam waktu 30 hari. Jika setelah 10 hari bekerja pekerjaan terhenti selama 5 hari karena cuaca buruk, berapa tambahan pekerja yang dibutuhkan agar proyek selesai tepat waktu?',
      options: {
        A: '4 orang',
        B: '6 orang',
        C: '8 orang',
        D: '10 orang',
        E: '12 orang'
      },
      correctAnswer: 'B',
      explanation: 'Sisa hari rencana: 30 - 10 = 20 hari untuk 18 pekerja (Beban = 20 x 18 = 360 orang.hari). Sisa waktu aktual karena terhenti 5 hari: 20 - 5 = 15 hari. Jumlah pekerja yang dibutuhkan = 360 / 15 = 24 pekerja. Tambahan pekerja = 24 - 18 = 6 orang.'
    },
    {
      id: 'q_tiu_05',
      number: 10,
      subtest: 'TIU',
      topic: 'Analitis Posisi',
      difficulty: 'HOTS',
      question: 'Enam orang (P, Q, R, S, T, U) duduk melingkar mengelilingi meja bundar. P duduk berhadapan dengan R. Q duduk di sebelah kanan P. S duduk di sebelah kiri R. T duduk di antara R dan Q. Siapakah yang duduk tepat berhadapan dengan Q?',
      options: {
        A: 'P',
        B: 'R',
        C: 'S',
        D: 'T',
        E: 'U'
      },
      correctAnswer: 'C',
      explanation: 'Dengan 6 posisi melingkar: Jika P di jam 12, maka R berhadapan di jam 6. Q di kanan P (jam 2). T di antara R dan Q (jam 4). S di kiri R (jam 8). Maka U di jam 10. Yang berhadapan dengan Q (jam 2) adalah posisi jam 8 yaitu S.'
    },

    // === TKP (Tes Karakteristik Pribadi) ===
    {
      id: 'q_tkp_01',
      number: 11,
      subtest: 'TKP',
      topic: 'Pelayanan Publik',
      difficulty: 'HOTS',
      question: 'Ketika Anda bertugas di loket pelayanan pada pukul 15.45 (15 menit sebelum loket ditutup), seorang warga lanjut usia datang dengan napas terengah-engah untuk mengurus surat keterangan mendesak demi pencairan santunan pengobatan keluarganya. Berkas warga tersebut masih kurang satu fotokopi KTP penjamin. Sikap Anda adalah...',
      options: {
        A: 'Membantu memfotokopikan KTP penjamin di ruang staf internal, memverifikasi data dengan cepat, dan menyelesaikan proses penerbitan surat hari itu juga',
        B: 'Menerima berkas apa adanya dan meminta warga melengkapinya besok pagi',
        C: 'Menjelaskan dengan ramah bahwa loket hampir tutup dan memintanya datang kembali pagi hari dengan berkas lengkap',
        D: 'Meminta satpam untuk membantu warga tersebut mencari tempat fotokopi di luar kantor sementara Anda menunggu',
        E: 'Melaporkan kepada atasan terlebih dahulu untuk meminta izin dispensasi keterlambatan'
      },
      tkpScores: {
        A: 5,
        D: 4,
        E: 3,
        B: 2,
        C: 1
      },
      explanation: 'Opsi A (Skor 5): Menunjukkan integritas pelayanan publik berorientasi kemanusiaan yang proaktif, empati tinggi terhadap lansia/keadaan mendesak, serta memberi solusi konkret tanpa melanggar prinsip keabsahan data.'
    },
    {
      id: 'q_tkp_02',
      number: 12,
      subtest: 'TKP',
      topic: 'Jejaring Kerja & Kolaborasi',
      difficulty: 'Sedang',
      question: 'Instansi Anda membentuk tim lintas divisi untuk menyusun inovasi pelayanan terpadu. Salah satu anggota tim dari divisi lain tampak pasif dan sering tidak merespons diskusi di grup koordinasi. Yang akan Anda lakukan adalah...',
      options: {
        A: 'Mengabaikannya dan mengerjakan bagian tugasnya bersama anggota tim lain yang aktif',
        B: 'Menghubunginya secara personal untuk menanyakan kendala yang dihadapinya dan membagi tugas sesuai keahliannya secara adil',
        C: 'Melaporkan kelakuan anggota tersebut langsung ke ketua panitia agar diganti orang lain',
        D: 'Menegurnya secara terbuka di forum rapat agar ia sadar akan kewajibannya',
        E: 'Menunggu sampai batas akhir tenggat waktu untuk melihat apakah dia menyelesaikan tugas'
      },
      tkpScores: {
        B: 5,
        A: 3,
        D: 2,
        C: 4,
        E: 1
      },
      explanation: 'Opsi B (Skor 5): Menunjukkan kompetensi jejaring kerja dan kepemimpinan interpersonal, mengedepankan pendekatan solutif suportif untuk mengoptimalkan kontribusi rekan tim.'
    },
    {
      id: 'q_tkp_03',
      number: 13,
      subtest: 'TKP',
      topic: 'Teknologi Informasi & Komunikasi',
      difficulty: 'Sedang',
      question: 'Kementerian Anda baru saja meluncurkan aplikasi manajemen surat digital baru untuk menggantikan disposisi kertas manual. Beberapa rekan senior mengeluh bingung dan berniat tetap memakai metode manual. Sikap Anda...',
      options: {
        A: 'Membiarkan mereka karena adaptasi teknologi memang membutuhkan waktu',
        B: 'Menggunakan aplikasi untuk diri sendiri dan tidak mencampuri pilihan rekan senior',
        C: 'Membuka sesi pendampingan santai saat jam istirahat untuk mendemokan kemudahan fitur aplikasi bagi rekan senior',
        D: 'Menyarankan pimpinan untuk memberikan sanksi bagi pegawai yang menolak aplikasi baru',
        E: 'Mengusulkan agar sistem manual tetap dipertahankan berdampingan selamanya'
      },
      tkpScores: {
        C: 5,
        D: 3,
        B: 2,
        A: 2,
        E: 1
      },
      explanation: 'Opsi C (Skor 5): Sikap adaptif terhadap transformasi digital dan inisiatif membantu rekan sejawat agar organisasi bertransformasi secara inklusif.'
    },
    {
      id: 'q_tkp_04',
      number: 14,
      subtest: 'TKP',
      topic: 'Profesionalisme',
      difficulty: 'HOTS',
      question: 'Anda mendapati atasan langsung Anda secara keliru menandatangani draf laporan analisis publik yang mengandung kesalahan data krusial sebelum diumumkan pada konferensi pers 1 jam lagi. Tindakan paling profesional yang Anda ambil adalah...',
      options: {
        A: 'Membiarkannya karena kesalahan tersebut adalah tanggung jawab atasan sebagai penanda tangan',
        B: 'Segera menghadap atasan secara santun di ruang kerjanya, menunjukkan letak kekeliruan data beserta bukti valid, dan menyiapkan lembar revisi siap tanda tangan',
        C: 'Menyebarkan koreksi langsung kepada media massa agar kredibilitas kementerian tidak jatuh',
        D: 'Membicarakan kekeliruan tersebut dengan rekan sejawat satu divisi terlebih dahulu',
        E: 'Menghubungi bagian humas untuk membatalkan sepihak konferensi pers'
      },
      tkpScores: {
        B: 5,
        D: 2,
        C: 1,
        A: 1,
        E: 3
      },
      explanation: 'Opsi B (Skor 5): Sikap profesional, menjaga etika hierarki kepemimpinan, sigap mencegah krisis organisasi dengan membawa solusi nyata sebelum dampak merugikan terjadi.'
    },
    {
      id: 'q_tkp_05',
      number: 15,
      subtest: 'TKP',
      topic: 'Sosial Budaya & Anti Radikalisme',
      difficulty: 'Sedang',
      question: 'Dalam sebuah diskusi santai di kantin kantor, seorang rekan kerja mulai mengutarakan narasi kebencian terhadap kelompok agama tertentu dan meragukan ideologi Pancasila. Tanggapan Anda yang paling tepat adalah...',
      options: {
        A: 'Langsung pergi meninggalkan meja makan tanpa berkata apa-apa',
        B: 'Ikut mengiyakan agar suasana tidak menjadi canggung',
        C: 'Meluruskan pandangan tersebut dengan tenang bahwa keberagaman adalah kekuatan bangsa Indonesia dan mengingatkan netralitas ASN',
        D: 'Merekam pembicaraannya secara sembunyi-sembunyi untuk diviralkan di media sosial',
        E: 'Memancing perdebatan sengit dengan nada tinggi'
      },
      tkpScores: {
        C: 5,
        A: 3,
        D: 2,
        B: 1,
        E: 2
      },
      explanation: 'Opsi C (Skor 5): Menjaga marwah ASN sebagai perekat dan pemersatu bangsa, berani bersikap tegas dengan cara dialogis edukatif dalam menangkal bibit intoleransi.'
    }
  ];

  // Tryout 1 - Standar Nasional (Published, v1.0)
  const tryout1: TryoutPackage = {
    id: 'pkg_skd_001',
    code: 'TO-SKD-001',
    title: 'Tryout 1 - SKD CPNS 2026 Standar Nasional',
    description: 'Paket simulasi Seleksi Kompetensi Dasar resmi dengan komposisi TWK, TIU, dan TKP sesuai Keputusan MenPAN-RB terbaru.',
    durationMinutes: 100,
    totalQuestions: tryout1Questions.length,
    passingGrades: {
      twk: 65,
      tiu: 80,
      tkp: 166
    },
    currentVersion: 'v1.0',
    versions: [
      {
        version: 'v1.0',
        versionNumber: 1,
        status: 'published',
        changelog: 'Rilis perdana paket soal SKD terpusat hasil validasi kurikulum BKN.',
        questions: tryout1Questions,
        createdAt: new Date('2026-11-01T08:00:00Z').toISOString(),
        publishedAt: new Date('2026-11-01T09:00:00Z').toISOString(),
        approvedBy: 'Administrator BKN'
      }
    ],
    createdAt: new Date('2026-11-01T08:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-01T09:00:00Z').toISOString()
  };

  // Tryout 2 - SKD Mandiri Kedinasan (Draft / In Review for Admin to see editing and validation flow)
  const tryout2Questions: Question[] = [
    {
      id: 'q_t2_01',
      number: 1,
      subtest: 'TWK',
      topic: 'Sejarah Perjuangan Bangsa',
      difficulty: 'Sedang',
      question: 'Peristiwa Rengasdengklok pada tanggal 16 Agustus 1945 diprakarsai oleh golongan muda dengan tujuan utama...',
      options: {
        A: 'Memaksa Soekarno-Hatta mundur dari kepemimpinan PPKI',
        B: 'Menjauhkan Soekarno-Hatta dari pengaruh militer Jepang agar segera memproklamasikan kemerdekaan',
        C: 'Menyusun naskah proklamasi bersama tentara PETA di markas Rengasdengklok',
        D: 'Menghindari penangkapan oleh tentara sekutu yang baru mendarat',
        E: 'Mengamankan persenjataan dari markas tentara Jepang'
      },
      correctAnswer: 'B',
      explanation: 'Tujuan golongan muda mengamankan Soekarno-Hatta ke Rengasdengklok adalah menjauhkan mereka dari campur tangan atau janji manis Jepang, sehingga kemerdekaan dapat diproklamasikan atas kekuatan bangsa sendiri.'
    },
    {
      id: 'q_t2_02',
      number: 2,
      subtest: 'TIU',
      topic: 'Silogisme',
      difficulty: 'Sedang',
      question: 'Semua mahasiswa IPDN memiliki kedisiplinan tinggi.\nBeberapa atlet renang adalah mahasiswa IPDN.\nKesimpulan yang tepat adalah...',
      options: {
        A: 'Semua atlet renang memiliki kedisiplinan tinggi',
        B: 'Beberapa atlet renang memiliki kedisiplinan tinggi',
        C: 'Semua orang yang disiplin tinggi adalah mahasiswa IPDN',
        D: 'Beberapa mahasiswa IPDN bukan atlet renang',
        E: 'Tidak ada atlet renang yang memiliki kedisiplinan tinggi'
      },
      correctAnswer: 'B',
      explanation: 'Premis: Sebagian atlet renang adalah mahasiswa IPDN. Semua mahasiswa IPDN berdisiplin tinggi. Maka sebagian atlet renang memiliki kedisiplinan tinggi.'
    },
    {
      id: 'q_t2_03',
      number: 3,
      subtest: 'TKP',
      topic: 'Jejaring Kerja',
      difficulty: 'Sedang',
      question: 'Anda ditunjuk memimpin proyek kerja sama antar kementerian yang anggotanya memiliki latar belakang budaya dan cara kerja yang berbeda-beda. Sikap awal yang Anda lakukan adalah...',
      options: {
        A: 'Membuat forum ramah tamah untuk saling mengenal gaya kerja dan menyepakati aturan bersama secara kolegial',
        B: 'Langsung membagi beban kerja secara ketat tanpa kompromi',
        C: 'Membiarkan masing-masing anggota bekerja sesuka hati asalkan target tercapai',
        D: 'Meminta atasan memilih anggota tim yang satu instansi saja',
        E: 'Membuat regulasi kaku dengan sanksi tegas di hari pertama'
      },
      tkpScores: {
        A: 5,
        B: 3,
        D: 1,
        C: 2,
        E: 2
      },
      explanation: 'Opsi A (Skor 5): Menunjukkan kemampuan membangun konsensus tim dan memahami dinamika keberagaman budaya kerja.'
    }
  ];

  const tryout2: TryoutPackage = {
    id: 'pkg_skd_002',
    code: 'TO-SKD-002',
    title: 'Tryout 2 - SKD Sekolah Kedinasan & CPNS Khusus',
    description: 'Paket latihan soal intensif dengan fokus materi penalaran analitis dan integritas nasionalisme.',
    durationMinutes: 90,
    totalQuestions: tryout2Questions.length,
    passingGrades: {
      twk: 65,
      tiu: 80,
      tkp: 166
    },
    currentVersion: 'v1.0',
    versions: [
      {
        version: 'v1.0',
        versionNumber: 1,
        status: 'in_review',
        changelog: 'Draft awal hasil kurasi AI, menunggu finalisasi dan persetujuan admin.',
        questions: tryout2Questions,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.savePackage(tryout1);
  db.savePackage(tryout2);
  console.log('✅ Successfully seeded Tryout 1 (Published) and Tryout 2 (In Review).');
}
