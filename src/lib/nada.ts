/**
 * Nada pengingat TTD (dari preview-nada-ttd.html): dua ketukan, satu nada turun,
 * lalu arpeggio naik. Dibuat dengan Web Audio, tanpa file suara.
 */
let ctx: AudioContext | null = null;

export async function putarNadaTTD(): Promise<boolean> {
  try {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") await ctx.resume();
    if (ctx.state !== "running") return false; // diblokir browser (belum ada interaksi)

    const t0 = ctx.currentTime;
    const nada = (freq: number, type: OscillatorType, start: number, dur: number, peak: number) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx!.destination);
      const t = t0 + start;
      o.start(t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur + 0.03);
    };
    nada(698.46, "sine", 0, 0.1, 0.2);
    nada(698.46, "sine", 0.14, 0.1, 0.2);
    nada(587.33, "sine", 0.3, 0.42, 0.22);
    [659.25, 783.99, 987.77].forEach((f, i) => nada(f, "triangle", 0.86 + i * 0.12, 0.2, 0.15));
    return true;
  } catch {
    return false;
  }
}
