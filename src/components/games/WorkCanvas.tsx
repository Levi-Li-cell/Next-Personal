"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Gauge, MousePointer2, RotateCcw } from "lucide-react";
import type { RenderMode, SceneConfig, SceneType } from "@/lib/games-types";

const MODE_OPTIONS: Array<{ value: RenderMode; label: string }> = [
  { value: "albedo", label: "Albedo" },
  { value: "normal", label: "Normal" },
  { value: "wireframe", label: "Wireframe" },
  { value: "depth", label: "Depth" },
];

interface WorkCanvasProps {
  sceneType: SceneType;
  sceneConfig: SceneConfig;
  controlsHint: string[];
  title: string;
  className?: string;
}

/** 场景构建结果：group 挂载内容，animate 每帧驱动，可选 overrides 排除辅助线参与材质切换 */
interface SceneBundle {
  group: THREE.Group;
  animate: (elapsed: number, delta: number) => void;
  camera: { radius: number; phi: number; theta: number; minRadius: number; maxRadius: number };
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** 各场景生成器：材质均以 MeshStandardMaterial 为基础色（Albedo 模式） */
function buildSceneBundle(sceneType: SceneType, config: SceneConfig): SceneBundle {
  const group = new THREE.Group();
  const primary = new THREE.Color(config.primary || "#8fb4e8");
  const secondary = new THREE.Color(config.secondary || "#e8c58f");
  const accent = new THREE.Color(config.accent || "#f4e5cf");
  const metalness = Number(config.metalness ?? 0.4);
  const roughness = Number(config.roughness ?? 0.3);

  const standard = (color: THREE.Color, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

  // 点光源默认参数，各场景可覆盖动画
  const roamingLight = new THREE.PointLight(accent.getHex(), 24, 26, 1.8);
  group.add(roamingLight);

  let animate: SceneBundle["animate"] = () => {};

  if (sceneType === "crystal-cluster") {
    const count = Number(config.clusterCount ?? 40);
    const spread = Number(config.clusterRadius ?? 5);
    for (let i = 0; i < count; i += 1) {
      const size = rand(0.22, 0.62);
      const geometry = i % 2 === 0 ? new THREE.OctahedronGeometry(size) : new THREE.IcosahedronGeometry(size);
      const material = standard(i % 3 === 0 ? secondary : primary, {
        metalness: metalness + rand(-0.1, 0.1),
        roughness: roughness + rand(-0.08, 0.12),
      });
      const mesh = new THREE.Mesh(geometry, material);
      const r = spread * Math.cbrt(Math.random());
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.75,
        r * Math.sin(phi) * Math.sin(theta),
      );
      mesh.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      mesh.userData.spin = { x: rand(0.05, 0.35), y: rand(0.08, 0.5) };
      group.add(mesh);
    }
    animate = (elapsed, delta) => {
      for (const child of group.children) {
        const spin = child.userData.spin as { x: number; y: number } | undefined;
        if (spin) {
          child.rotation.x += spin.x * delta;
          child.rotation.y += spin.y * delta;
        }
      }
      group.rotation.y += delta * 0.06;
      roamingLight.position.set(Math.cos(elapsed * 0.5) * 3.5, 1.5, Math.sin(elapsed * 0.5) * 3.5);
    };
    return { group, animate, camera: { radius: 11, phi: 1.15, theta: 0.6, minRadius: 5, maxRadius: 20 } };
  }

  if (sceneType === "wave-field") {
    const segments = Number(config.segments ?? 80);
    const amplitude = Number(config.amplitude ?? 0.55);
    const frequency = Number(config.frequency ?? 0.9);
    const speed = Number(config.speed ?? 0.9);
    const geometry = new THREE.PlaneGeometry(14, 14, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const basePositions = Float32Array.from(geometry.attributes.position.array as ArrayLike<number>);
    const mesh = new THREE.Mesh(geometry, standard(primary, { metalness, roughness, side: THREE.DoubleSide }));
    group.add(mesh);
    animate = (elapsed) => {
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = basePositions[i];
        const z = basePositions[i + 2];
        positions[i + 1] =
          amplitude * 0.5 * (Math.sin(x * frequency + elapsed * speed) + Math.cos(z * frequency * 0.8 + elapsed * speed * 0.7)) +
          amplitude * 0.3 * Math.sin((x + z) * frequency * 0.5 + elapsed * speed * 0.5);
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    };
    return { group, animate, camera: { radius: 12, phi: 1.0, theta: 0.35, minRadius: 6, maxRadius: 22 } };
  }

  if (sceneType === "torus-knot") {
    const geometry = new THREE.TorusKnotGeometry(1.5, 0.42, 220, 32);
    const mesh = new THREE.Mesh(geometry, standard(primary));
    group.add(mesh);
    const orbitSpeed = Number(config.lightOrbitSpeed ?? 0.35);
    animate = (elapsed, delta) => {
      mesh.rotation.x += delta * 0.12;
      mesh.rotation.y += delta * 0.18;
      roamingLight.position.set(Math.cos(elapsed * orbitSpeed) * 5, 2.2, Math.sin(elapsed * orbitSpeed) * 5);
    };
    return { group, animate, camera: { radius: 7.5, phi: 1.2, theta: 0.5, minRadius: 3.5, maxRadius: 14 } };
  }

  // orbiting-spheres：核心球 + 三层倾斜轨道，轨道线不参与材质切换
  const coreRadius = Number(config.coreRadius ?? 1.05);
  const core = new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 48, 48), standard(primary, { metalness: 0.7, roughness: 0.25 }));
  core.userData.spin = { x: 0.05, y: 0.25 };
  group.add(core);
  const pivots: THREE.Object3D[] = [];
  const orbitSpeeds = [0.55, 0.34, 0.23];
  for (let ring = 0; ring < 3; ring += 1) {
    const ringRadius = 2.3 + ring * 1.15;
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = 0.32 + ring * 0.35;
    ringGroup.rotation.z = ring * 0.22;
    const track = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: secondary, transparent: true, opacity: 0.32 }),
    );
    track.rotation.x = Math.PI / 2;
    track.userData.modeExcluded = true;
    ringGroup.add(track);
    const pivot = new THREE.Object3D();
    const satellites = 4 + ring;
    for (let s = 0; s < satellites; s += 1) {
      const size = rand(0.07, 0.14) + (ring === 0 ? 0.05 : 0);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 24),
        standard(s % 2 === 0 ? secondary : accent, { metalness: 0.5, roughness: 0.35 }),
      );
      const angle = (s / satellites) * Math.PI * 2;
      mesh.position.set(ringRadius * Math.cos(angle), 0, ringRadius * Math.sin(angle));
      pivot.add(mesh);
    }
    ringGroup.add(pivot);
    group.add(ringGroup);
    pivots.push(pivot);
  }
  animate = (elapsed, delta) => {
    core.rotation.y += delta * 0.25;
    pivots.forEach((pivot, index) => {
      pivot.rotation.y += delta * orbitSpeeds[index];
    });
    group.rotation.y += delta * 0.04;
    roamingLight.position.set(Math.cos(elapsed * 0.4) * 4, 3, Math.sin(elapsed * 0.4) * 4);
  };
  return { group, animate, camera: { radius: 10.5, phi: 1.1, theta: 0.45, minRadius: 5, maxRadius: 19 } };
}

