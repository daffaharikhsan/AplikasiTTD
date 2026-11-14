/** Zona waktu per siswi (IANA, mis. "Asia/Makassar"). */

/** true jika nama zona dikenali runtime (mencegah nilai sembarang dari browser). */
export function zonaValid(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length < 3 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Zona siswi, atau zona sekolah (pengaturan) bila belum diketahui. */
export const zonaSiswi = (s: { zona_waktu?: string | null }, zonaSekolah: string) =>
  zonaValid(s.zona_waktu) ? s.zona_waktu : zonaSekolah;

const LABEL: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

/** "Asia/Makassar" → "WITA"; zona lain → "GMT+9" (singkatan dari runtime). */
export function labelZona(tz: string): string {
  if (LABEL[tz]) return LABEL[tz];
  try {
    const p = new Intl.DateTimeFormat("id-ID", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date());
    return p.find((x) => x.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}
