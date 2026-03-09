"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import * as turf from "@turf/turf";
import shp from "shpjs";
import { XMLParser } from "fast-xml-parser";
import * as THREE from "three";
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Upload,
  FlaskConical,
  Layers3,
  Radar,
  FileJson,
  Sparkles,
  Download,
  Play,
  Pause,
} from "lucide-react";

type AnyFeature = {
  type: "Feature";
  geometry: { type: string; coordinates: unknown } | null;
  properties?: Record<string, unknown>;
  id?: string | number;
};

type AnyFeatureCollection = {
  type: "FeatureCollection";
  features: AnyFeature[];
};

type LayerVisibility = {
  point: boolean;
  line: boolean;
  polygon: boolean;
};

const sampleFeatureCollection: AnyFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Park-A", floor: 12, category: "office" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [116.382, 39.905],
            [116.392, 39.905],
            [116.392, 39.913],
            [116.382, 39.913],
            [116.382, 39.905],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Park-B", floor: 18, category: "mixed" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [116.389, 39.909],
            [116.399, 39.909],
            [116.399, 39.917],
            [116.389, 39.917],
            [116.389, 39.909],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Station-1", kind: "subway", value: 9 },
      geometry: { type: "Point", coordinates: [116.386, 39.908] },
    },
    {
      type: "Feature",
      properties: { name: "Station-2", kind: "bus", value: 5 },
      geometry: { type: "Point", coordinates: [116.396, 39.914] },
    },
    {
      type: "Feature",
      properties: { name: "Main-Road", level: 1 },
      geometry: {
        type: "LineString",
        coordinates: [
          [116.379, 39.904],
          [116.387, 39.911],
          [116.398, 39.918],
        ],
      },
    },
  ],
};

function normalizeFeatureCollection(raw: unknown): AnyFeatureCollection {
  if (!raw || typeof raw !== "object") {
    throw new Error("数据为空");
  }
  const value = raw as { type?: string; features?: unknown; geometry?: unknown; properties?: unknown };
  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    return { type: "FeatureCollection", features: value.features as AnyFeature[] };
  }
  if (value.type === "Feature") {
    return { type: "FeatureCollection", features: [value as AnyFeature] };
  }
  if (value.geometry) {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: value.geometry as AnyFeature["geometry"], properties: (value.properties as Record<string, unknown>) || {} }],
    };
  }
  throw new Error("无法识别的数据格式");
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumbers(input: string): number[] {
  return input
    .replace(/,/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function pairCoordinates(nums: number[]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    result.push([nums[i], nums[i + 1]]);
  }
  return result;
}

function parseGmlGeometry(node: unknown): AnyFeature["geometry"] {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  const point = obj.Point as Record<string, unknown> | undefined;
  if (point) {
    const pos = typeof point.pos === "string" ? toNumbers(point.pos) : [];
    if (pos.length >= 2) return { type: "Point", coordinates: [pos[0], pos[1]] };
  }

  const lineString = obj.LineString as Record<string, unknown> | undefined;
  if (lineString) {
    const posList = typeof lineString.posList === "string" ? toNumbers(lineString.posList) : [];
    const coords = pairCoordinates(posList);
    if (coords.length > 1) return { type: "LineString", coordinates: coords };
  }

  const polygon = obj.Polygon as Record<string, unknown> | undefined;
  if (polygon) {
    const exterior = polygon.exterior as Record<string, unknown> | undefined;
    const ring = exterior?.LinearRing as Record<string, unknown> | undefined;
    const nums = typeof ring?.posList === "string" ? toNumbers(ring.posList) : [];
    const outer = pairCoordinates(nums);
    if (outer.length > 3) return { type: "Polygon", coordinates: [outer] };
  }

  for (const value of Object.values(obj)) {
    const nested = parseGmlGeometry(value);
    if (nested) return nested;
  }

  return null;
}

function parseGmlToFeatureCollection(xmlText: string): AnyFeatureCollection {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  const data = parser.parse(xmlText) as Record<string, unknown>;
  const root = data.FeatureCollection as Record<string, unknown> | undefined;
  const members = root?.featureMember ?? root?.featureMembers;
  const memberList = toArray<Record<string, unknown>>(members as Record<string, unknown> | Record<string, unknown>[] | undefined);

  const features: AnyFeature[] = [];
  for (const member of memberList) {
    const node = member && typeof member === "object" ? (Object.values(member)[0] as Record<string, unknown>) : undefined;
    if (!node) continue;
    const geometry = parseGmlGeometry(node);
    if (!geometry) continue;
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        properties[key] = value;
      }
    }
    features.push({ type: "Feature", geometry, properties });
  }

  if (!features.length) {
    throw new Error("GML 解析失败，仅支持 Point/LineString/Polygon 的常见结构");
  }

  return { type: "FeatureCollection", features };
}

