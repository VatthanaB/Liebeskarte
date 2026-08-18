"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from "leaflet";
import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS } from "@/lib/types";
import { sharedMemories } from "@/lib/memory-visibility";
import { THEME } from "@/lib/themes";
import { AUCKLAND_CENTER } from "@/lib/sample-data";
import {
  groupCenter,
  groupMemoriesByLocation,
} from "@/lib/location-groups";
import {
  DEFAULT_MAP_LAYER,
  getStoredMapLayer,
  MAP_LAYER_ORDER,
  MAP_LAYER_STORAGE_KEY,
  MAP_LAYERS,
  type MapLayerId,
} from "@/lib/map-layers";
import type { TileLayer } from "leaflet";

type LeafletNS = typeof import("leaflet");

function buildMarkerMarkup(group: Memory[], isSelected: boolean): {
  html: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
} {
  if (group.length === 1) {
    const memory = group[0];
    const color = THEME.markerColors[memory.type];
    const size = isSelected ? 36 : 28;
    return {
      width: size,
      height: size,
      anchorX: size / 2,
      anchorY: size / 2,
      html: `<button type="button" class="memory-marker" aria-label="${escapeHtml(memory.title)}" style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${color};color:#fff;border:2px solid #FFFCF7;
            font-size:${isSelected ? 14 : 11}px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
          ">${MILESTONE_ICONS[memory.type]}</button>`,
    };
  }

  const newest = group[group.length - 1];
  const color = THEME.markerColors[newest.type];
  const count = group.length;
  const size = isSelected ? 36 : 32;

  return {
    width: size,
    height: size,
    anchorX: size / 2,
    anchorY: size / 2,
    html: `<button type="button" class="memory-marker memory-marker--cluster${isSelected ? " memory-marker--selected" : ""}" aria-label="${count} memories at this place" style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${color};color:#fff;border:2px solid #FFFCF7;
            font-size:${isSelected ? 15 : 13}px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.28);font-weight:700;
            font-family:system-ui,sans-serif;
          ">${count}</button>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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
          attributionControl: false,
        }).setView([AUCKLAND_CENTER.lat, AUCKLAND_CENTER.lng], AUCKLAND_CENTER.zoom);

        const initialLayer = getStoredMapLayer();
        setLayerId(initialLayer);
        mapRef.current = map;
        applyLayer(initialLayer);

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

    const groups = groupMemoriesByLocation(memories);

    for (const group of groups) {
      const latest = group[group.length - 1];
      const center = groupCenter(group);
      const isSelected = group.some((memory) => memory.id === selectedId);
      const { html, width, height, anchorX, anchorY } = buildMarkerMarkup(
        group,
        isSelected
      );
      const icon = L.divIcon({
        className: `memory-marker-wrap${isSelected ? " memory-marker-wrap--selected" : ""}`,
        iconSize: [width, height],
        iconAnchor: [anchorX, anchorY],
        html,
      });

      const marker = L.marker([center.lat, center.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : group.length > 1 ? 200 : 0,
      }).addTo(map);
      marker.on("click", () => {
        const already = group.find((memory) => memory.id === selectedId);
        onSelectRef.current?.(already ?? latest);
      });
      markersRef.current.set(group.map((memory) => memory.id).join(","), marker);
    }

    const sorted = [...sharedMemories(memories)].sort(
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

  const cycleLayer = useCallback(() => {
    const index = MAP_LAYER_ORDER.indexOf(layerId);
    const next = MAP_LAYER_ORDER[(index + 1) % MAP_LAYER_ORDER.length];
    selectLayer(next);
  }, [layerId, selectLayer]);

  const controlStyle = {
    backgroundColor: "var(--theme-surface)",
    borderColor: "var(--theme-border)",
    color: "var(--theme-ink)",
    fontFamily: "var(--font-label)",
  } as const;

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        ref={containerRef}
        className="map-container pointer-events-auto absolute inset-0"
      />
      <div
        className="pointer-events-auto absolute left-4 z-[1000] transition-[bottom] duration-300"
        style={{
          bottom: `max(calc(1.5rem + ${controlsOffset}px), calc(env(safe-area-inset-bottom) + ${controlsOffset}px))`,
        }}
      >
        <div
          className="flex items-center gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur-sm"
          style={controlStyle}
        >
          <button
            type="button"
            onClick={cycleLayer}
            className="flex h-11 min-w-11 items-center justify-center rounded-full px-2.5 transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)]"
            aria-label={`Map style: ${MAP_LAYERS[layerId].name}. Tap to change.`}
            title={MAP_LAYERS[layerId].name}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
          </button>
          <span
            className="h-4 w-px shrink-0"
            style={{ backgroundColor: "var(--theme-border)" }}
            aria-hidden
          />
          <button
            type="button"
            onClick={goHome}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)]"
            aria-label="Go to Auckland"
            title="Auckland"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
            </svg>
          </button>
          {memories.length > 0 && (
            <>
              <span
                className="h-4 w-px shrink-0"
                style={{ backgroundColor: "var(--theme-border)" }}
                aria-hidden
              />
              <button
                type="button"
                onClick={fitAll}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)]"
                aria-label="Fit all memories"
                title="Fit all"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M15 3h6v6" />
                  <path d="m21 3-7 7" />
                  <path d="M9 21H3v-6" />
                  <path d="m3 21 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
