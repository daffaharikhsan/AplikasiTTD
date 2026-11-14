import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lembar persetujuan" };

/**
 * Ringkasan lembar persetujuan. Isi resmi mengikuti dokumen yang disetujui komisi etik —
 * ganti teks di bawah dengan versi final dari peneliti.
 */
export default function Persetujuan() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-6 pt-12 pb-10">
      <h1 className="judul-halaman">Lembar persetujuan</h1>
      <div className="kartu prosa">
        <p className="rounded-xl bg-petal p-3 text-sm!">
          [Ganti dengan teks lembar persetujuan resmi yang disetujui komisi etik.]
        </p>
        <h2>Tujuan penelitian</h2>
        <p>
          Penelitian ini ingin mengetahui apakah website pengingat berbasis kalender, dengan dukungan orang tua dan guru,
          dapat membantu siswi minum Tablet Tambah Darah (TTD) secara teratur.
        </p>
        <h2>Yang kamu lakukan</h2>
        <ul>
          <li>Mengisi data diri, nomor orang tua/wali dan guru, serta skrining anemia singkat.</li>
          <li>Mencentang &ldquo;Sudah minum TTD&rdquo; setiap jadwal selama masa penelitian.</li>
          <li>Mengisi kuesioner sebelum dan sesudah penelitian.</li>
        </ul>
        <h2>Data dan kerahasiaan</h2>
        <ul>
          <li>Data pribadi dan kesehatan disimpan aman dan hanya dapat dilihat oleh peneliti.</li>
          <li>Nomor orang tua dan guru hanya dipakai untuk penelitian dan pengingat.</li>
          <li>Hasil penelitian dilaporkan tanpa menyebut nama.</li>
        </ul>
        <h2>Sukarela</h2>
        <p>
          Keikutsertaan bersifat sukarela. Kamu boleh berhenti kapan saja tanpa konsekuensi apa pun. Aplikasi ini tidak
          mendiagnosis penyakit; untuk pemeriksaan dan pengobatan, tetap ikuti arahan tenaga kesehatan.
        </p>
        <p>
          Persetujuan tertulis ditandatangani oleh siswi dan orang tua/wali pada lembar kertas yang dibagikan peneliti.
        </p>
      </div>
    </main>
  );
}
