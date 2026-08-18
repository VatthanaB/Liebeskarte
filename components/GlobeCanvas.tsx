"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";
import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS } from "@/lib/types";
import { THEME } from "@/lib/themes";
import { AUCKLAND_CENTER } from "@/lib/sample-data";
import {
  GLOBE_CLOUDS,
  createCloudElement,
  createWatercolorOcean,
  landColorForName,
} from "@/lib/globe-art";

interface GlobeCanvasProps {
  memories: Memory[];
  selectedId?: string | null;
  onSelectMemory?: (memory: Memory) => void;
  onMapClick?: (lat: number, lng: number) => void;
  flyToId?: string | null;
}

type CountryFeature = {
  properties?: { NAME?: string; ADMIN?: string };
  geometry?: unknown;
};

type GlobeHtmlItem =
  | { kind: "memory"; lat: number; lng: number; memory: Memory }
  | { kind: "cloud"; lat: number; lng: number; size: number };

function buildArcs(memories: Memory[]) {
  const sorted = [...memories].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.slice(0, -1).map((memory, index) => ({
    startLat: memory.lat,
    startLng: memory.lng,
    endLat: sorted[index + 1].lat,
    endLng: sorted[index + 1].lng,
  }));
}

function fitAltitude(memories: Memory[]): number {
  if (memories.length <= 1) return 1.8;

  const lats = memories.map((memory) => memory.lat);
  const lngs = memories.map((memory) => memory.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const span = Math.max(latSpan, lngSpan, 0.5);

  return Math.min(Math.max(span * 0.35 + 1.2, 1.6), 3.5);
}

function centroid(memories: Memory[]) {
  const lat =
    memories.reduce((sum, memory) => sum + memory.lat, 0) / memories.length;
  const lng =
    memories.reduce((sum, memory) => sum + memory.lng, 0) / memories.length;
  return { lat, lng };
}

function createMemoryMarker(memory: Memory, selected: boolean): HTMLButtonElement {
  const color = THEME.markerColors[memory.type];
  const size = selected ? 42 : 34;
  const el = document.createElement("button");
  el.type = "button";
  el.className = `globe-memory-marker${selected ? " globe-memory-marker--selected" : ""}`;
  el.setAttribute("aria-label", memory.title);
  el.style.setProperty("--marker-color", color);
  el.style.setProperty("--marker-size", `${size}px`);
  el.innerHTML = `<span class="globe-memory-marker__icon">${MILESTONE_ICONS[memory.type]}</span>`;
  return el;
}

export function GlobeCanvas({
  memories,
  selectedId,
  onSelectMemory,
  onMapClick,
  flyToId,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const userInteractingRef = useRef(false);
  const selectedIdRef = useRef(selectedId);
  const onMapClickRef = useRef(onMapClick);
  const onSelectRef = useRef(onSelectMemory);
  const [globeReady, setGlobeReady] = useState(false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    onMapClickRef.current = onMapClick;
    onSelectRef.current = onSelectMemory;
  });

  const syncAutoRotate = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate =
      !selectedIdRef.current && !userInteractingRef.current;
    controls.autoRotateSpeed = 0.45;
  }, []);

  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const GlobeModule = await import("globe.gl");
        const Globe = GlobeModule.default;
        if (cancelled || !containerRef.current || globeRef.current) return;

        const handleGlobeClick = (coords: { lat: number; lng: number }) => {
          onMapClickRef.current?.(coords.lat, coords.lng);
        };

        const globe = new Globe(containerRef.current, {
          rendererConfig: { alpha: true, antialias: true },
        })
          .globeImageUrl(createWatercolorOcean())
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(true)
          .atmosphereColor("#f3c9a8")
          .atmosphereAltitude(0.22)
          .showGraticules(false)
          .htmlLat("lat")
          .htmlLng("lng")
          .htmlAltitude((item) =>
            (item as GlobeHtmlItem).kind === "cloud" ? 0.2 : 0.03
          )
          .arcColor(() => THEME.colors.accent)
          .arcStroke(0.55)
          .arcDashLength(0.18)
          .arcDashGap(0.1)
          .arcDashAnimateTime(3800)
          .polygonCapColor((feature) => {
            const country = feature as CountryFeature;
            const name = country.properties?.NAME ?? country.properties?.ADMIN ?? "land";
            return landColorForName(name);
          })
          .polygonSideColor(() => "rgba(92, 74, 58, 0.28)")
          .polygonStrokeColor(() => "#5c4a3a")
          .polygonAltitude(0.007)
          .polygonsTransitionDuration(0)
          .ringColor(() => (t: number) => `rgba(196, 112, 75, ${1 - t})`)
          .ringMaxRadius(4)
          .ringPropagationSpeed(2.4)
          .ringRepeatPeriod(1400)
          .onGlobeClick(handleGlobeClick)
          .onPolygonClick((_polygon, _event, coords) => {
            handleGlobeClick(coords);
          });

        const material = globe.globeMaterial() as {
          shininess: number;
          emissiveIntensity: number;
          emissive: { set: (color: string) => void };
        };
        material.shininess = 4;
        material.emissive.set("#86c0c4");
        material.emissiveIntensity = 0.18;

        globe.pointOfView(
          {
            lat: AUCKLAND_CENTER.lat,
            lng: AUCKLAND_CENTER.lng,
            altitude: 2.2,
          },
          0
        );

        const controls = globe.controls();
        controls.enablePan = false;
        controls.minDistance = 180;
        controls.maxDistance = 600;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45;

        controls.addEventListener("start", () => {
          userInteractingRef.current = true;
          syncAutoRotate();
        });
        controls.addEventListener("end", () => {
          userInteractingRef.current = false;
          syncAutoRotate();
        });

        const countriesResponse = await fetch("/globe/countries.geojson");
        const countries = (await countriesResponse.json()) as {
          features: CountryFeature[];
        };
        if (cancelled) {
          globe._destructor();
          return;
        }
        globe.polygonsData(countries.features);

        globeRef.current = globe;
        if (!cancelled) setGlobeReady(true);

        const updateSize = () => {
          if (!containerRef.current) return;
          globe
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight);
        };

        updateSize();
        resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(containerRef.current);
      } catch (error) {
        console.error("[atlas:globe] init failed", error);
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      globeRef.current?._destructor();
      globeRef.current = null;
    };
  }, [syncAutoRotate]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globeReady || !globe) return;

    const htmlItems: GlobeHtmlItem[] = [
      ...GLOBE_CLOUDS.map((cloud) => ({ kind: "cloud" as const, ...cloud })),
      ...memories.map((memory) => ({
        kind: "memory" as const,
        lat: memory.lat,
        lng: memory.lng,
        memory,
      })),
    ];

    const selected = memories.find((memory) => memory.id === selectedId);

    globe
      .htmlElementsData(htmlItems)
      .htmlElement((item) => {
        const data = item as GlobeHtmlItem;
        if (data.kind === "cloud") {
          return createCloudElement(data.size);
        }

        const el = createMemoryMarker(
          data.memory,
          data.memory.id === selectedIdRef.current
        );
        el.onclick = (event) => {
          event.stopPropagation();
          onSelectRef.current?.(data.memory);
        };
        return el;
      })
      .htmlElementVisibilityModifier((el, isVisible) => {
        el.style.opacity = isVisible ? "1" : "0";
        if (!el.classList.contains("globe-cloud")) {
          el.style.pointerEvents = isVisible ? "auto" : "none";
        }
      })
      .arcsData(buildArcs(memories))
      .ringsData(
        selected ? [{ lat: selected.lat, lng: selected.lng }] : []
      );

    syncAutoRotate();
  }, [memories, selectedId, globeReady, syncAutoRotate]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !flyToId) return;

    const memory = memories.find((item) => item.id === flyToId);
    if (memory) {
      globe.pointOfView(
        { lat: memory.lat, lng: memory.lng, altitude: 1.6 },
        1200
      );
    }
  }, [flyToId, memories]);

  const fitAll = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || memories.length === 0) return;

    if (memories.length === 1) {
      globe.pointOfView(
        { lat: memories[0].lat, lng: memories[0].lng, altitude: 1.6 },
        1200
      );
      return;
    }

    const center = centroid(memories);
    globe.pointOfView(
      { lat: center.lat, lng: center.lng, altitude: fitAltitude(memories) },
      1200
    );
  }, [memories]);

  const goHome = useCallback(() => {
    globeRef.current?.pointOfView(
      {
        lat: AUCKLAND_CENTER.lat,
        lng: AUCKLAND_CENTER.lng,
        altitude: 2.2,
      },
      1200
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        ref={containerRef}
        className="globe-container pointer-events-auto absolute inset-0"
      />
      <div className="globe-doodles" aria-hidden="true">
        <span className="globe-doodle globe-doodle--a">✦</span>
        <span className="globe-doodle globe-doodle--b">♡</span>
        <span className="globe-doodle globe-doodle--c">★</span>
        <span className="globe-doodle globe-doodle--d">✦</span>
        <span className="globe-doodle globe-doodle--e">♡</span>
      </div>
      <div
        className="pointer-events-auto absolute left-4 z-[1000] flex flex-col gap-2"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={goHome}
          className="rounded-lg px-3 py-2 text-xs font-medium shadow-md backdrop-blur-md"
          style={{
            backgroundColor: "var(--theme-surface)",
            color: "var(--theme-ink)",
            border: "1px solid var(--theme-border)",
            fontFamily: "var(--font-label)",
          }}
        >
          Auckland
        </button>
        {memories.length > 0 && (
          <button
            onClick={fitAll}
            className="rounded-lg px-3 py-2 text-xs font-medium shadow-md backdrop-blur-md"
            style={{
              backgroundColor: "var(--theme-surface)",
              color: "var(--theme-ink)",
              border: "1px solid var(--theme-border)",
              fontFamily: "var(--font-label)",
            }}
          >
            Fit all
          </button>
        )}
      </div>
    </div>
  );
}
