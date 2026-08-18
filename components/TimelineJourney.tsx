"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Memory } from "@/lib/types";
import { groupMemoriesByYear } from "@/lib/photos";
import { TimelineCard } from "./TimelineCard";

interface TimelineJourneyProps {
  memories: Memory[];
  photoUrlMap: Record<string, string[]>;
  onViewOnMap: (memory: Memory) => void;
}

export function TimelineJourney({
  memories,
  photoUrlMap,
  onViewOnMap,
}: TimelineJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const yearGroups = groupMemoriesByYear(memories);
  const years = yearGroups.map((g) => g.year);

  useEffect(() => {
    if (years.length > 0 && activeYear === null) {
      setActiveYear(years[0]);
    }
  }, [years, activeYear]);

  useEffect(() => {
    function handleScroll() {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const elTop = scrollTop + rect.top;
      const elHeight = el.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = scrollTop + viewportHeight * 0.3 - elTop;
      const progress = Math.min(1, Math.max(0, scrolled / elHeight));
      setScrollProgress(progress);

      const yearSections = el.querySelectorAll("[data-year]");
      for (const section of yearSections) {
        const sectionRect = section.getBoundingClientRect();
        if (sectionRect.top <= viewportHeight * 0.4) {
          const year = Number(section.getAttribute("data-year"));
          if (!Number.isNaN(year)) setActiveYear(year);
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("timeline-reveal--visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    const cards = containerRef.current?.querySelectorAll(".timeline-reveal");
    cards?.forEach((card) => observer.observe(card));

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [memories]);

  const scrollToYear = useCallback((year: number) => {
    const el = containerRef.current?.querySelector(`[data-year="${year}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveYear(year);
    }
  }, []);

  let globalIndex = 0;

  return (
    <div className="relative">
      {/* Year rail — desktop only */}
      <aside
        className="timeline-year-rail pointer-events-none fixed top-1/2 right-4 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex lg:right-8"
        aria-hidden="true"
      >
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => scrollToYear(year)}
            className="timeline-year-rail__dot pointer-events-auto text-xs font-medium transition-all"
            style={{
              color: activeYear === year ? "var(--theme-accent)" : "var(--theme-ink-muted)",
              fontFamily: "var(--font-label)",
              opacity: activeYear === year ? 1 : 0.5,
              transform: activeYear === year ? "scale(1.15)" : "scale(1)",
            }}
          >
            {year}
          </button>
        ))}
      </aside>

      <div ref={containerRef} className="timeline-journey relative mx-auto max-w-5xl px-4 md:px-8">
        {/* Center spine */}
        <div className="timeline-spine pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 md:block">
          <div
            className="timeline-spine__track absolute inset-0"
            style={{ backgroundColor: "var(--theme-border)" }}
          />
          <div
            className="timeline-spine__fill absolute top-0 left-0 w-full origin-top transition-transform duration-150"
            style={{
              backgroundColor: "var(--theme-accent)",
              transform: `scaleY(${scrollProgress})`,
              height: "100%",
            }}
          />
        </div>

        {yearGroups.map(({ year, memories: yearMemories }) => (
          <section key={year} data-year={year} className="timeline-year-section pb-16">
            <h2
              className="timeline-year-heading mb-10 text-center text-4xl font-semibold md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {year}
            </h2>

            <div className="relative space-y-12 md:space-y-16">
              {yearMemories.map((memory) => {
                const side = globalIndex % 2 === 0 ? "left" : "right";
                globalIndex += 1;

                return (
                  <div
                    key={memory.id}
                    className={`timeline-row relative flex md:w-[calc(50%-2rem)] ${
                      side === "left"
                        ? "md:mr-auto md:pr-8"
                        : "md:ml-auto md:pl-8"
                    }`}
                  >
                    {/* Spine node — desktop */}
                    <div
                      className="timeline-spine-node absolute top-8 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 md:block"
                      style={{
                        left: side === "left" ? "calc(100% + 2rem)" : "-2rem",
                        borderColor: "var(--theme-accent)",
                        backgroundColor: "var(--theme-surface)",
                      }}
                    />

                    <TimelineCard
                      memory={memory}
                      photoUrls={photoUrlMap[memory.id]}
                      side={side}
                      onViewOnMap={onViewOnMap}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
