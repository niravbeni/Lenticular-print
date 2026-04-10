import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { LoadedImage } from '../lib/imageUtils';
import { vertexShader, fragmentShader } from '../lib/lenticularShader';

interface Props {
  images: LoadedImage[];
  lpi: number;
}

function imageToTexture(image: LoadedImage): THREE.Texture {
  const tex = new THREE.Texture(image.element);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const PLACEHOLDER_TEX = new THREE.DataTexture(
  new Uint8Array([0, 0, 0, 255]),
  1,
  1,
  THREE.RGBAFormat
);
PLACEHOLDER_TEX.needsUpdate = true;

const MAX_TILT = Math.PI / 6; // 30 degrees

function LenticularCard({
  images,
  lpi,
  tiltAngle,
}: {
  images: LoadedImage[];
  lpi: number;
  tiltAngle: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const currentAngle = useRef(0);

  const textures = useMemo(() => {
    return images.map(imageToTexture);
  }, [images]);

  useEffect(() => {
    return () => {
      textures.forEach((t) => t.dispose());
    };
  }, [textures]);

  const aspect = images.length > 0 ? images[0].width / images[0].height : 4 / 3;
  const cardHeight = 2.4;
  const cardWidth = cardHeight * aspect;

  // Lens count: how many lenses fit across the physical width of the card
  // We use an arbitrary physical scale (cardWidth maps to ~6 inches)
  const physicalWidthInches = 6;
  const lensCount = physicalWidthInches * lpi;

  const uniforms = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      uTex0: { value: PLACEHOLDER_TEX },
      uTex1: { value: PLACEHOLDER_TEX },
      uTex2: { value: PLACEHOLDER_TEX },
      uTex3: { value: PLACEHOLDER_TEX },
      uTex4: { value: PLACEHOLDER_TEX },
      uTex5: { value: PLACEHOLDER_TEX },
      uNumFrames: { value: 2 },
      uAngle: { value: 0 },
      uLensCount: { value: lensCount },
      uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
    };
    return u;
  }, []);

  // Update uniforms when inputs change
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current;
    for (let i = 0; i < 6; i++) {
      m.uniforms[`uTex${i}`].value = textures[i] ?? PLACEHOLDER_TEX;
    }
    m.uniforms.uNumFrames.value = images.length;
    m.uniforms.uLensCount.value = lensCount;
  }, [textures, images.length, lensCount]);

  useFrame(() => {
    // Smoothly interpolate toward target tilt
    currentAngle.current += (tiltAngle - currentAngle.current) * 0.12;

    if (meshRef.current) {
      meshRef.current.rotation.y = currentAngle.current;
    }
    if (materialRef.current) {
      const normalizedAngle = currentAngle.current / MAX_TILT;
      materialRef.current.uniforms.uAngle.value = normalizedAngle;
      materialRef.current.uniforms.uCameraPos.value.copy(
        (camera as THREE.PerspectiveCamera).position
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[cardWidth, cardHeight]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default function LenticularSimulator({ images, lpi }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiltAngle, setTiltAngle] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startAngle = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startAngle.current = tiltAngle;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [tiltAngle]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const dx = e.clientX - startX.current;
    const width = containerRef.current.clientWidth;
    const angleDelta = (dx / width) * MAX_TILT * 2;
    setTiltAngle(
      Math.max(-MAX_TILT, Math.min(MAX_TILT, startAngle.current + angleDelta))
    );
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (images.length < 2) return null;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
          3D Simulation
        </span>
        <span className="text-xs text-text-tertiary">
          Drag left/right to tilt
        </span>
      </div>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-[280px] sm:h-[400px] lg:h-auto lg:flex-1 min-h-0
          rounded-xl border border-border bg-surface-overlay overflow-hidden
          cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 40 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#1a1d27');
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} intensity={0.8} />
          <LenticularCard images={images} lpi={lpi} tiltAngle={tiltAngle} />
        </Canvas>
      </div>
    </div>
  );
}
