/** Pure-CSS animated backdrop: deep navy gradient, drifting aurora blobs, a faint grid and a vignette. Sits under the 3D scene. */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden bg-[#06122b]">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,#0d3a8a_0%,#0a2050_45%,#06122b_100%)]" />
      <div className="absolute -left-[12%] top-[-18%] h-[62vmax] w-[62vmax] animate-aurora-a rounded-full bg-[radial-gradient(circle,rgba(43,127,255,.55),transparent_62%)] blur-3xl" />
      <div className="absolute -right-[10%] top-[18%] h-[55vmax] w-[55vmax] animate-aurora-b rounded-full bg-[radial-gradient(circle,rgba(6,182,212,.36),transparent_62%)] blur-3xl" />
      <div className="absolute bottom-[-25%] left-[22%] h-[50vmax] w-[50vmax] animate-aurora-c rounded-full bg-[radial-gradient(circle,rgba(124,92,255,.34),transparent_62%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[.5] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,#000_10%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,8,22,.65)_100%)]" />
    </div>
  );
}
