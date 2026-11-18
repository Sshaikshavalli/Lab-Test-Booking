import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlassTube from '../../../components/common/GlassTube';
import { supportsWebGL, prefersReducedMotion } from '../../../utils/webgl';

/**
 * Full-screen 3D backdrop for the sign-in / create-account pages.
 *  - an undulating double helix whose base-pair nodes glow as a light pulse travels along it
 *  - a drifting molecular network (nodes joined by fading links) and soft rising particles
 *  - floating glass sample tubes
 *  - pointer parallax, and a colour/speed shift that eases between "login" and "signup"
 * Everything uses instancing or a single buffer per layer, so it stays light. No text is ever drawn in 3D.
 */
const PALETTE = {
  login: { a: new THREE.Color('#2b7fff'), b: new THREE.Color('#22d3ee') },
  signup: { a: new THREE.Color('#7c5cff'), b: new THREE.Color('#22d3ee') },
};
const WHITE = new THREE.Color('#ffffff');
const rand = (a, b) => a + Math.random() * (b - a);

let sprite;
/** Soft round glow texture shared by every point layer. */
function getSprite() {
  if (sprite) return sprite;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  sprite = new THREE.CanvasTexture(c);
  return sprite;
}

function makeStrand(count) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  line.frustumCulled = false;
  return line;
}

function DNA({ ctl, count }) {
  const nodes = useRef(); const halos = useRef(); const rungs = useRef();
  const strandA = useMemo(() => makeStrand(count), [count]);
  const strandB = useMemo(() => makeStrand(count), [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color(), t: new THREE.Color(), m: new THREE.Color() }), []);

  useFrame(({ clock }) => {
    if (!nodes.current) return;
    const { mix, still } = ctl.current;
    const t = still ? 0 : clock.getElapsedTime();
    c.a.copy(PALETTE.login.a).lerp(PALETTE.signup.a, mix);
    c.b.copy(PALETTE.login.b).lerp(PALETTE.signup.b, mix);
    const pa = strandA.geometry.attributes.position.array;
    const pb = strandB.geometry.attributes.position.array;

    for (let i = 0; i < count; i += 1) {
      const y = (i - count / 2) * 0.3;
      const th = i * 0.42 + t * (0.5 + mix * 0.25);
      const r = 1.05 + Math.sin(t * 0.8 + i * 0.35) * 0.14;        // the helix "breathes"
      const x = Math.cos(th) * r; const z = Math.sin(th) * r;
      const w = Math.max(0, Math.sin((i / count) * 9.4 - t * 1.6)) ** 3; // 0..1 travelling pulse

      pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z;
      pb[i * 3] = -x; pb[i * 3 + 1] = y; pb[i * 3 + 2] = -z;

      o.rotation.set(0, 0, 0);
      // strand A
      o.position.set(x, y, z); o.scale.setScalar(0.1 + w * 0.08); o.updateMatrix();
      nodes.current.setMatrixAt(i * 2, o.matrix);
      nodes.current.setColorAt(i * 2, c.t.copy(c.a).lerp(WHITE, w * 0.7));
      o.scale.setScalar(0.3 + w * 0.32); o.updateMatrix();
      halos.current.setMatrixAt(i * 2, o.matrix);
      halos.current.setColorAt(i * 2, c.t.copy(c.a).multiplyScalar(0.2 + w * 0.55));
      // strand B
      o.position.set(-x, y, -z); o.scale.setScalar(0.1 + w * 0.08); o.updateMatrix();
      nodes.current.setMatrixAt(i * 2 + 1, o.matrix);
      nodes.current.setColorAt(i * 2 + 1, c.t.copy(c.b).lerp(WHITE, w * 0.7));
      o.scale.setScalar(0.3 + w * 0.32); o.updateMatrix();
      halos.current.setMatrixAt(i * 2 + 1, o.matrix);
      halos.current.setColorAt(i * 2 + 1, c.t.copy(c.b).multiplyScalar(0.2 + w * 0.55));
      // base-pair rung joining the two nodes
      o.position.set(0, y, 0); o.rotation.set(0, -th, 0); o.scale.set(2 * r, 1, 1); o.updateMatrix();
      rungs.current.setMatrixAt(i, o.matrix);
      rungs.current.setColorAt(i, c.m.copy(c.a).lerp(c.b, 0.5).multiplyScalar(0.3 + w * 0.7));
    }
    for (const m of [nodes.current, halos.current, rungs.current]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    strandA.geometry.attributes.position.needsUpdate = true;
    strandB.geometry.attributes.position.needsUpdate = true;
    strandA.material.color.copy(c.a); strandB.material.color.copy(c.b);
  });

  return (
    <group>
      <instancedMesh ref={nodes} args={[undefined, undefined, count * 2]} frustumCulled={false}>
        <sphereGeometry args={[1, 18, 18]} /><meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[undefined, undefined, count * 2]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} /><meshBasicMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rungs} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 0.018, 0.018]} /><meshBasicMaterial transparent opacity={0.9} toneMapped={false} />
      </instancedMesh>
      <primitive object={strandA} /><primitive object={strandB} />
    </group>
  );
}

