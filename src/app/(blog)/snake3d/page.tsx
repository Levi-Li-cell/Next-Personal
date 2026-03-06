"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import * as THREE from "three";

type Cell = { x: number; z: number };

const GRID_SIZE = 14;

function sameCell(a: Cell, b: Cell) {
  return a.x === b.x && a.z === b.z;
}

function randomCell(excluded: Cell[]) {
  while (true) {
    const cell = {
      x: Math.floor(Math.random() * GRID_SIZE),
      z: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!excluded.some((item) => sameCell(item, cell))) {
      return cell;
    }
  }
}

export default function Snake3DPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    snake: [
      { x: 5, z: 7 },
      { x: 4, z: 7 },
      { x: 3, z: 7 },
    ] as Cell[],
    direction: { x: 1, z: 0 },
    nextDirection: { x: 1, z: 0 },
    food: { x: 9, z: 7 } as Cell,
    score: 0,
    gameOver: false,
  });

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b16");

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(GRID_SIZE * 0.55, GRID_SIZE * 1.2, GRID_SIZE * 1.2);
    camera.lookAt(new THREE.Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 20, 8);
    scene.add(ambient, dir);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
      new THREE.MeshStandardMaterial({ color: "#1d2233", roughness: 0.85 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((GRID_SIZE - 1) / 2, -0.55, (GRID_SIZE - 1) / 2);
    scene.add(plane);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x4f5d75, 0x374151);
    grid.position.set((GRID_SIZE - 1) / 2, -0.5, (GRID_SIZE - 1) / 2);
    scene.add(grid);

    const snakeMaterial = new THREE.MeshStandardMaterial({ color: "#22d3ee", roughness: 0.35 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: "#38bdf8", roughness: 0.25 });
    const foodMaterial = new THREE.MeshStandardMaterial({ color: "#f97316", roughness: 0.2 });

    const cube = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const foodGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const foodMesh = new THREE.Mesh(foodGeo, foodMaterial);
    scene.add(foodMesh);

    const snakeMeshes: THREE.Mesh[] = [];

    function syncMeshes() {
      const state = stateRef.current;

      while (snakeMeshes.length < state.snake.length) {
        const mesh = new THREE.Mesh(cube, snakeMaterial);
        scene.add(mesh);
        snakeMeshes.push(mesh);
      }
      while (snakeMeshes.length > state.snake.length) {
        const mesh = snakeMeshes.pop();
        if (mesh) scene.remove(mesh);
      }

      snakeMeshes.forEach((mesh, i) => {
        const cell = state.snake[i];
        mesh.position.set(cell.x, 0, cell.z);
        mesh.material = i === 0 ? headMaterial : snakeMaterial;
      });

      foodMesh.position.set(state.food.x, 0, state.food.z);
    }

    let raf = 0;
    let lastMove = performance.now();
    const moveMs = 170;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();

      if (!stateRef.current.gameOver && now - lastMove >= moveMs) {
        lastMove = now;

        const state = stateRef.current;
        state.direction = state.nextDirection;

        const nextHead = {
          x: (state.snake[0].x + state.direction.x + GRID_SIZE) % GRID_SIZE,
          z: (state.snake[0].z + state.direction.z + GRID_SIZE) % GRID_SIZE,
        };

        if (state.snake.some((part) => sameCell(part, nextHead))) {
          state.gameOver = true;
          setGameOver(true);
        } else {
          state.snake = [nextHead, ...state.snake];
          if (sameCell(nextHead, state.food)) {
            state.score += 1;
            setScore(state.score);
            state.food = randomCell(state.snake);
          } else {
            state.snake.pop();
          }
        }

        syncMeshes();
      }

      foodMesh.rotation.y += 0.04;
      renderer.render(scene, camera);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current;
      const { x, z } = state.direction;

      if ((event.key === "ArrowUp" || event.key.toLowerCase() === "w") && z !== 1) {
        state.nextDirection = { x: 0, z: -1 };
      } else if ((event.key === "ArrowDown" || event.key.toLowerCase() === "s") && z !== -1) {
        state.nextDirection = { x: 0, z: 1 };
      } else if ((event.key === "ArrowLeft" || event.key.toLowerCase() === "a") && x !== 1) {
        state.nextDirection = { x: -1, z: 0 };
      } else if ((event.key === "ArrowRight" || event.key.toLowerCase() === "d") && x !== -1) {
        state.nextDirection = { x: 1, z: 0 };
      }
    };

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    syncMeshes();
    tick();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const restart = () => {
    stateRef.current = {
      snake: [
        { x: 5, z: 7 },
        { x: 4, z: 7 },
        { x: 3, z: 7 },
      ],
      direction: { x: 1, z: 0 },
      nextDirection: { x: 1, z: 0 },
      food: randomCell([
        { x: 5, z: 7 },
        { x: 4, z: 7 },
        { x: 3, z: 7 },
      ]),
      score: 0,
      gameOver: false,
    };
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/author" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" /> 返回作者页
        </Link>
        <div className="flex items-center gap-3 text-white">
          <span className="rounded-md bg-cyan-500/20 px-3 py-1 text-sm">得分: {score}</span>
          {gameOver ? <span className="rounded-md bg-red-500/20 px-3 py-1 text-sm text-red-300">游戏结束</span> : null}
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" /> 重新开始
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <div ref={mountRef} className="h-[70vh] min-h-[420px] w-full rounded-xl overflow-hidden" />
      </div>

      <p className="mt-3 text-sm text-white/70">操作方式：键盘方向键 / WASD。参考了 `three-snake-live` 的 3D 交互风格并集成到站点路由。</p>
    </div>
  );
}
