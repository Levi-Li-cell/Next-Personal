"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import * as THREE from "three";

type Cell = { x: number; z: number };
type ThemeName = "forest" | "desert";
const OBSTACLE_COUNT = 16;

const THEMES: Record<ThemeName, {
  label: string;
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  fillColor: string;
  fillIntensity: number;
  worldColor: string;
  arenaColor: string;
  gridMajor: number;
  gridMinor: number;
  borderColor: string;
  trunkColor: string;
  treeColor: string;
  rockColor: string;
  snakeColor: string;
  headColor: string;
  foodColor: string;
  starsColor: string;
  obstacleColor: string;
}> = {
  forest: {
    label: "森林绿洲",
    background: "#7ecf93",
    fogColor: "#8bd5a0",
    fogNear: 10,
    fogFar: 56,
    hemiSky: "#c8f5ff",
    hemiGround: "#416f4c",
    hemiIntensity: 1.15,
    sunColor: "#fff0cf",
    sunIntensity: 1.28,
    fillColor: "#bbf7d0",
    fillIntensity: 0.52,
    worldColor: "#56c271",
    arenaColor: "#8add98",
    gridMajor: 0xe2fbe8,
    gridMinor: 0xc8f2d2,
    borderColor: "#3ca95a",
    trunkColor: "#8b5a2b",
    treeColor: "#1f9d4f",
    rockColor: "#dbe5dd",
    snakeColor: "#0b8f4b",
    headColor: "#14b85e",
    foodColor: "#ff8a33",
    starsColor: "#ffffff",
    obstacleColor: "#6b3f22",
  },
  desert: {
    label: "荒漠橙色",
    background: "#e8b67a",
    fogColor: "#f1c58a",
    fogNear: 9,
    fogFar: 52,
    hemiSky: "#ffe0b0",
    hemiGround: "#8b5f33",
    hemiIntensity: 1.12,
    sunColor: "#ffe7c2",
    sunIntensity: 1.34,
    fillColor: "#ffbb73",
    fillIntensity: 0.46,
    worldColor: "#d6934d",
    arenaColor: "#efb06b",
    gridMajor: 0xf9e1bf,
    gridMinor: 0xecc694,
    borderColor: "#b87232",
    trunkColor: "#84532f",
    treeColor: "#c67c3d",
    rockColor: "#d7b48c",
    snakeColor: "#7d4f27",
    headColor: "#9a6430",
    foodColor: "#ff5d2e",
    starsColor: "#fff4dc",
    obstacleColor: "#8a4d1e",
  },
};

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

function generateObstacles(excluded: Cell[], count: number) {
  const obstacles: Cell[] = [];
  while (obstacles.length < count) {
    const cell = randomCell([...excluded, ...obstacles]);
    obstacles.push(cell);
  }
  return obstacles;
}

function createInitialState() {
  const snake: Cell[] = [
    { x: 5, z: 7 },
    { x: 4, z: 7 },
    { x: 3, z: 7 },
  ];
  const obstacles = generateObstacles(snake, OBSTACLE_COUNT);
  return {
    snake,
    direction: { x: 1, z: 0 },
    nextDirection: { x: 1, z: 0 },
    obstacles,
    food: randomCell([...snake, ...obstacles]) as Cell,
    score: 0,
    gameOver: false,
  };
}