/** Drifting nodes; any two closer than LINK get a line whose brightness fades with distance. */
function Network({ ctl, count }) {
  const LINK = 2.6;
  const { pts, lines, data } = useMemo(() => {
    const maxPairs = (count * (count - 1)) / 2;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPairs * 6), 3));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPairs * 6), 3));
    const points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.2, map: getSprite(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#cfe4ff' }));
    const segs = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    points.frustumCulled = false; segs.frustumCulled = false;
    const nodes = Array.from({ length: count }, () => ({
      p: new THREE.Vector3(rand(-7, 7), rand(-4, 4), rand(-3.5, 1)),
      v: new THREE.Vector3(rand(-0.22, 0.22), rand(-0.22, 0.22), rand(-0.05, 0.05)),
    }));
    return { pts: points, lines: segs, data: nodes };
  }, [count]);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const { mix, still } = ctl.current;
    const d = still ? 0 : Math.min(dt, 0.05);
    col.copy(PALETTE.login.a).lerp(PALETTE.signup.a, mix).lerp(WHITE, 0.15);
    const pp = pts.geometry.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const n = data[i];
      n.p.addScaledVector(n.v, d);
      if (Math.abs(n.p.x) > 7.5) n.v.x *= -1;
      if (Math.abs(n.p.y) > 4.4) n.v.y *= -1;
      if (n.p.z > 1.5 || n.p.z < -4) n.v.z *= -1;
      pp[i * 3] = n.p.x; pp[i * 3 + 1] = n.p.y; pp[i * 3 + 2] = n.p.z;
    }
    const lp = lines.geometry.attributes.position.array;
    const lc = lines.geometry.attributes.color.array;
    let k = 0;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const dist = data[i].p.distanceTo(data[j].p);
        if (dist >= LINK) continue;
        const f = (1 - dist / LINK) * 0.85;
        const a = k * 6;
        lp[a] = data[i].p.x; lp[a + 1] = data[i].p.y; lp[a + 2] = data[i].p.z;
        lp[a + 3] = data[j].p.x; lp[a + 4] = data[j].p.y; lp[a + 5] = data[j].p.z;
        lc[a] = lc[a + 3] = col.r * f; lc[a + 1] = lc[a + 4] = col.g * f; lc[a + 2] = lc[a + 5] = col.b * f;
        k += 1;
      }
    }
    lines.geometry.setDrawRange(0, k * 2);
    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.color.needsUpdate = true;
    pts.geometry.attributes.position.needsUpdate = true;
    pts.material.color.copy(col);
  });

  return <><primitive object={lines} /><primitive object={pts} /></>;
}

/** Tiny soft particles rising like bubbles in a sample. */
function Dust({ ctl, count }) {
  const { obj, speed } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i += 1) { arr[i * 3] = rand(-9, 9); arr[i * 3 + 1] = rand(-6, 6); arr[i * 3 + 2] = rand(-4, 2.5); spd[i] = rand(0.1, 0.45); }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: getSprite(), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, color: '#e3f1ff' }));
    points.frustumCulled = false;
    return { obj: points, speed: spd };
  }, [count]);

  useFrame(({ clock }, dt) => {
    if (ctl.current.still) return;
    const a = obj.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < count; i += 1) {
      a[i * 3 + 1] += speed[i] * d;
      a[i * 3] += Math.sin(t * 0.5 + i) * d * 0.06;
      if (a[i * 3 + 1] > 6) a[i * 3 + 1] = -6;
    }
    obj.geometry.attributes.position.needsUpdate = true;
  });
  return <primitive object={obj} />;
}

