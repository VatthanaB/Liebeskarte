"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  { lang: "en", text: "I love you" },
  { lang: "de", text: "Ich liebe dich" },
  { lang: "fr", text: "Je t'aime" },
] as const;

type LoveLoadingVariant = "page" | "inline" | "overlay";

function nextPhraseIndex(current: number) {
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * PHRASES.length);
  }
  return next;
}

export function LoveLoading({ variant = "inline" }: { variant?: LoveLoadingVariant }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const phrase = PHRASES[index];

  useEffect(() => {
    setIndex(Math.floor(Math.random() * PHRASES.length));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let fadeTimer = 0;
    const cycleTimer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => nextPhraseIndex(current));
        setVisible(true);
      }, 180);
    }, 1200);

    return () => {
      window.clearInterval(cycleTimer);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  const content = (
    <div
      className="love-loading"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="love-loading__heart" aria-hidden="true">
        ♡
      </span>
      <p
        className={`love-loading__phrase ${visible ? "love-loading__phrase--in" : "love-loading__phrase--out"}`}
        lang={phrase.lang}
      >
        {phrase.text}
      </p>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center px-6">
        {content}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-6 py-16">
      {content}
    </div>
  );
}
