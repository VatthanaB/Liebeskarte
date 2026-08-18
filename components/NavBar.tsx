"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";

type ViewMode = "map" | "gallery";

interface NavBarProps {
  viewMode?: ViewMode;
  onAddMemory?: () => void;
}

export function NavBar({ viewMode, onAddMemory }: NavBarProps) {
  const pathname = usePathname();
  const { signOut: signOutAuth, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const current = links.find((link) => link.active) ?? links[0];

  const pillStyle = {
    backgroundColor: "var(--theme-surface)",
    borderColor: "var(--theme-border)",
    color: "var(--theme-ink)",
    fontFamily: "var(--font-label)",
  } as const;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, viewMode]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function onDesktop(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }

    const mq = window.matchMedia("(min-width: 768px)");
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onDesktop);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="pointer-events-auto fixed inset-0 z-[999] md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <nav className="pointer-events-auto absolute top-0 left-0 right-0 z-[1000] flex items-start justify-between gap-3 px-4 py-3 pt-[max(2rem,env(safe-area-inset-top))] md:px-6">
        <Link
          href="/"
          className="hidden min-h-11 shrink-0 items-center text-sm tracking-wide sm:flex"
          style={{ color: "var(--theme-ink)", fontFamily: "var(--font-label)" }}
        >
          Liebeskarte
        </Link>

        <div className="relative ml-auto flex max-w-full items-center justify-end">
          <div
            className="flex items-center gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur-sm md:hidden"
            style={pillStyle}
          >
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls="nav-menu"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2"
              style={{ color: "var(--theme-ink)" }}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {current.label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path d="M2.5 4.5 6 8l3.5-3.5" />
              </svg>
            </button>
          </div>

          {menuOpen && (
            <div
              id="nav-menu"
              role="menu"
              className="absolute right-0 top-full z-[1001] mt-1.5 min-w-[11rem] overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm md:hidden"
              style={pillStyle}
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  aria-current={link.active ? "page" : undefined}
                  className="flex h-11 items-center px-3.5 text-sm"
                  style={{
                    backgroundColor: link.active
                      ? "var(--theme-accent-light)"
                      : undefined,
                    color: link.active
                      ? "var(--theme-ink)"
                      : "var(--theme-ink-muted)",
                    fontWeight: link.active ? 600 : 400,
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {AUTH_ENABLED && user && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    signOutAuth();
                  }}
                  className="flex h-11 w-full items-center px-3.5 text-left text-sm"
                  style={{ color: "var(--theme-ink-muted)" }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}

          <div
            className="hidden max-w-full flex-wrap items-center justify-end gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur-sm md:flex"
            style={pillStyle}
          >
            {links.map((link) => {
              const active = link.active;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    active
                      ? ""
                      : "hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)]"
                  }`}
                  style={{
                    backgroundColor: active ? "var(--theme-accent)" : undefined,
                    color: active ? "#fff" : "var(--theme-ink-muted)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {AUTH_ENABLED && user && (
              <button
                onClick={() => signOutAuth()}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-[11px] font-medium transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: "var(--theme-ink-muted)" }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>
      {onAddMemory && (
        <div className="pointer-events-auto fixed right-4 z-[1000] md:right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div
            className="flex items-center rounded-full border p-0.5 shadow-sm backdrop-blur-sm"
            style={pillStyle}
          >
            <button
              type="button"
              onClick={onAddMemory}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)] focus-visible:outline-none focus-visible:ring-2"
              style={{ color: "var(--theme-ink)" }}
              aria-label="Add memory"
            >
              +
            </button>
          </div>
        </div>
      )}
    </>
  );
}
