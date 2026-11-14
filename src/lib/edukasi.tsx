/**
 * Isi halaman edukasi. Teks ini adalah draf umum — mohon ditinjau bidan/dosen
 * pembimbing sebelum penelitian dimulai.
 */
import { IkonDaun, IkonGelas, IkonPerisai, IkonPil, IkonTetesGaris } from "@/components/ikon";

export type Topik = {
  slug: string;
  judul: string;
  ringkas: string;
  warna: string;
  Ikon: (p: { size?: number }) => React.ReactNode;
  isi: React.ReactNode;
};

export const TOPIK: Topik[] = [
  {
    slug: "cara-minum",
    judul: "Cara minum TTD yang benar",
    ringkas: "Kapan diminum, pakai apa, dan apa yang perlu dihindari.",
    warna: "bg-petal",
    Ikon: IkonGelas,
    isi: (
      <>
        <h2>Minum dengan apa?</h2>
        <p>
          Minum TTD dengan <strong>air putih</strong>. Air jeruk atau buah yang mengandung vitamin C juga membantu zat besi
          lebih mudah diserap tubuh.
        </p>
        <h2>Yang sebaiknya dihindari</h2>
        <ul>
          <li>Jangan minum TTD bersamaan dengan <strong>teh, kopi, atau susu</strong>: zat di dalamnya menghambat penyerapan zat besi.</li>
          <li>Beri jarak sekitar 2 jam dari minum teh, kopi, susu, atau obat maag.</li>
        </ul>
        <h2>Kapan waktu terbaik?</h2>
        <p>
          Pilih jam yang paling mudah kamu ingat dan konsisten setiap jadwal. Jika perut terasa tidak nyaman, coba minum
          setelah makan atau menjelang tidur.
        </p>
        <h2>Efek yang mungkin muncul</h2>
        <p>
          Sebagian orang merasa mual ringan atau tinja berwarna hitam. Ini umumnya normal. Jika keluhan berat atau
          mengganggu, ceritakan ke petugas UKS, bidan, atau puskesmas — jangan langsung berhenti.
        </p>
      </>
    ),
  },
  {
    slug: "anemia",
    judul: "Apa itu anemia?",
    ringkas: "Tanda, penyebab, dampaknya",
    warna: "bg-peach",
    Ikon: IkonTetesGaris,
    isi: (
      <>
        <p>
          Anemia adalah keadaan ketika kadar <strong>hemoglobin (Hb)</strong> dalam darah lebih rendah dari normal. Hb
          bertugas membawa oksigen ke seluruh tubuh, termasuk otak dan otot.
        </p>
        <h2>Tanda yang sering muncul</h2>
        <ul>
          <li>Lemah, letih, lesu, mudah capek (5L)</li>
          <li>Sulit konsentrasi, mengantuk di kelas</li>
          <li>Pusing, mata berkunang-kunang</li>
          <li>Wajah, kelopak mata bagian dalam, bibir, dan kuku tampak pucat</li>
        </ul>
        <h2>Kenapa remaja putri berisiko?</h2>
        <ul>
          <li>Kehilangan darah setiap bulan saat haid</li>
          <li>Kebutuhan zat besi meningkat di masa pertumbuhan</li>
          <li>Pola makan kurang sumber zat besi, atau sering diet</li>
        </ul>
        <h2>Cara memastikannya</h2>
        <p>
          Anemia hanya bisa dipastikan dengan <strong>pemeriksaan Hb</strong> oleh tenaga kesehatan, misalnya di
          puskesmas atau saat skrining di sekolah.
        </p>
      </>
    ),
  },
  {
    slug: "dosis",
    judul: "Dosis TTD untukmu",
    ringkas: "Pencegahan vs pengobatan",
    warna: "bg-lavender",
    Ikon: IkonPil,
    isi: (
      <>
        <h2>Untuk pencegahan</h2>
        <p>
          Remaja putri dianjurkan minum <strong>1 tablet TTD setiap minggu</strong> sepanjang tahun, sesuai program
          pemerintah. Ini berlaku juga untuk kamu yang belum tahu kadar Hb-nya.
        </p>
        <h2>Untuk pengobatan anemia</h2>
        <p>
          Jika kamu dinyatakan anemia, TTD diminum <strong>lebih sering (harian)</strong> dalam jangka waktu tertentu.
          Dosis dan lamanya ditentukan oleh <strong>tenaga kesehatan</strong>, lalu Hb diperiksa ulang untuk melihat
          hasilnya.
        </p>
        <h2>Saat haid</h2>
        <p>
          Tetap minum TTD sesuai jadwalmu. Saat haid tubuh kehilangan zat besi, jadi jangan sampai terlewat.
        </p>
        <p className="rounded-xl bg-blush p-3 text-sm!">
          Aplikasi ini tidak menentukan pengobatan. Selalu ikuti anjuran bidan, dokter, atau petugas puskesmas.
        </p>
      </>
    ),
  },
  {
    slug: "pencegahan",
    judul: "Kenapa pencegahan penting",
    ringkas: "Untuk sekarang dan masa depan",
    warna: "bg-mint",
    Ikon: IkonPerisai,
    isi: (
      <>
        <h2>Untuk sekarang</h2>
        <ul>
          <li>Badan lebih bertenaga, tidak mudah lelah</li>
          <li>Lebih mudah fokus belajar dan berprestasi</li>
          <li>Daya tahan tubuh lebih baik</li>
        </ul>
        <h2>Untuk masa depan</h2>
        <p>
          Remaja putri adalah calon ibu. Cadangan zat besi yang cukup sejak remaja membantu kehamilan yang sehat kelak
          dan menurunkan risiko bayi lahir dengan berat badan rendah serta <strong>stunting</strong>.
        </p>
        <h2>Langkah sederhana</h2>
        <ul>
          <li>Minum TTD sesuai jadwal</li>
          <li>Makan makanan bergizi seimbang dengan sumber zat besi</li>
          <li>Periksa Hb secara berkala</li>
        </ul>
      </>
    ),
  },
  {
    slug: "makanan",
    judul: "Makanan sumber zat besi",
    ringkas: "Yang mudah ditemukan di rumah",
    warna: "bg-sky",
    Ikon: IkonDaun,
    isi: (
      <>
        <h2>Sumber hewani (paling mudah diserap)</h2>
        <ul>
          <li>Hati ayam atau hati sapi</li>
          <li>Daging merah, daging ayam</li>
          <li>Ikan, kerang, telur</li>
        </ul>
        <h2>Sumber nabati</h2>
        <ul>
          <li>Bayam, daun kelor, daun singkong, kangkung</li>
          <li>Tempe, tahu, kacang-kacangan</li>
        </ul>
        <h2>Bantu penyerapannya</h2>
        <p>
          Padukan dengan buah kaya <strong>vitamin C</strong> seperti jeruk, jambu biji, pepaya, atau tomat. Hindari minum
          teh atau kopi tepat setelah makan.
        </p>
      </>
    ),
  },
];

export const cariTopik = (slug: string) => TOPIK.find((t) => t.slug === slug);
