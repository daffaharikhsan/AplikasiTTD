/** Normalisasi nomor WhatsApp Indonesia ke format 628xxxxxxxxx. Mengembalikan null jika tidak valid. */
export function normalisasiNomor(masukan: string): string | null {
  // Hanya angka dan pemisah umum yang boleh; huruf/simbol lain = salah ketik → tolak
  if (typeof masukan !== "string" || !/^[\d\s+\-().]*$/.test(masukan)) return null;
  let n = masukan.replace(/[^\d+]/g, "");
  if (n.lastIndexOf("+") > 0) return null; // "+" hanya boleh di depan
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  if (!/^628\d{7,11}$/.test(n)) return null;
  return n;
}

/** 6281234567890 → "0812-3456-7890" untuk ditampilkan */
export function tampilNomor(n: string): string {
  const lokal = "0" + n.slice(2);
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Email sintetis untuk Supabase Auth: siswi login dengan nomor WA + PIN. */
export function emailDariNomor(n: string): string {
  return `${n}@siswi.pengingat-ttd.app`;
}
