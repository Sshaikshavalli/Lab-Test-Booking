/** Colour schemes for the dark hero panels. Dashboard and catalogue each get their own. */
const THEMES = {
  ocean: {
    base: 'bg-[radial-gradient(120%_100%_at_12%_0%,#0e9aa7_0%,#08586b_44%,#04202d_100%)]',
    a: 'bg-[radial-gradient(circle,rgba(20,184,166,.55),transparent_65%)]',
    b: 'bg-[radial-gradient(circle,rgba(56,189,248,.34),transparent_65%)]',
    c: 'bg-[radial-gradient(circle,rgba(52,211,153,.34),transparent_65%)]',
    line: 'rgba(110,231,220,.30)',
  },
  azure: {
    base: 'bg-[radial-gradient(120%_100%_at_12%_0%,#2b7fff_0%,#0b3d91_44%,#06122e_100%)]',
    a: 'bg-[radial-gradient(circle,rgba(43,127,255,.55),transparent_65%)]',
    b: 'bg-[radial-gradient(circle,rgba(34,211,238,.34),transparent_65%)]',
    c: 'bg-[radial-gradient(circle,rgba(99,179,237,.30),transparent_65%)]',
    line: 'rgba(147,197,253,.30)',
  },
  twilight: {
    base: 'bg-[radial-gradient(120%_100%_at_12%_0%,#9a33d9_0%,#451a8c_44%,#170a3a_100%)]',
    a: 'bg-[radial-gradient(circle,rgba(168,85,247,.55),transparent_65%)]',
    b: 'bg-[radial-gradient(circle,rgba(236,72,153,.36),transparent_65%)]',
    c: 'bg-[radial-gradient(circle,rgba(34,211,238,.28),transparent_65%)]',
    line: 'rgba(240,171,252,.30)',
  },
};

/**
 * Dark "lab at night" backdrop for hero panels: gradient, drifting aurora glows, a faint grid and a
 * perspective floor that flows towards the viewer. Pure CSS, so it paints instantly and costs no WebGL.
 */
export default function HeroBackdrop({ theme = 'ocean', className = '' }) {
  const t = THEMES[theme];
  const floor = `linear-gradient(${t.line} 1px, transparent 1px), linear-gradient(90deg, ${t.line} 1px, transparent 1px)`;
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className={`absolute inset-0 ${t.base}`} />
      <div className={`absolute -left-[8%] -top-[35%] h-[85%] w-[55%] animate-aurora-a rounded-full ${t.a} blur-3xl`} />
      <div className={`absolute -right-[10%] top-[5%] h-[80%] w-[48%] animate-aurora-b rounded-full ${t.b} blur-3xl`} />
      <div className={`absolute -bottom-[40%] left-[28%] h-[85%] w-[45%] animate-aurora-c rounded-full ${t.c} blur-3xl`} />
      <div className="hero-grid absolute inset-0 opacity-70" />
      <div className="absolute inset-x-[-25%] bottom-0 h-[55%]"><div className="floor-grid absolute inset-0" style={{ backgroundImage: floor }} /></div>
    </div>
  );
}