/**
 * WebGL 交互画布：
 * - FPS/帧耗时浮层用 ref 直接改 DOM（高频数据不进 React 状态）
 * - 渲染模式（Albedo/Normal/Wireframe/Depth）是低频 UI 状态，切换时遍历替换材质
 * - 轨道相机为组件内置（拖拽/滚轮/双击复位），无需外部依赖
 */
export default function WorkCanvas({ sceneType, sceneConfig, controlsHint, title, className = "" }: WorkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const modeApiRef = useRef<{ applyMode: (mode: RenderMode) => void } | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("albedo");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const configKey = JSON.stringify(sceneConfig);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = JSON.parse(configKey) as SceneConfig;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.background || "#111827");
    if (config.fogColor) {
      scene.fog = new THREE.Fog(config.fogColor, Number(config.fogNear ?? 8), Number(config.fogFar ?? 26));
    }

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
    const bundle = buildSceneBundle(sceneType, config);
    scene.add(bundle.group);

    scene.add(new THREE.AmbientLight(0xffffff, Number(config.ambientIntensity ?? 0.5)));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.15);
    sun.position.set(5, 8, 5);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xbcd3ff, 0.35);
    rim.position.set(-6, -3, -4);
    scene.add(rim);

    // —— 渲染模式：共享的法线/深度材质 + 每网格缓存的线框材质 ——
    const normalMaterial = new THREE.MeshNormalMaterial();
    const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    const wireCache = new WeakMap<THREE.Mesh, THREE.MeshStandardMaterial>();

    function applyMode(mode: RenderMode) {
      bundle.group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh || mesh.userData.modeExcluded) return;
        // 首次遍历时缓存原始 Albedo 材质，后续所有模式都基于它派生
        const albedo = (mesh.userData.albedo ??= mesh.material) as THREE.MeshStandardMaterial;
        if (mode === "normal") {
          mesh.material = normalMaterial;
        } else if (mode === "depth") {
          mesh.material = depthMaterial;
        } else if (mode === "wireframe") {
          let wire = wireCache.get(mesh);
          if (!wire) {
            wire = albedo.clone();
            wire.wireframe = true;
            wireCache.set(mesh, wire);
          }
          mesh.material = wire;
        } else {
          mesh.material = albedo;
        }
      });
    }
    applyMode("albedo");
    modeApiRef.current = { applyMode };

    // —— 内置轨道相机（含阻尼）——
    const initial = bundle.camera;
    const orbit = {
      theta: initial.theta,
      phi: initial.phi,
      radius: initial.radius,
      targetTheta: initial.theta,
      targetPhi: initial.phi,
      targetRadius: initial.radius,
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      orbit.targetTheta -= (event.clientX - lastX) * 0.006;
      orbit.targetPhi = THREE.MathUtils.clamp(orbit.targetPhi - (event.clientY - lastY) * 0.005, 0.15, Math.PI - 0.15);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      orbit.targetRadius = THREE.MathUtils.clamp(
        orbit.targetRadius * (1 + event.deltaY * 0.0012),
        initial.minRadius,
        initial.maxRadius,
      );
    };
    const onDoubleClick = () => {
      orbit.targetTheta = initial.theta;
      orbit.targetPhi = initial.phi;
      orbit.targetRadius = initial.radius;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("dblclick", onDoubleClick);

    // —— 自适应容器尺寸 ——
    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // —— 渲染循环：FPS 走 DOM ref，不触发 React 重渲染 ——
    let frames = 0;
    let lastSample = performance.now();
    let firstFrame = true;
    const clock = new THREE.Clock();

    let rafId = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;

      orbit.theta += (orbit.targetTheta - orbit.theta) * 0.12;
      orbit.phi += (orbit.targetPhi - orbit.phi) * 0.12;
      orbit.radius += (orbit.targetRadius - orbit.radius) * 0.12;
      camera.position.set(
        orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        orbit.radius * Math.cos(orbit.phi),
        orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
      );
      camera.lookAt(0, 0, 0);

      bundle.animate(elapsed, delta);
      renderer.render(scene, camera);

      if (firstFrame) {
        firstFrame = false;
        setReady(true);
      }
      frames += 1;
      const now = performance.now();
      if (now - lastSample >= 500 && fpsRef.current) {
        const fps = Math.round((frames * 1000) / (now - lastSample));
        fpsRef.current.textContent = `${fps} FPS · ${(1000 / Math.max(fps, 1)).toFixed(1)} ms`;
        frames = 0;
        lastSample = now;
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose?.());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      modeApiRef.current = null;
    };
  }, [sceneType, configKey]);

  useEffect(() => {
    modeApiRef.current?.applyMode(renderMode);
  }, [renderMode, ready]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${title} WebGL 交互场景`}
      className={`relative h-full w-full overflow-hidden bg-[#111827] ${className}`}
    >
      {/* 性能监控浮层：高频刷新，直接操作 DOM */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-black/45 px-2.5 py-1.5 font-mono text-[11px] leading-none text-emerald-300 backdrop-blur-sm">
        <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
        <span ref={fpsRef}>-- FPS</span>
      </div>

      {/* 渲染模式切换 */}
      <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-md bg-black/45 backdrop-blur-sm">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRenderMode(option.value)}
            aria-pressed={renderMode === option.value}
            className={`px-2.5 py-1.5 font-mono text-[11px] leading-none transition-colors ${
              renderMode === option.value ? "bg-white/85 text-black" : "text-white/70 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 操作提示 */}
      {controlsHint.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
          {controlsHint.map((hint) => (
            <span
              key={hint}
              className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/75 backdrop-blur-sm"
            >
              {hint === "拖拽旋转视角" ? <MousePointer2 className="h-3 w-3" aria-hidden="true" /> : null}
              {hint === "双击复位" ? <RotateCcw className="h-3 w-3" aria-hidden="true" /> : null}
              {hint}
            </span>
          ))}
        </div>
      )}

      {(!ready || failed) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#111827]">
          {failed ? (
            <p className="px-6 text-center text-sm text-white/60">当前浏览器不支持 WebGL，无法渲染交互场景。</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              场景构建中…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
