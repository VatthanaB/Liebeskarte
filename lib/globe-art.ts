const LAND_COLORS = [
  "#c9d6a4",
  "#e3d2a4",
  "#d7c49a",
  "#b7c99a",
  "#e8c9a8",
  "#cbb896",
  "#d5e0b4",
];

export const GLOBE_CLOUDS = [
  { lat: 28, lng: 165, size: 54 },
  { lat: 12, lng: 42, size: 40 },
  { lat: -18, lng: 88, size: 46 },
  { lat: 42, lng: -30, size: 38 },
  { lat: -32, lng: -120, size: 44 },
  { lat: 8, lng: -150, size: 36 },
  { lat: 55, lng: 120, size: 32 },
];

export function landColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return LAND_COLORS[hash % LAND_COLORS.length];
}

export function createWatercolorOcean(): string {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "#eaf4ee");
  wash.addColorStop(0.16, "#b7ddd8");
  wash.addColorStop(0.5, "#86c6cb");
  wash.addColorStop(0.84, "#b7ddd8");
  wash.addColorStop(1, "#eaf4ee");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 50 + Math.random() * 200;
    const blot = ctx.createRadialGradient(x, y, 0, x, y, radius);
    blot.addColorStop(0, `rgba(96, 168, 166, ${0.07 + Math.random() * 0.12})`);
    blot.addColorStop(1, "rgba(96, 168, 166, 0)");
    ctx.fillStyle = blot;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const image = ctx.getImageData(0, 0, width, height);
  const pixels = image.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const grain = (Math.random() - 0.5) * 16;
    pixels[i] = clampByte(pixels[i] + grain);
    pixels[i + 1] = clampByte(pixels[i + 1] + grain);
    pixels[i + 2] = clampByte(pixels[i + 2] + grain);
  }
  ctx.putImageData(image, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.82);
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}

export function createCloudElement(size: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "globe-cloud";
  el.style.width = `${size}px`;
  el.innerHTML = `<svg viewBox="0 0 72 40" aria-hidden="true">
    <path d="M18 30c-7 0-12-4-12-10s6-10 12-9c2-7 10-11 17-8 3-5 11-7 17-4 7 1 12 7 12 14 0 8-7 13-16 13H18z"
      fill="#FFFCF7" stroke="#3D3229" stroke-width="2.2" stroke-linejoin="round"/>
  </svg>`;
  return el;
}
