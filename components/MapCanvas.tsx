"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from "leaflet";
import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS } from "@/lib/types";
import { THEME } from "@/lib/themes";
import { AUCKLAND_CENTER } from "@/lib/sample-data";
import {
  DEFAULT_MAP_LAYER,
  getStoredMapLayer,
  MAP_LAYER_STORAGE_KEY,
  MAP_LAYERS,
  type MapLayerId,
} from "@/lib/map-layers";
import type { TileLayer } from "leaflet";

type LeafletNS = typeof import("leaflet");

let leafletModule: LeafletNS | null = null;

async function loadLeaflet(): Promise<LeafletNS> {
  if (leafletModule) return leafletModule;
  const mod = await import("leaflet");
  leafletModule = (mod.default ?? mod) as LeafletNS;
  return leafletModule;
}

interface MapCanvasProps {
  memories: Memory[];
  selectedId?: string | null;
  onSelectMemory?: (memory: Memory) => void;
  onMapClick?: (lat: number, lng: number) => void;
  flyToId?: string | null;
  /** Extra bottom offset (px) for controls when a bottom sheet is open */
  controlsOffset?: number;
}

export function MapCanvas({
  memories,
  selectedId,
  onSelectMemory,
  onMapClick,
  flyToId,
  controlsOffset = 0,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineRef = useRef<LeafletPolyline | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const onMapClickRef = useRef(onMapClick);
  const onSelectRef = useRef(onSelectMemory);
  const [mapReady, setMapReady] = useState(false);
  const [layerId, setLayerId] = useState<MapLayerId>(DEFAULT_MAP_LAYER);
  const baseLayerRef = useRef<TileLayer | null>(null);
  const labelLayerRef = useRef<TileLayer | null>(null);
  onMapClickRef.current = onMapClick;
  onSelectRef.current = onSelectMemory;

  const applyLayer = useCallback((id: MapLayerId) => {
    const map = mapRef.current;
    const L = leafletModule;
    if (!map || !L) return;

    const spec = MAP_LAYERS[id];
    baseLayerRef.current?.remove();
    labelLayerRef.current?.remove();

    const tiles = L.tileLayer(spec.url, {
      attribution: spec.attribution,
      maxZoom: spec.maxZoom,
      ...(spec.subdomains ? { subdomains: spec.subdomains } : {}),
    }).addTo(map);
    baseLayerRef.current = tiles;

    if (spec.labelUrl) {
      labelLayerRef.current = L.tileLayer(spec.labelUrl, {
        subdomains: "abcd",
        maxZoom: 20,
        pane: "overlayPane",
        opacity: 0.85,
      }).addTo(map);
    }

    tiles.on("load", () => {
      console.log("[atlas:map] tiles loaded", id);
    });

    console.log("[atlas:map] layer", id);
  }, []);

  const selectLayer = useCallback(
    (id: MapLayerId) => {
      setLayerId(id);
      localStorage.setItem(MAP_LAYER_STORAGE_KEY, id);
      applyLayer(id);
    },
    [applyLayer]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.warn("[atlas:map] no container on init");
      return;
    }

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let createdMap: LeafletMap | null = null;
    let onResize: (() => void) | null = null;

    container.style.width = `${window.innerWidth}px`;
    container.style.height = `${window.innerHeight}px`;
    console.log("[atlas:map] container px", {
      w: container.offsetWidth,
      h: container.offsetHeight,
      inner: [window.innerWidth, window.innerHeight],
    });

    (async () => {
      try {
        const L = await loadLeaflet();
        if (disposed || !containerRef.current) {
          console.log("[atlas:map] skipped create, disposed after import");
          return;
        }

        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([AUCKLAND_CENTER.lat, AUCKLAND_CENTER.lng], AUCKLAND_CENTER.zoom);

        const initialLayer = getStoredMapLayer();
        setLayerId(initialLayer);
        mapRef.current = map;
        applyLayer(initialLayer);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const line = L.polyline([], {
          color: THEME.colors.line,
          weight: 2,
          opacity: 0.8,
          dashArray: "6 8",
        }).addTo(map);

        map.on("click", (event) => {
          onMapClickRef.current?.(event.latlng.lat, event.latlng.lng);
        });

        if (disposed) {
          map.remove();
          return;
        }

        createdMap = map;
        lineRef.current = line;
        setMapReady(true);

        const size = map.getSize();
        console.log("[atlas:map] created", { x: size.x, y: size.y, zoom: map.getZoom() });

        const refreshSize = () => {
          if (!containerRef.current || disposed) return;
          containerRef.current.style.width = `${window.innerWidth}px`;
          containerRef.current.style.height = `${window.innerHeight}px`;
          map.invalidateSize();
          const next = map.getSize();
          console.log("[atlas:map] invalidateSize", { x: next.x, y: next.y });
        };

        onResize = refreshSize;
        requestAnimationFrame(refreshSize);
        window.setTimeout(refreshSize, 50);
        window.setTimeout(refreshSize, 300);
        window.addEventListener("resize", refreshSize);

        resizeObserver = new ResizeObserver(refreshSize);
        resizeObserver.observe(containerRef.current);
      } catch (error) {
        console.error("[atlas:map] init failed", error);
      }
    })();

    return () => {
      disposed = true;
      if (onResize) window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
      createdMap?.remove();
      if (mapRef.current === createdMap) {
        mapRef.current = null;
        lineRef.current = null;
      }
      console.log("[atlas:map] cleanup");
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    console.log("[atlas:map] markers effect", {
      mapReady,
      hasMap: Boolean(map),
      count: memories.length,
    });
    if (!mapReady || !map || !leafletModule) return;

    const L = leafletModule;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const memory of memories) {
      const color = THEME.markerColors[memory.type];
      const isSelected = memory.id === selectedId;
      const size = isSelected ? 36 : 28;
      const icon = L.divIcon({
        className: "memory-marker-wrap",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<button type="button" class="memory-marker" style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${color};color:#fff;border:2px solid #FFFCF7;
            font-size:${isSelected ? 14 : 11}px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
          ">${MILESTONE_ICONS[memory.type]}</button>`,
      });

      const marker = L.marker([memory.lat, memory.lng], { icon }).addTo(map);
      marker.on("click", () => onSelectRef.current?.(memory));
      markersRef.current.set(memory.id, marker);
    }

    const sorted = [...memories].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    lineRef.current?.setLatLngs(sorted.map((memory) => [memory.lat, memory.lng]));
  }, [memories, selectedId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToId) return;
    const memory = memories.find((item) => item.id === flyToId);
    if (memory) {
      map.flyTo([memory.lat, memory.lng], 12, { duration: 1.2 });
    }
  }, [flyToId, memories]);

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || !leafletModule || memories.length === 0) return;
    if (memories.length === 1) {
      map.flyTo([memories[0].lat, memories[0].lng], 12, { duration: 1 });
      return;
    }
    const bounds = leafletModule.latLngBounds(
      memories.map((memory) => [memory.lat, memory.lng])
    );
    map.fitBounds(bounds, { padding: [80, 80], animate: true });
  }, [memories]);

  const goHome = useCallback(() => {
    mapRef.current?.flyTo(
      [AUCKLAND_CENTER.lat, AUCKLAND_CENTER.lng],
      AUCKLAND_CENTER.zoom,
      { duration: 1 }
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        ref={containerRef}
        className="map-container pointer-events-auto absolute inset-0"
      />
      <div
        className="pointer-events-auto absolute left-4 z-[1000] flex flex-col gap-2 transition-[bottom] duration-300"
        style={{
          bottom: `max(calc(1.5rem + ${controlsOffset}px), calc(env(safe-area-inset-bottom) + ${controlsOffset}px))`,
        }}
      >
        <div
          className="flex flex-wrap gap-1 rounded-full border p-1 shadow-md"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
          }}
        >
          {(Object.keys(MAP_LAYERS) as MapLayerId[]).map((id) => {
            const active = layerId === id;
            return (
              <button
                key={id}
                onClick={() => selectLayer(id)}
                className="rounded-full px-3 py-1.5 text-[11px] font-medium"
                style={{
                  backgroundColor: active ? "var(--theme-accent)" : "transparent",
                  color: active ? "#fff" : "var(--theme-ink-muted)",
                  fontFamily: "var(--font-label)",
                }}
              >
                {MAP_LAYERS[id].name}
              </button>
            );
          })}
        </div>
        <button
          onClick={goHome}
          className="rounded-lg px-3 py-2 text-xs font-medium shadow-md"
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
            className="rounded-lg px-3 py-2 text-xs font-medium shadow-md"
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
