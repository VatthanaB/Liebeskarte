"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { THEME } from "@/lib/themes";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";

type ViewMode = "map" | "globe";

interface NavBarProps {
  viewMode?: ViewMode;
}

export function NavBar({ viewMode }: NavBarProps) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const links = [
    {
      href: "/",
      label: "Map",
      active: pathname === "/" && viewMode !== "globe",
    },
    {
      href: "/?view=globe",
      label: "Globe",
      active: pathname === "/" && viewMode === "globe",
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
  ];

  return (
    <nav
      className="pointer-events-auto absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between gap-2 px-4 py-3 pt-[max(2rem,env(safe-area-inset-top))] md:px-6"
      style={{ fontFamily: "var(--font-label)" }}
    >
      <Link
        href="/"
        className="hidden text-sm font-semibold tracking-wide uppercase sm:block"
        style={{ color: "var(--theme-ink)" }}
      >
        Liebeskarte
      </Link>
      <div
        className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full border px-1 py-1 backdrop-blur-md"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: `${THEME.colors.surface}cc`,
        }}
      >
        {links.map((link) => {
          const active = link.active;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors md:px-3 md:text-xs"
              style={{
                backgroundColor: active ? "var(--theme-accent)" : "transparent",
                color: active ? "#fff" : "var(--theme-ink-muted)",
              }}
            >
              {link.label}
            </Link>
          );
        })}
        {AUTH_ENABLED && user && (
          <button
            onClick={() => signOut()}
            className="rounded-full px-2 py-1.5 text-[11px] font-medium md:px-3 md:text-xs"
            style={{ color: "var(--theme-ink-muted)" }}
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
