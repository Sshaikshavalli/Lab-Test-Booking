import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import GlassTube from '../../../components/common/GlassTube';
import { supportsWebGL, prefersReducedMotion } from '../../../utils/webgl';
import { SAMPLE_COLORS, CAP_COLORS } from '../categoryMeta';

/**
 * Tube that spins on its own and can be dragged to rotate (pointer events on the wrapper, so it
 * works with mouse, touch and pen). The liquid gently "breathes" to hint at shimmer.
 */
function Spinning({ color, cap, drag }) {
  const ref = useRef();
  const liquid = useRef();
  const still = prefersReducedMotion();
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    if (drag.current.down) {
      ref.current.rotation.y += drag.current.dx * 0.012;
      ref.current.rotation.x = Math.max(-0.6, Math.min(0.6, ref.current.rotation.x + drag.current.dy * 0.006));
      drag.current.dx = 0; drag.current.dy = 0;
    } else if (!still) {
      ref.current.rotation.y += delta * 0.7;
      ref.current.rotation.x += (0 - ref.current.rotation.x) * 0.05;
      ref.current.position.y = Math.sin(t * 1.3) * 0.08;
    }
    if (liquid.current && !still) liquid.current.scale.set(1, 1 + Math.sin(t * 2.4) * 0.012, 1);
  });
  return (
    <group ref={ref} rotation={[0, 0.6, 0.25]}>
      <group ref={liquid}><GlassTube liquid={color} capColor={cap} scale={1.25} /></group>
    </group>
  );
}

function Fallback({ color, cap }) {
  return (
    <svg viewBox="0 0 64 96" role="img" aria-label="Sample tube illustration" className="h-full w-full max-h-56 animate-float">
      <rect x="20" y="6" width="24" height="10" rx="3" fill={cap} />
      <path d="M22 16h20v56a10 10 0 0 1-20 0z" fill="#eef6ff" stroke="#b9d6ff" strokeWidth="2" />
      <path d="M24 44h16v28a8 8 0 0 1-16 0z" fill={color} />
    </svg>
  );
}

/** Decorative 3D test tube whose liquid and cap colours reflect the sample type. Falls back to an SVG. */
export default function SampleTube3D({ sampleType, interactive = true }) {
  const color = SAMPLE_COLORS[sampleType] ?? '#c81e3a';
  const cap = CAP_COLORS[sampleType] ?? '#6d5cf6';
  const drag = useRef({ down: false, x: 0, y: 0, dx: 0, dy: 0 });
  if (!supportsWebGL()) return <Fallback color={color} cap={cap} />;

  const handlers = interactive ? {
    onPointerDown: (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); Object.assign(drag.current, { down: true, x: e.clientX, y: e.clientY }); },
    onPointerMove: (e) => { if (!drag.current.down) return; drag.current.dx += e.clientX - drag.current.x; drag.current.dy += e.clientY - drag.current.y; drag.current.x = e.clientX; drag.current.y = e.clientY; },
    onPointerUp: () => { drag.current.down = false; },
    onPointerCancel: () => { drag.current.down = false; },
  } : {};

  return (
    <div className={`h-full w-full ${interactive ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`} aria-hidden="true" {...handlers}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.2], fov: 38 }} gl={{ alpha: true, antialias: true }} frameloop={prefersReducedMotion() ? 'demand' : 'always'}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <pointLight position={[-3, -1, 2]} intensity={1.2} color="#b9d6ff" />
        <Suspense fallback={null}><Spinning color={color} cap={cap} drag={drag} /></Suspense>
      </Canvas>
    </div>
  );
}