function inferHeight(properties: Record<string, unknown> | undefined, index: number): number {
  if (!properties) return 8 + (index % 7);
  const candidates = [properties.floor, properties.height, properties.level, properties.value]
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  if (!candidates.length) return 8 + (index % 7);
  return Math.max(4, candidates[0]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function ThreePreview({ dataset }: { dataset: AnyFeatureCollection | null }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = mountRef.current;
    if (!root || !dataset) return;

    root.innerHTML = "";
    const width = root.clientWidth || 640;
    const height = 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05080f");

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.set(0, 40, 70);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    root.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const directional = new THREE.DirectionalLight(0x7dd3fc, 1.1);
    directional.position.set(25, 40, 20);
    scene.add(ambient, directional);

    const grid = new THREE.GridHelper(120, 18, 0x4f46e5, 0x1f2937);
    scene.add(grid);

    const polygonFeatures = dataset.features.filter((feature) => feature.geometry?.type === "Polygon").slice(0, 24);
    const bboxValue = turf.bbox(dataset as never) as [number, number, number, number];
    const centerX = (bboxValue[0] + bboxValue[2]) / 2;
    const centerY = (bboxValue[1] + bboxValue[3]) / 2;
    const scale = 1800;

    const extruded: THREE.Mesh[] = [];
    polygonFeatures.forEach((feature, index) => {
      const rings = feature.geometry?.coordinates as number[][][] | undefined;
      if (!rings?.[0]?.length) return;

      const shape = new THREE.Shape();
      rings[0].forEach((coord, coordIndex) => {
        const x = (coord[0] - centerX) * scale;
        const y = (coord[1] - centerY) * scale;
        if (coordIndex === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });

      const depth = inferHeight(feature.properties, index);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      geometry.rotateX(-Math.PI / 2);

      const color = new THREE.Color(`hsl(${190 + index * 11}, 78%, 55%)`);
      const material = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.35 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0.2;
      scene.add(mesh);
      extruded.push(mesh);
    });

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const newWidth = root.clientWidth || 640;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      extruded.forEach((mesh) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      });
      renderer.dispose();
      root.innerHTML = "";
    };
  }, [dataset]);

  return <div ref={mountRef} className="h-[320px] w-full overflow-hidden rounded-2xl border border-white/10" />;
}

