import type { MilestoneType } from "./types";

export interface ThemeTokens {
  name: string;
  description: string;
  fonts: {
    display: string;
    body: string;
    label: string;
  };
  colors: {
    bg: string;
    surface: string;
    ink: string;
    inkMuted: string;
    accent: string;
    accentLight: string;
    border: string;
    line: string;
  };
  mapStyle: string;
  markerColors: Record<MilestoneType, string>;
  cardClass: string;
  markerClass: string;
}

export const THEME: ThemeTokens = {
  name: "Warm Atelier",
  description: "Travel journal — cream paper, terracotta, taped photos",
  fonts: {
    display: "var(--font-playfair), Georgia, serif",
    body: "var(--font-source-serif), Georgia, serif",
    label: "var(--font-source-sans), system-ui, sans-serif",
  },
  colors: {
    bg: "#F5F0E8",
    surface: "#FFFCF7",
    ink: "#3D3229",
    inkMuted: "#7A6E63",
    accent: "#C4704B",
    accentLight: "#F0E4D8",
    border: "#E8DFD0",
    line: "#C4704B",
  },
  mapStyle: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  markerColors: {
    met: "#C4704B",
    date: "#6B8F71",
    trip: "#8B7355",
    home: "#5C4A3A",
    celebration: "#C4704B",
    custom: "#7A6E63",
  },
  cardClass: "border border-[#E8DFD0] shadow-md",
  markerClass: "ring-2 ring-[#FFFCF7]",
};

export function themeToCssVars(theme: ThemeTokens = THEME): Record<string, string> {
  return {
    "--theme-bg": theme.colors.bg,
    "--theme-surface": theme.colors.surface,
    "--theme-ink": theme.colors.ink,
    "--theme-ink-muted": theme.colors.inkMuted,
    "--theme-accent": theme.colors.accent,
    "--theme-accent-light": theme.colors.accentLight,
    "--theme-border": theme.colors.border,
    "--theme-line": theme.colors.line,
    "--font-display": theme.fonts.display,
    "--font-body": theme.fonts.body,
    "--font-label": theme.fonts.label,
  };
}
