export type MapLayerId = "watercolor" | "voyager" | "terrain";

export interface MapLayer {
  id: MapLayerId;
  name: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  labelUrl?: string;
}

export const MAP_LAYERS: Record<MapLayerId, MapLayer> = {
  watercolor: {
    id: "watercolor",
    name: "Watercolor",
    description: "Painted paper, the cutest journal look",
    url: "https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg",
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, hosted by <a href="https://www.cooperhewitt.org/">Cooper Hewitt</a> · © OpenStreetMap',
    maxZoom: 16,
    labelUrl:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
  },
  voyager: {
    id: "voyager",
    name: "Voyager",
    description: "Clean warm streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    maxZoom: 20,
    subdomains: "abcd",
  },
  terrain: {
    id: "terrain",
    name: "Terrain",
    description: "Illustrated hills and parks",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles © Esri, Esri, DeLorme, NAVTEQ, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    maxZoom: 19,
  },
};

export const DEFAULT_MAP_LAYER: MapLayerId = "terrain";

export const MAP_LAYER_ORDER: MapLayerId[] = ["terrain", "watercolor", "voyager"];
export const MAP_LAYER_STORAGE_KEY = "our-atlas-map-layer";

export function getStoredMapLayer(): MapLayerId {
  if (typeof window === "undefined") return DEFAULT_MAP_LAYER;
  const stored = localStorage.getItem(MAP_LAYER_STORAGE_KEY) as MapLayerId | null;
  return stored && stored in MAP_LAYERS ? stored : DEFAULT_MAP_LAYER;
}
