"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { extractPhotoPathFromSignedUrl, resolvePhotoDisplayUrl } from "@/lib/image-cache";

type MemoryPhotoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string;
  path?: string | null;
};

function isDirectSrc(src: string): boolean {
  return !src || src.startsWith("blob:") || src.startsWith("data:");
}

export function MemoryPhoto({ src, path, alt = "", ...props }: MemoryPhotoProps) {
  const direct = isDirectSrc(src);
  const [cacheState, setCacheState] = useState<{ src: string; url: string } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (direct) return;

    let cancelled = false;
    const pathHint = path ?? extractPhotoPathFromSignedUrl(src);

    void resolvePhotoDisplayUrl(src, pathHint).then((resolved) => {
      if (cancelled) return;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      if (resolved.startsWith("blob:")) {
        objectUrlRef.current = resolved;
      }
      setCacheState({ src, url: resolved });
    });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, path, direct]);

  const displaySrc = direct ? src : (cacheState?.src === src ? cacheState.url : src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={displaySrc} alt={alt} {...props} />
  );
}