function MapLibrePreview({ dataset, layerVisibility }: { dataset: AnyFeatureCollection; layerVisibility: LayerVisibility }) {
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const wrap = mapWrapRef.current;
    if (!wrap || mapRef.current) return;

    const map = new maplibregl.Map({
      container: wrap,
      style: {
        version: 8,
        sources: {
          dark: {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap © CARTO",
          },
        },
        layers: [{ id: "dark", type: "raster", source: "dark" }],
      },
      center: [116.39, 39.91],
      zoom: 12,
      pitch: 32,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource("geo-lab-data", {
        type: "geojson",
        data: dataset as unknown as GeoJSON.GeoJSON,
      });

      map.addLayer({
        id: "geo-lab-fill",
        type: "fill",
        source: "geo-lab-data",
        layout: {
          visibility: layerVisibility.polygon ? "visible" : "none",
        },
        paint: {
          "fill-color": ["interpolate", ["linear"], ["to-number", ["get", "floor"], 8], 8, "#22d3ee", 25, "#a855f7"],
          "fill-opacity": 0.35,
        },
        filter: ["==", ["geometry-type"], "Polygon"],
      });

      map.addLayer({
        id: "geo-lab-line",
        type: "line",
        source: "geo-lab-data",
        layout: {
          visibility: layerVisibility.line ? "visible" : "none",
        },
        paint: {
          "line-color": "#f472b6",
          "line-width": 2.2,
          "line-dasharray": [2, 1],
        },
        filter: ["==", ["geometry-type"], "LineString"],
      });

      map.addLayer({
        id: "geo-lab-point",
        type: "circle",
        source: "geo-lab-data",
        layout: {
          visibility: layerVisibility.point ? "visible" : "none",
        },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 8],
          "circle-color": "#fde047",
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#ffffff",
        },
        filter: ["==", ["geometry-type"], "Point"],
      });

      const bbox = turf.bbox(dataset as never) as [number, number, number, number];
      if (bbox.every((value) => Number.isFinite(value))) {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ] as LngLatBoundsLike,
          { padding: 34, duration: 700 }
        );
      }

      map.on("click", "geo-lab-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new maplibregl.Popup({ closeButton: true, closeOnMove: true })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-size:12px;color:#111">${JSON.stringify(f.properties || {}, null, 2).replace(/\n/g, "<br/>")}</div>`)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [dataset, layerVisibility.line, layerVisibility.point, layerVisibility.polygon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("geo-lab-data") as GeoJSONSource | undefined;
    if (source) {
      source.setData(dataset as unknown as GeoJSON.GeoJSON);
      const bbox = turf.bbox(dataset as never) as [number, number, number, number];
      if (bbox.every((value) => Number.isFinite(value))) {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ] as LngLatBoundsLike,
          { padding: 34, duration: 500 }
        );
      }
    }
  }, [dataset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("geo-lab-fill")) {
      map.setLayoutProperty("geo-lab-fill", "visibility", layerVisibility.polygon ? "visible" : "none");
    }
    if (map.getLayer("geo-lab-line")) {
      map.setLayoutProperty("geo-lab-line", "visibility", layerVisibility.line ? "visible" : "none");
    }
    if (map.getLayer("geo-lab-point")) {
      map.setLayoutProperty("geo-lab-point", "visibility", layerVisibility.point ? "visible" : "none");
    }
  }, [layerVisibility]);

  return <div ref={mapWrapRef} className="h-[360px] w-full overflow-hidden rounded-2xl border border-white/10" />;
}

export default function GeoLabWorkbench() {
  const [dataset, setDataset] = useState<AnyFeatureCollection>(sampleFeatureCollection);
  const [analysisResult, setAnalysisResult] = useState<AnyFeatureCollection | null>(null);
  const [logs, setLogs] = useState<string[]>(["已加载示例数据，可直接体验空间分析流程"]);
  const [bufferKm, setBufferKm] = useState(0.6);
  const [busy, setBusy] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [resultMode, setResultMode] = useState<"auto" | "raw" | "analysis">("auto");
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({ point: true, line: true, polygon: true });
  const demoStoppedRef = useRef(false);

  const overview = useMemo(() => {
    const typeStat = dataset.features.reduce<Record<string, number>>((acc, feature) => {
      const type = feature.geometry?.type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const bboxValue = turf.bbox(dataset as never) as [number, number, number, number];
    return {
      count: dataset.features.length,
      typeStat,
      bboxValue,
    };
  }, [dataset]);

  const displayLayer = resultMode === "raw" ? dataset : resultMode === "analysis" ? analysisResult || dataset : analysisResult || dataset;

  const appendLog = (text: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString("zh-CN", { hour12: false })} ${text}`, ...prev].slice(0, 24));
  };

  const importFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    setBusy(true);
    try {
      let fc: AnyFeatureCollection;
      if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
        const text = await file.text();
        fc = normalizeFeatureCollection(JSON.parse(text));
      } else if (fileName.endsWith(".zip")) {
        const buffer = await file.arrayBuffer();
        const shpData = (await shp(buffer)) as unknown;
        if (Array.isArray(shpData)) {
          const merged = shpData.flatMap((item) => normalizeFeatureCollection(item).features);
          fc = { type: "FeatureCollection", features: merged };
        } else {
          fc = normalizeFeatureCollection(shpData);
        }
      } else if (fileName.endsWith(".gml") || fileName.endsWith(".xml")) {
        const text = await file.text();
        fc = parseGmlToFeatureCollection(text);
      } else {
        throw new Error("仅支持 .geojson/.json/.zip(.shp)/.gml/.xml");
      }

      setDataset(fc);
      setAnalysisResult(null);
      appendLog(`导入成功：${file.name}（${fc.features.length} 个要素）`);
    } catch (error) {
      appendLog(`导入失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setBusy(false);
    }
  };

  const runBuffer = () => {
    try {
      const buffered = turf.buffer(dataset as never, bufferKm, { units: "kilometers" }) as unknown;
      setAnalysisResult(normalizeFeatureCollection(buffered));
      appendLog(`缓冲区分析完成：${bufferKm.toFixed(2)}km`);
    } catch {
      appendLog("缓冲区分析失败：当前数据可能不支持该操作");
    }
  };

  const runIntersect = () => {
    try {
      const polygons = dataset.features.filter((feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon");
      if (polygons.length < 2) {
        appendLog("相交分析跳过：至少需要两个面要素");
        return;
      }
      const result = turf.intersect(turf.featureCollection([polygons[0] as never, polygons[1] as never]) as never) as unknown;
      if (!result) {
        appendLog("相交分析完成：两个面无重叠区域");
        setAnalysisResult({ type: "FeatureCollection", features: [] });
        return;
      }
      setAnalysisResult(normalizeFeatureCollection(result));
      appendLog("相交分析完成：已输出重叠区域");
    } catch {
      appendLog("相交分析失败：请检查面要素几何是否有效");
    }
  };

  const runPointInPolygon = () => {
    try {
      const point = dataset.features.find((feature) => feature.geometry?.type === "Point");
      const polygon = dataset.features.find((feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon");
      if (!point || !polygon) {
        appendLog("点面判断跳过：需要至少 1 个点和 1 个面");
        return;
      }
      const inside = turf.booleanPointInPolygon(point as never, polygon as never);
      appendLog(`点面判断完成：${inside ? "点位在面内" : "点位在面外"}`);
      setAnalysisResult({ type: "FeatureCollection", features: [point, polygon] });
    } catch {
      appendLog("点面判断失败");
    }
  };

  const runNearestAndDistance = () => {
    try {
      const points = dataset.features.filter((feature) => feature.geometry?.type === "Point");
      if (points.length < 2) {
        appendLog("最近点/距离分析跳过：至少需要两个点");
        return;
      }
      const origin = points[0];
      const rest = turf.featureCollection(points.slice(1) as never);
      const nearest = turf.nearestPoint(origin as never, rest as never) as AnyFeature;
      const distance = turf.distance(origin as never, nearest as never, { units: "kilometers" });
      appendLog(`最近点分析完成：最近距离 ${distance.toFixed(3)} km`);
      setAnalysisResult({ type: "FeatureCollection", features: [origin, nearest] });
    } catch {
      appendLog("最近点/距离分析失败");
    }
  };

  const exportGeoJson = () => {
    const output = analysisResult || dataset;
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geo-lab-result.geojson";
    a.click();
    URL.revokeObjectURL(url);
    appendLog("结果导出完成：geo-lab-result.geojson");
  };

  const runDemoScript = async () => {
    if (isDemoRunning) return;
    demoStoppedRef.current = false;
    setIsDemoRunning(true);
    setDataset(sampleFeatureCollection);
    setAnalysisResult(null);
    appendLog("案例脚本启动：将自动演示完整链路");

    const breakIfStopped = () => demoStoppedRef.current;

    await sleep(900);
    if (breakIfStopped()) return setIsDemoRunning(false);
    appendLog("[Step1] 数据准备完成：已载入示例园区数据");

    await sleep(1000);
    if (breakIfStopped()) return setIsDemoRunning(false);
    setBufferKm(0.8);
    runBuffer();
    appendLog("[Step2] 执行缓冲区分析，模拟服务覆盖范围");

    await sleep(1300);
    if (breakIfStopped()) return setIsDemoRunning(false);
    setAnalysisResult(null);
    runIntersect();
    appendLog("[Step3] 执行相交分析，识别重叠区域");

    await sleep(1200);
    if (breakIfStopped()) return setIsDemoRunning(false);
    runPointInPolygon();
    appendLog("[Step4] 执行点面判断，确认站点归属");

    await sleep(1100);
    if (breakIfStopped()) return setIsDemoRunning(false);
    runNearestAndDistance();
    appendLog("[Step5] 执行最近点/距离分析，输出最短服务距离");

    await sleep(900);
    if (breakIfStopped()) return setIsDemoRunning(false);
    appendLog("案例脚本完成：可点击“导出当前结果 GeoJSON”进行成果提交");
    setIsDemoRunning(false);
  };

  const stopDemoScript = () => {
    demoStoppedRef.current = true;
    setIsDemoRunning(false);
    appendLog("案例脚本已手动暂停");
  };

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 via-slate-900 to-indigo-500/20 p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Spatial Capability Demo</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">空间分析实验室</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/75 sm:text-base">
            使用 Turf.js 做缓冲区/相交/点面判断/最近点分析，支持 GeoJSON、Shapefile(.zip)、GML 导入，结果可导出，并通过 MapLibre + Three.js 进行 2D/3D 可视化。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void runDemoScript()}
              disabled={isDemoRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/25 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              运行案例脚本
            </button>
            <button
              type="button"
              onClick={stopDemoScript}
              disabled={!isDemoRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Pause className="h-4 w-4" />
              暂停脚本
            </button>
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="h-4 w-4 text-cyan-300" /> 数据接入
              </p>
              <button
                type="button"
                onClick={() => {
                  setDataset(sampleFeatureCollection);
                  setAnalysisResult(null);
                  appendLog("已切换回示例数据集");
                }}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                加载示例
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-300/30 bg-cyan-500/5 px-4 py-3 text-sm text-white/80 hover:bg-cyan-500/10">
              <FileJson className="h-4 w-4 text-cyan-300" />
              <span>{busy ? "正在导入..." : "上传 GeoJSON / ZIP(Shapefile) / GML"}</span>
              <input
                className="hidden"
                type="file"
                accept=".geojson,.json,.zip,.gml,.xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/60">要素总数</p>
                <p className="mt-1 text-lg text-white">{overview.count}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 sm:col-span-2">
                <p className="text-xs text-white/60">几何类型</p>
                <p className="mt-1 text-sm text-white/90">{Object.entries(overview.typeStat).map(([k, v]) => `${k}:${v}`).join(" / ")}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/60">边界框</p>
                <p className="mt-1 text-xs text-white/90">[{overview.bboxValue.map((v) => v.toFixed(3)).join(", ")}]</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-fuchsia-300" /> 操作日志
            </p>
            <div className="mt-3 h-[180px] space-y-2 overflow-auto rounded-xl bg-black/25 p-3">
              {logs.map((log) => (
                <p key={log} className="text-xs text-white/80">
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-2">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <FlaskConical className="h-4 w-4 text-emerald-300" /> 空间分析工具（Turf.js）
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/70">Buffer (km)</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[0.3, 0.6, 0.8, 1.2].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBufferKm(v)}
                      className={`rounded-md px-2 py-0.5 text-[11px] ${Math.abs(bufferKm - v) < 0.05 ? "bg-cyan-400/30 text-cyan-100" : "bg-white/10 text-white/70"}`}
                    >
                      {v}km
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={bufferKm}
                  onChange={(e) => setBufferKm(Number(e.target.value))}
                  className="mt-2 w-full"
                />
                <button
                  type="button"
                  onClick={runBuffer}
                  className="mt-2 w-full rounded-lg bg-cyan-500/25 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/35"
                >
                  执行缓冲区
                </button>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/70">Intersect</p>
                <button
                  type="button"
                  onClick={runIntersect}
                  className="mt-8 w-full rounded-lg bg-indigo-500/25 px-3 py-1.5 text-xs text-indigo-100 hover:bg-indigo-500/35"
                >
                  执行相交
                </button>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/70">Point in Polygon</p>
                <button
                  type="button"
                  onClick={runPointInPolygon}
                  className="mt-8 w-full rounded-lg bg-fuchsia-500/25 px-3 py-1.5 text-xs text-fuchsia-100 hover:bg-fuchsia-500/35"
                >
                  点面判断
                </button>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/70">Nearest + Distance</p>
                <button
                  type="button"
                  onClick={runNearestAndDistance}
                  className="mt-8 w-full rounded-lg bg-emerald-500/25 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/35"
                >
                  最近点分析
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <Download className="h-4 w-4 text-amber-300" /> 结果输出
            </p>
            <button
              type="button"
              onClick={exportGeoJson}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 px-4 py-2.5 text-sm text-amber-100 hover:from-amber-500/40 hover:to-orange-500/40"
            >
              导出当前结果 GeoJSON
            </button>
            <p className="mt-3 text-xs text-white/65">导出优先使用分析结果图层；若无分析结果，则导出当前原始数据。</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-white">
              <Radar className="h-4 w-4 text-cyan-300" /> 2D 可视化预览（MapLibre）
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setResultMode("auto")}
                className={`rounded-md px-2 py-1 text-[11px] ${resultMode === "auto" ? "bg-indigo-400/30 text-indigo-100" : "bg-white/10 text-white/75"}`}
              >
                自动图层
              </button>
              <button
                type="button"
                onClick={() => setResultMode("raw")}
                className={`rounded-md px-2 py-1 text-[11px] ${resultMode === "raw" ? "bg-indigo-400/30 text-indigo-100" : "bg-white/10 text-white/75"}`}
              >
                原始数据
              </button>
              <button
                type="button"
                onClick={() => setResultMode("analysis")}
                className={`rounded-md px-2 py-1 text-[11px] ${resultMode === "analysis" ? "bg-indigo-400/30 text-indigo-100" : "bg-white/10 text-white/75"}`}
              >
                分析结果
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {[
              { key: "polygon", label: "面" },
              { key: "line", label: "线" },
              { key: "point", label: "点" },
            ].map((item) => {
              const active = layerVisibility[item.key as keyof LayerVisibility];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setLayerVisibility((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof LayerVisibility],
                    }))
                  }
                  className={`rounded-md px-2 py-1 text-[11px] ${active ? "bg-emerald-400/30 text-emerald-100" : "bg-white/10 text-white/75"}`}
                >
                  {item.label}图层
                </button>
              );
            })}
          </div>
          <MapLibrePreview dataset={displayLayer} layerVisibility={layerVisibility} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Layers3 className="h-4 w-4 text-violet-300" /> WebGL 3D 预览（Three.js 面挤出）
          </p>
          <ThreePreview dataset={displayLayer} />
        </div>
      </div>
    </div>
  );
}
