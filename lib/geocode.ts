export interface GeocodeResult {
  lat: number;
  lng: number;
  placeName: string;
  address: string;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  highway?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  amenity?: string;
  shop?: string;
  tourism?: string;
  leisure?: string;
  office?: string;
  historic?: string;
  craft?: string;
  building?: string;
  railway?: string;
  [key: string]: string | undefined;
}

interface NominatimHit {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
}

const POI_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "historic",
  "craft",
  "building",
  "railway",
] as const;

function isHouseNumberName(name: string): boolean {
  return /^\d+[A-Za-z]?$/.test(name.trim());
}

function streetLine(address: NominatimAddress): string {
  const road =
    address.road || address.pedestrian || address.footway || address.highway;
  return [address.house_number, road].filter(Boolean).join(" ");
}

export function parseNominatimHit(item: NominatimHit): GeocodeResult {
  const address = item.address ?? {};
  const fullAddress = item.display_name.trim();
  const poiName = POI_KEYS.map((key) => address[key]).find(
    (value) => value && value.trim()
  );
  const named = item.name?.trim() ?? "";
  const street = streetLine(address);

  let placeName = "";
  if (poiName) {
    placeName = poiName;
  } else if (named && !isHouseNumberName(named)) {
    placeName = named;
  } else if (street) {
    placeName = street;
  } else {
    placeName = fullAddress.split(",")[0]?.trim() || fullAddress;
  }

  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    placeName,
    address: fullAddress,
  };
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "OurAtlas/1.0",
      },
    }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as NominatimHit[];

  return data.map(parseNominatimHit);
}
