"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";
import { PartnerIndicator } from "./PartnerIndicator";

type ViewMode = "map" | "gallery";

interface NavBarProps {
  viewMode?: ViewMode;
  onAddMemory?: () => void;
}

export function NavBar({ viewMode, onAddMemory }: NavBarProps) {
  const pathname = usePathname();
  const { signOut: signOutAuth, user } = useAuth();

  const links = [
    {
      href: "/",
      label: "Map",
      active: pathname === "/" && viewMode !== "gallery",
    },
    {
      href: "/?view=gallery",
      label: "Gallery",
      active: pathname === "/" && viewMode === "gallery",
    },
    {
      href: "/timeline",
      label: "Timeline",
      active: pathname === "/timeline",
    },
    {
      href: "/album",
      label: "Album",
      active: pathname === "/album",
    },
    {
      href: "/settings",
      label: "Settings",
      active: pathname === "/settings",
    },
  ];

  const overlayFilter =
    "drop-shadow(0 1px 2px rgba(255,252,247,0.95)) drop-shadow(0 0 6px rgba(255,252,247,0.75))";

  return (
    <>
      <nav
        className="pointer-events-auto absolute top-0 left-0 right-0 z-[1000] flex items-start justify-between gap-3 px-4 py-3 pt-[max(2rem,env(safe-area-inset-top))] md:px-6"
        style={{
          fontFamily: "var(--font-label)",
          filter: overlayFilter,
        }}
      >
        <Link
          href="/"
          className="hidden min-h-11 shrink-0 items-center text-sm tracking-wide sm:flex"
          style={{ color: "var(--theme-ink)" }}
        >
          Liebeskarte
        </Link>

        <div className="ml-auto flex max-w-full items-center justify-end gap-1">
          <div className="flex max-w-full flex-wrap items-center justify-end">
            {links.map((link) => {
              const active = link.active;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex h-11 items-center px-2 text-xs tracking-wide transition-colors"
                  style={{
                    color: active ? "var(--theme-ink)" : "var(--theme-ink-muted)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {onAddMemory && (
              <button
                type="button"
                onClick={onAddMemory}
                className="inline-flex h-11 min-w-11 items-center justify-center px-2 text-lg leading-none"
                style={{ color: "var(--theme-ink)" }}
                aria-label="Add memory"
              >
                +
              </button>
            )}
            {AUTH_ENABLED && user && (
              <button
                onClick={() => signOutAuth()}
                className="inline-flex h-11 items-center px-2 text-xs tracking-wide"
                style={{ color: "var(--theme-ink-muted)" }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>
      <div
        className="pointer-events-auto fixed right-4 z-[1000] md:right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ filter: overlayFilter }}
      >
        <PartnerIndicator />
      </div>
    </>
  );
}