const VIALS = [
  { x: 3.7, y: -1.4, z: 2.4, liquid: '#e11d48', cap: '#7c3aed', scale: 1.1, phase: 0 },
  { x: -4.0, y: 1.8, z: 1.8, liquid: '#2b7fff', cap: '#22d3ee', scale: 0.95, phase: 2 },
  { x: 5.2, y: 2.5, z: 0.2, liquid: '#f2c94c', cap: '#facc15', scale: 0.8, phase: 4 },
];

function Vials({ ctl }) {
  const refs = useRef([]);
  const { viewport } = useThree();
  const sx = Math.min(1, viewport.width / 12);
  useFrame(({ clock }) => {
    const t = ctl.current.still ? 0 : clock.getElapsedTime();
    VIALS.forEach((v, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.set(v.x * sx, v.y + Math.sin(t * 0.9 + v.phase) * 0.2, v.z);
      g.rotation.set(0.35, t * 0.45 + v.phase, 0.5 + Math.sin(t * 0.6 + v.phase) * 0.12);
    });
  });
  return VIALS.map((v, i) => (
    <group key={i} ref={(el) => { refs.current[i] = el; }}>
      <GlassTube liquid={v.liquid} capColor={v.cap} scale={v.scale} />
    </group>
  ));
}

function Scene({ mode, pointer, low, still }) {
  const ctl = useRef({ mix: mode === 'signup' ? 1 : 0, still });
  const root = useRef();
  const { viewport, camera } = useThree();
  const wide = viewport.width / viewport.height > 1.15;

  useFrame(() => {
    const c = ctl.current;
    c.still = still;
    c.mix += ((mode === 'signup' ? 1 : 0) - c.mix) * 0.05; // ease between the two colour moods
    if (!still && root.current) {
      root.current.rotation.y += (pointer.current.x * 0.22 - root.current.rotation.y) * 0.04;
      root.current.rotation.x += (pointer.current.y * 0.1 - root.current.rotation.x) * 0.04;
      camera.position.z += ((9 - c.mix * 0.7) - camera.position.z) * 0.04;
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 6]} intensity={1.7} />
      <pointLight position={[-5, -2, 3]} intensity={1.3} color="#7c5cff" />
      <group ref={root}>
        <Network ctl={ctl} count={low ? 22 : 34} />
        <Dust ctl={ctl} count={low ? 90 : 220} />
        <group position={[wide ? -viewport.width * 0.03 : 0, 0, 0]} rotation={[0, 0, wide ? 0.3 : 0.12]} scale={wide ? 1 : 0.72}>
          <DNA ctl={ctl} count={low ? 28 : 38} />
        </group>
        <Vials ctl={ctl} />
      </group>
    </>
  );
}

/** Static look-alike used when WebGL is unavailable. */
function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center opacity-70" aria-hidden>
      <svg viewBox="0 0 160 360" className="h-[80%] max-h-[520px] animate-float" fill="none" strokeLinecap="round">
        <path d="M30 0c110 45-110 90 0 135s-110 90 0 135 -110 90 0 90" transform="translate(50 0)" stroke="#2b7fff" strokeWidth="3" />
        <path d="M130 0c-110 45 110 90 0 135s110 90 0 135 110 90 0 90" transform="translate(-20 0)" stroke="#22d3ee" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1="40" x2="120" y1={20 + i * 28} y2={20 + i * 28} stroke="#b9d6ff" strokeOpacity=".4" />)}
      </svg>
    </div>
  );
}

/** `pointer` is a ref holding { x, y } in -1…1 (screen space, y down). */
export default function AuthScene({ mode = 'login', pointer }) {
  const [cfg] = useState(() => ({
    low: window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4,
    still: prefersReducedMotion(),
  }));
  if (!supportsWebGL()) return <Fallback />;
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas dpr={[1, cfg.low ? 1 : 1.75]} camera={{ position: [0, 0, 9], fov: 45 }} gl={{ alpha: true, antialias: !cfg.low }} frameloop={cfg.still ? 'demand' : 'always'}>
        <Scene mode={mode} pointer={pointer} low={cfg.low} still={cfg.still} />
      </Canvas>
    </div>
  );
}
