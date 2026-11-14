/** Ikon garis 1,8 px dari UI kit. Dekoratif (aria-hidden) kecuali diberi label di pemanggil. */
type P = { size?: number; className?: string };

const garis = (size: number, className: string | undefined, children: React.ReactNode, sw = 1.8) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const IkonTetes = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2.5c3.6 4.6 6 7.9 6 11.2a6 6 0 0 1-12 0c0-3.3 2.4-6.6 6-11.2z" />
  </svg>
);
export const IkonTetesGaris = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M12 2.5c3.6 4.6 6 7.9 6 11.2a6 6 0 0 1-12 0c0-3.3 2.4-6.6 6-11.2z" />);
export const IkonCentang = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M5 12.5l4.5 4.5L19 7.5" />, 2.4);
export const IkonKembali = ({ size = 20, className }: P) => garis(size, className, <path d="M15 5l-7 7 7 7" />);
export const IkonLanjut = ({ size = 18, className }: P) => garis(size, className, <path d="M9 5l7 7-7 7" />, 2);
export const IkonKalender = ({ size = 20, className }: P) =>
  garis(size, className, <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></>);
export const IkonBuku = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" />);
export const IkonLonceng = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />);
export const IkonProfil = ({ size = 20, className }: P) =>
  garis(size, className, <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
export const IkonRumah = ({ size = 20, className }: P) => garis(size, className, <path d="M4 11l8-7 8 7v9H4z" />);
export const IkonGuru = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M3 9l9-5 9 5-9 5zM7 11.5V16c3 2 7 2 10 0v-4.5" />);
export const IkonPuskesmas = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M12 21s-7-4.5-7-10.5V5l7-2 7 2v5.5C19 16.5 12 21 12 21zM12 8v6M9 11h6" />);
export const IkonPerisai = ({ size = 20, className }: P) =>
  garis(size, className, <path d="M12 21s-7-4.5-7-10.5V5l7-2 7 2v5.5C19 16.5 12 21 12 21z" />);
export const IkonInfo = ({ size = 20, className }: P) =>
  garis(size, className, <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const IkonPil = ({ size = 22, className }: P) =>
  garis(size, className, <><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)" /><path d="M9.5 9.5l5 5" /></>);
export const IkonDaun = ({ size = 22, className }: P) =>
  garis(size, className, <path d="M12 20c-5 0-8-3.5-8-8 3 0 5 1 6 3 0-4 1-7 2-9 1 2 2 5 2 9 1-2 3-3 6-3 0 4.5-3 8-8 8z" />);
export const IkonGelas = ({ size = 22, className }: P) =>
  garis(size, className, <path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zM6.5 8h11" />);
export const IkonBagikan = ({ size = 18, className }: P) =>
  garis(size, className, <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />);
export const IkonKeluar = ({ size = 18, className }: P) =>
  garis(size, className, <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />);
export const IkonPensil = ({ size = 18, className }: P) =>
  garis(size, className, <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />);
