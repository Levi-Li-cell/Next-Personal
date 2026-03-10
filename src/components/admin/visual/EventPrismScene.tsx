"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface EventDatum {
  event_type: string;
  count: number;
}

const EVENT_LABEL: Record<string, string> = {
  user_signup: "Signup",
  guestbook_message: "Guestbook",
  blog_comment: "Comment",
};

export function EventPrismScene({
  data,
  activeEventType,
  onSelect,
}: {
  data: EventDatum[];
  activeEventType?: string;
  onSelect?: (eventType: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const bars = useMemo(() => {
    const normalized = ["user_signup", "guestbook_message", "blog_comment"].map((key) => {
      const found = data.find((item) => item.event_type === key);
      return { event_type: key, count: found?.count || 0 };
    });
    return normalized;
  }, [data]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4.5, 10);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0x67e8f9, 1.3);
    keyLight.position.set(4, 8, 6);
    scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.2, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const max = Math.max(...bars.map((item) => item.count), 1);
    const palette = [0x22d3ee, 0x38bdf8, 0x34d399];

    const barMeshes: THREE.Mesh[] = [];
    bars.forEach((item, index) => {
      const height = Math.max((item.count / max) * 4.5, 0.25);
      const geometry = new THREE.BoxGeometry(1.6, height, 1.6);
      const material = new THREE.MeshStandardMaterial({
        color: palette[index % palette.length],
        emissive: 0x082f49,
        metalness: 0.45,
        roughness: 0.35,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((index - 1) * 3, height / 2, 0);
      scene.add(mesh);
      barMeshes.push(mesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = -1;
    let drag = false;
    let lastX = 0;

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(barMeshes);
      const nextHovered = hit.length > 0 ? barMeshes.indexOf(hit[0].object as THREE.Mesh) : -1;

      if (hovered !== nextHovered) {
        hovered = nextHovered;
        barMeshes.forEach((mesh, idx) => {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.emissive.setHex(idx === hovered ? 0x0ea5e9 : 0x082f49);
          material.needsUpdate = true;
        });
      }

      if (drag) {
        const delta = event.clientX - lastX;
        scene.rotation.y += delta * 0.005;
        lastX = event.clientX;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      drag = true;
      lastX = event.clientX;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(barMeshes);
      if (hit.length > 0) {
        const idx = barMeshes.indexOf(hit[0].object as THREE.Mesh);
        const type = bars[idx]?.event_type;
        if (type && onSelect) {
          onSelect(type);
        }
      }
    };

    const onPointerUp = () => {
      drag = false;
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      scene.rotation.y += 0.0018;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [bars, onSelect]);

  return (
    <div className="space-y-3">
      <div ref={mountRef} className="h-[340px] w-full overflow-hidden rounded-xl border border-cyan-500/20" />
      <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
        {bars.map((item) => (
          <button
            key={item.event_type}
            type="button"
            onClick={() => onSelect?.(item.event_type)}
            className={`rounded-md border px-3 py-2 text-left transition ${
              activeEventType === item.event_type
                ? "border-cyan-400 bg-cyan-500/15"
                : "border-slate-700/60 bg-slate-900/50"
            }`}
          >
            <span className="text-slate-400">{EVENT_LABEL[item.event_type] || item.event_type}:</span> {item.count}
          </button>
        ))}
      </div>
    </div>
  );
}