export default function Snake3DPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(createInitialState());
  const timingRef = useRef({ lastMove: performance.now() });
  const controlRef = useRef({ started: false, paused: false, gameOver: false });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("forest");
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("snake3d-theme");
    if (savedTheme === "forest" || savedTheme === "desert") {
      setTheme(savedTheme);
    }

    const savedHighScore = Number(window.localStorage.getItem("snake3d-high-score") || "0");
    if (Number.isFinite(savedHighScore) && savedHighScore > 0) {
      setHighScore(savedHighScore);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("snake3d-theme", theme);
  }, [theme]);

  useEffect(() => {
    controlRef.current.started = started;
  }, [started]);

  useEffect(() => {
    controlRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    controlRef.current.gameOver = gameOver;
  }, [gameOver]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const activeTheme = THEMES[theme];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(activeTheme.background);
    scene.fog = new THREE.Fog(activeTheme.fogColor, activeTheme.fogNear, activeTheme.fogFar);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
    camera.position.set(GRID_SIZE * 0.55, GRID_SIZE * 1.2, GRID_SIZE * 1.2);
    camera.lookAt(new THREE.Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(activeTheme.hemiSky, activeTheme.hemiGround, activeTheme.hemiIntensity);
    const sun = new THREE.DirectionalLight(activeTheme.sunColor, activeTheme.sunIntensity);
    sun.position.set(14, 24, 10);
    const fill = new THREE.DirectionalLight(activeTheme.fillColor, activeTheme.fillIntensity);
    fill.position.set(-12, 8, -10);
    scene.add(hemi, sun, fill);

    const boardCenter = new THREE.Vector3((GRID_SIZE - 1) / 2, 0, (GRID_SIZE - 1) / 2);

    const worldPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE * 9, GRID_SIZE * 9),
      new THREE.MeshStandardMaterial({ color: activeTheme.worldColor, roughness: 0.97, metalness: 0.02 })
    );
    worldPlane.rotation.x = -Math.PI / 2;
    worldPlane.position.set(boardCenter.x, -0.58, boardCenter.z);
    scene.add(worldPlane);

    const arenaPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE + 0.7, GRID_SIZE + 0.7),
      new THREE.MeshStandardMaterial({ color: activeTheme.arenaColor, roughness: 0.78, metalness: 0.05 })
    );
    arenaPlane.rotation.x = -Math.PI / 2;
    arenaPlane.position.set(boardCenter.x, -0.545, boardCenter.z);
    scene.add(arenaPlane);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, activeTheme.gridMajor, activeTheme.gridMinor);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.58;
    grid.position.set(boardCenter.x, -0.5, boardCenter.z);
    scene.add(grid);

    const border = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE + 0.25, 0.45, GRID_SIZE + 0.25),
      new THREE.MeshStandardMaterial({ color: activeTheme.borderColor, roughness: 0.86, metalness: 0.02 })
    );
    border.position.set(boardCenter.x, -0.76, boardCenter.z);
    scene.add(border);

    const createTree = () => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.2, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: activeTheme.trunkColor, roughness: 0.9 })
      );
      trunk.position.y = 0.04;
      const crown1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.68, 1.15, 10),
        new THREE.MeshStandardMaterial({ color: activeTheme.treeColor, roughness: 0.86 })
      );
      crown1.position.y = 0.85;
      const crown2 = crown1.clone();
      crown2.scale.setScalar(0.78);
      crown2.position.y = 1.28;
      tree.add(trunk, crown1, crown2);
      return tree;
    };

    const createRock = () => {
      return new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.35, 0),
        new THREE.MeshStandardMaterial({ color: activeTheme.rockColor, roughness: 0.95, metalness: 0 })
      );
    };

    const decoGroup = new THREE.Group();
    const decoCount = 40;
    for (let i = 0; i < decoCount; i += 1) {
      const angle = (i / decoCount) * Math.PI * 2 + Math.random() * 0.3;
      const radius = GRID_SIZE * 0.72 + Math.random() * GRID_SIZE * 1.55;
      const x = boardCenter.x + Math.cos(angle) * radius;
      const z = boardCenter.z + Math.sin(angle) * radius;

      if (Math.random() > 0.33) {
        const tree = createTree();
        const scale = 0.75 + Math.random() * 0.8;
        tree.position.set(x, -0.5, z);
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI;
        decoGroup.add(tree);
      } else {
        const rock = createRock();
        rock.position.set(x, -0.4, z);
        rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
        decoGroup.add(rock);
      }
    }
    scene.add(decoGroup);

    const starsGeo = new THREE.BufferGeometry();
    const starCount = 130;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPos[i * 3] = boardCenter.x + (Math.random() - 0.5) * GRID_SIZE * 9;
      starPos[i * 3 + 1] = 8 + Math.random() * 13;
      starPos[i * 3 + 2] = boardCenter.z + (Math.random() - 0.5) * GRID_SIZE * 9;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: activeTheme.starsColor, size: 0.08, transparent: true, opacity: 0.62 })
    );
    scene.add(stars);

    const snakeMaterial = new THREE.MeshStandardMaterial({ color: activeTheme.snakeColor, roughness: 0.34, metalness: 0.07 });
    const headMaterial = new THREE.MeshStandardMaterial({ color: activeTheme.headColor, roughness: 0.28, metalness: 0.08 });
    const foodMaterial = new THREE.MeshStandardMaterial({ color: activeTheme.foodColor, roughness: 0.22, metalness: 0.06 });
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: activeTheme.obstacleColor, roughness: 0.75, metalness: 0.04 });

    const cube = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const foodGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const foodMesh = new THREE.Mesh(foodGeo, foodMaterial);
    scene.add(foodMesh);

    const snakeMeshes: THREE.Mesh[] = [];
    const obstacleMeshes: THREE.Mesh[] = [];

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

      while (obstacleMeshes.length < state.obstacles.length) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.44, 0.9, 8), obstacleMaterial);
        scene.add(mesh);
        obstacleMeshes.push(mesh);
      }
      while (obstacleMeshes.length > state.obstacles.length) {
        const mesh = obstacleMeshes.pop();
        if (mesh) scene.remove(mesh);
      }

      obstacleMeshes.forEach((mesh, i) => {
        const obstacle = state.obstacles[i];
        mesh.position.set(obstacle.x, 0, obstacle.z);
      });
    }

    let raf = 0;
    timingRef.current.lastMove = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();

      const state = stateRef.current;
      const speedStep = Math.floor(state.score / 5);
      const moveMs = Math.max(95, 170 - speedStep * 12);

      if (controlRef.current.started && !controlRef.current.paused && !state.gameOver && now - timingRef.current.lastMove >= moveMs) {
        timingRef.current.lastMove = now;

        state.direction = state.nextDirection;

        const nextHead = {
          x: state.snake[0].x + state.direction.x,
          z: state.snake[0].z + state.direction.z,
        };

        const hitBoundary = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.z < 0 || nextHead.z >= GRID_SIZE;
        const hitSelf = state.snake.some((part) => sameCell(part, nextHead));
        const hitObstacle = state.obstacles.some((item) => sameCell(item, nextHead));

        if (hitBoundary || hitSelf || hitObstacle) {
          state.gameOver = true;
          controlRef.current.paused = false;
          controlRef.current.started = false;
          controlRef.current.gameOver = true;
          setPaused(false);
          setStarted(false);
          setLastScore(state.score);
          setGameOver(true);
          setHighScore((prev) => {
            const next = Math.max(prev, state.score);
            if (next !== prev) {
              window.localStorage.setItem("snake3d-high-score", String(next));
            }
            return next;
          });
        } else {
          state.snake = [nextHead, ...state.snake];
          if (sameCell(nextHead, state.food)) {
            state.score += 1;
            setScore(state.score);
            state.food = randomCell([...state.snake, ...state.obstacles]);
          } else {
            state.snake.pop();
          }
        }

        syncMeshes();
      }

      stars.rotation.y += 0.00055;
      foodMesh.rotation.y += 0.04;
      renderer.render(scene, camera);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (controlRef.current.gameOver) {
          return;
        }
        if (!controlRef.current.started) {
          timingRef.current.lastMove = performance.now();
          controlRef.current.started = true;
          controlRef.current.paused = false;
          setStarted(true);
          setPaused(false);
          return;
        }
        controlRef.current.paused = !controlRef.current.paused;
        setPaused((prev) => !prev);
        timingRef.current.lastMove = performance.now();
        return;
      }

      if (!controlRef.current.started || controlRef.current.paused || controlRef.current.gameOver) {
        return;
      }

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
  }, [theme]);

  const restart = () => {
    stateRef.current = createInitialState();
    timingRef.current.lastMove = performance.now();
    controlRef.current.started = true;
    controlRef.current.paused = false;
    controlRef.current.gameOver = false;
    setScore(0);
    setLastScore(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
  };

  const startGame = () => {
    timingRef.current.lastMove = performance.now();
    controlRef.current.started = true;
    controlRef.current.paused = false;
    controlRef.current.gameOver = false;
    setStarted(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (!controlRef.current.started || controlRef.current.gameOver) {
      return;
    }
    timingRef.current.lastMove = performance.now();
    controlRef.current.paused = !controlRef.current.paused;
    setPaused((prev) => !prev);
  };

  const speedLevel = Math.floor(score / 5) + 1;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/author" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" /> 返回作者页
          </Link>
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === "forest" ? "desert" : "forest"))}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-100 hover:bg-orange-500/30"
          >
            切换主题: {THEMES[theme].label}
          </button>
        </div>
        <div className="flex items-center gap-3 text-white">
          <span className="rounded-md bg-cyan-500/20 px-3 py-1 text-sm">得分: {score}</span>
          <span className="rounded-md bg-amber-500/20 px-3 py-1 text-sm text-amber-200">最高: {highScore}</span>
          <span className="rounded-md bg-violet-500/20 px-3 py-1 text-sm text-violet-200">速度 Lv.{speedLevel}</span>
          {started && !gameOver ? (
            <button
              type="button"
              onClick={togglePause}
              className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              {paused ? "继续" : "暂停"}
            </button>
          ) : null}
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

      <div className="relative rounded-2xl border border-white/10 bg-black/40 p-3">
        <div ref={mountRef} className="h-[70vh] min-h-[420px] w-full rounded-xl overflow-hidden" />

        {!started && !gameOver ? (
          <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-black/55 backdrop-blur-sm">
            <div className="max-w-md rounded-2xl border border-white/20 bg-black/50 p-6 text-white">
              <p className="text-xl font-semibold">Snake 3D 挑战开始</p>
              <p className="mt-3 text-sm text-white/80">目标：吃到更多食物并持续生存。每 5 分会提速，撞到边界、路障或自身都会结束。</p>
              <p className="mt-2 text-sm text-white/70">操作：方向键 / WASD。空格键可暂停与继续。</p>
              <button
                type="button"
                onClick={startGame}
                className="mt-4 rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                开始游戏
              </button>
            </div>
          </div>
        ) : null}

        {started && paused && !gameOver ? (
          <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-black/45">
            <div className="rounded-xl border border-white/20 bg-black/60 px-5 py-3 text-white">已暂停，按空格或按钮继续</div>
          </div>
        ) : null}

        {gameOver ? (
          <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-black/55 backdrop-blur-sm">
            <div className="max-w-sm rounded-2xl border border-red-300/30 bg-black/60 p-6 text-white">
              <p className="text-xl font-semibold text-red-300">游戏结束</p>
              <p className="mt-3 text-sm text-white/85">本局得分: {lastScore}</p>
              <p className="mt-1 text-sm text-white/70">历史最高: {highScore}</p>
              <button
                type="button"
                onClick={restart}
                className="mt-4 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
              >
                再来一局
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-white/70">操作方式：键盘方向键 / WASD，空格暂停。每 5 分会自动提速，撞到自身、路障或边界都会结束游戏。</p>
    </div>
  );
}
