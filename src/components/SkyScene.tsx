"use client";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  Component,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image as ThreeImage } from "@react-three/drei";
import { MathUtils, Matrix4, type Group } from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MemoryMedia } from "@/types/memory";
import { Polaroid } from "./Polaroid";

const placements: [number, number, number, number, number][] = [
  [-1.8, 1.62, -0.7, 0.13, 0.85],
  [1.34, 1.92, -1.6, -0.14, 0.83],
  [0.43, 0.06, 0.9, -0.12, 1.14],
  [-2.03, -1.49, -0.6, -0.2, 0.81],
  [2.22, -1.77, -0.5, 0.16, 0.84],
  [-0.54, -2.3, -2.7, -0.12, 0.43],
];
const galleryPlacements: typeof placements = [
  [-3.5, -0.4, -1.3, 0.16, 1],
  [-1.75, 0.85, -0.8, -0.14, 0.95],
  [0, -0.25, 0.7, 0.1, 1.3],
  [1.95, 1, -1, -0.12, 0.95],
  [3.6, -0.65, -0.9, 0.16, 1],
];
const compactHeroPlacements: typeof placements = [
  [-1.12, 1.7, -0.7, 0.13, 0.7],
  [1.05, 1.94, -1.6, -0.14, 0.7],
  [0.3, 0.12, 0.9, -0.12, 0.94],
  [-1.22, -1.48, -0.6, -0.2, 0.66],
  [1.35, -1.72, -0.5, 0.16, 0.67],
  [-0.18, -2.2, -2.7, -0.12, 0.4],
];
const mobileGalleryPlacements: typeof placements = [
  [-1.05, 1.7, -1, 0.12, 0.64],
  [1.02, 1.8, -1.1, -0.15, 0.67],
  [0, -0.1, 0.7, 0.1, 0.9],
  [-1.13, -1.95, -0.8, 0.13, 0.62],
  [1.12, -1.9, -0.8, -0.15, 0.64],
];
type PhotoControls = {
  buttons: RefObject<Map<string, HTMLButtonElement>>;
  hovered: RefObject<string | null>;
};
function FloatingPhoto({
  memory,
  placement,
  index,
  reduced,
  buttons,
  hovered,
}: {
  memory: MemoryMedia;
  placement: (typeof placements)[number];
  index: number;
  reduced: boolean;
} & PhotoControls) {
  const group = useRef<Group>(null);
  const projection = useRef(new Matrix4());
  const screen = useRef(new Matrix4());
  // Map a 165 × 200 CSS button to the 1.65 × 2 paper mesh.
  const paper = useRef(
    new Matrix4().set(
      0.01,
      0,
      0,
      -0.825,
      0,
      -0.01,
      0,
      1,
      0,
      0,
      1,
      0.04,
      0,
      0,
      0,
      1,
    ),
  );
  const [x, y, z, rotation, scale] = placement;
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    const t = reduced ? 0 : clock.elapsedTime;
    const hover = hovered.current === memory.id;
    const float = reduced ? 0 : Math.sin(t * 0.42 + index * 1.8) * 0.07;
    group.current.position.set(
      x + (reduced ? 0 : pointer.x * 0.05 * (z + 3)),
      y + float,
      MathUtils.damp(group.current.position.z, z + (hover ? 0.3 : 0), 5, delta),
    );
    group.current.rotation.set(
      reduced ? 0 : Math.sin(t * 0.24 + index) * 0.025,
      reduced ? 0 : pointer.x * 0.045,
      MathUtils.damp(
        group.current.rotation.z,
        hover ? rotation * 0.4 : rotation,
        5,
        delta,
      ),
    );
  }, -1);
  useFrame(({ camera, size }) => {
    const button = buttons.current.get(memory.id);
    if (!group.current || !button) return;
    group.current.updateWorldMatrix(true, false);
    screen.current.set(
      size.width / 2,
      0,
      0,
      size.width / 2,
      0,
      -size.height / 2,
      0,
      size.height / 2,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    );
    const matrix = projection.current
      .copy(screen.current)
      .multiply(camera.projectionMatrix)
      .multiply(camera.matrixWorldInverse)
      .multiply(group.current.matrixWorld)
      .multiply(paper.current);
    const depth = matrix.elements[15];
    button.style.visibility = depth > 0 ? "visible" : "hidden";
    if (depth <= 0) return;
    button.style.transform = `matrix3d(${matrix.elements.map((value) => value / depth).join(",")})`;
    button.style.zIndex = String(Math.round(1000 - depth * 10));
  });
  return (
    <group
      ref={group}
      position={[x, y, z]}
      rotation={[0, 0, rotation]}
      scale={scale}
    >
      <mesh position={[0.022, -0.025, -0.025]}>
        <boxGeometry args={[1.65, 2, 0.025]} />
        <meshStandardMaterial color="#d9bbaa" roughness={1} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.65, 2, 0.025]} />
        <meshStandardMaterial color="#fff6e7" roughness={0.97} />
      </mesh>
      <ThreeImage
        url={
          (memory.kind === "video" ? memory.thumbnailUrl : memory.mediaUrl) ||
          "/images/memory-3.jpg"
        }
        position={[0, 0.14, 0.021]}
        scale={[1.45, 1.5]}
        grayscale={0.3}
        color="#f1e4d6"
        toneMapped={false}
      />
    </group>
  );
}
function Scene({
  memories,
  onReady,
  reduced,
  variant,
  buttons,
  hovered,
}: {
  memories: MemoryMedia[];
  onReady: () => void;
  reduced: boolean;
  variant: "hero" | "memories";
} & PhotoControls) {
  const progress = useRef({ value: 0 });
  const width = useThree((state) => state.size.width);
  const positions =
    variant === "hero"
      ? width < 550 ? compactHeroPlacements : placements
      : width < 550
        ? mobileGalleryPlacements
        : galleryPlacements;
  useEffect(() => {
    onReady();
  }, [onReady]);
  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.to(progress.current, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: variant === "hero" ? "#home" : "#memories",
        start: variant === "hero" ? "top top" : "top center",
        end: "bottom top",
        scrub: 1,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced, variant]);
  useFrame(({ pointer, camera }, delta) => {
    if (reduced) return;
    const gallery = variant === "memories";
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointer.x * 0.12 +
        (gallery && width > 550
          ? Math.sin(progress.current.value * Math.PI) * 0.55
          : 0),
      2,
      delta,
    );
    camera.position.y = MathUtils.damp(
      camera.position.y,
      pointer.y * 0.08 + progress.current.value * (gallery ? 0.15 : 0.7),
      2,
      delta,
    );
    camera.position.z = MathUtils.damp(
      camera.position.z,
      8 - progress.current.value * (gallery ? 0.55 : 1.35),
      2,
      delta,
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }, -2);
  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[4, 6, 8]} intensity={1.4} color="#fff2db" />
      {memories.slice(0, positions.length).map((memory, i) => (
        <FloatingPhoto
          key={memory.id}
          memory={memory}
          placement={positions[i]}
          index={i}
          reduced={reduced}
          buttons={buttons}
          hovered={hovered}
        />
      ))}
      {!reduced &&
        Array.from({ length: 7 }, (_, i) => <Petal key={i} index={i} />)}
    </>
  );
}
function Petal({ index }: { index: number }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.08 + index * 1.5;
    ref.current.position.set(
      Math.sin(t) * 3.5,
      3.7 - ((t + index) % 7.4),
      -1 - (index % 3),
    );
    ref.current.rotation.set(t * 2, t, t);
  });
  return (
    <group ref={ref}>
      <mesh scale={[0.04, 0.1, 0.018]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={index % 2 ? "#deb2a6" : "#f8decc"}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function SkyScene({
  memories,
  onOpen,
  reduced,
  variant = "hero",
}: {
  memories: MemoryMedia[];
  onOpen: (m: MemoryMedia) => void;
  reduced: boolean;
  variant?: "hero" | "memories";
}) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const element = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const hovered = useRef<string | null>(null);
  const [visible, setVisible] = useState(variant === "hero");
  const [started, setStarted] = useState(variant === "hero");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries[0].isIntersecting;
        setVisible(active);
        if (active) setStarted(true);
      },
      { rootMargin: "100px" },
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      setSupported(
        !!(canvas.getContext("webgl2") || canvas.getContext("webgl")),
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <div
      ref={element}
      className={`sky-scene ${variant === "memories" ? "gallery-sky" : ""}`}
      aria-label="Floating memory photographs"
    >
      {!ready && (
        <div className="scene-fallback">
          {memories.slice(0, 6).map((m, i) => (
            <Polaroid
              key={m.id}
              memory={m}
              className={`hero-photo hp-${i}`}
              eager={i < 3}
              onOpen={() => onOpen(m)}
            />
          ))}
        </div>
      )}
      {supported && started && (
        <SceneBoundary>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 8], fov: 43 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            frameloop={reduced || !visible ? "demand" : "always"}
          >
            <Suspense fallback={null}>
              <Scene
                memories={memories}
                onReady={onReady}
                reduced={reduced}
                variant={variant}
                buttons={buttons}
                hovered={hovered}
              />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      )}
      {ready && (
        <div className="three-photo-controls">
          {memories.slice(0, variant === "hero" ? 6 : 5).map((memory) => (
            <button
              key={memory.id}
              ref={(button) => {
                if (button) buttons.current.set(memory.id, button);
                else buttons.current.delete(memory.id);
              }}
              className="three-photo-hit"
              style={{ visibility: "hidden" }}
              aria-label={`Open ${memory.title}${memory.caption ? ` — ${memory.caption}` : ""}`}
              onClick={() => onOpen(memory)}
              onPointerEnter={() => {
                hovered.current = memory.id;
              }}
              onPointerLeave={() => {
                hovered.current = null;
              }}
              onFocus={() => {
                hovered.current = memory.id;
              }}
              onBlur={() => {
                hovered.current = null;
              }}
            >
              <span>{memory.caption || memory.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
