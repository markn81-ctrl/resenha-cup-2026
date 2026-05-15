"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const flagUrlCache = new Map<string, string>();

function buildFlagUrl(countryCode: string, width: number, height: number) {
  const normalizedCode = countryCode.trim().toLowerCase();
  const normalizedWidth = Math.max(20, Math.round(width));
  const normalizedHeight = Math.max(15, Math.round(height));
  const cacheKey = `${normalizedCode}:${normalizedWidth}x${normalizedHeight}`;

  if (!flagUrlCache.has(cacheKey)) {
    flagUrlCache.set(
      cacheKey,
      `https://flagcdn.com/${normalizedWidth}x${normalizedHeight}/${normalizedCode}.png`
    );
  }

  return flagUrlCache.get(cacheKey)!;
}

type FlagProps = {
  countryCode?: string | null;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
  fallbackLabel?: string | null;
};

export function Flag({
  countryCode,
  alt,
  size = 32,
  className,
  priority = false,
  fallbackLabel
}: FlagProps) {
  const [failed, setFailed] = useState(false);
  const width = Math.max(20, Math.round(size));
  const height = Math.round(width * 0.75);
  const src = useMemo(
    () => (countryCode ? buildFlagUrl(countryCode, width, height) : null),
    [countryCode, width, height]
  );

  if (!src || failed) {
    return (
      <span
        aria-label={alt}
        title={alt}
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-white/5 font-semibold uppercase tracking-[0.08em] text-slate-200",
          className
        )}
        style={{ width, height, minWidth: width }}
      >
        {fallbackLabel?.slice(0, 2) ?? "??"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex overflow-hidden rounded-[14px] border border-white/10 bg-white/5 shadow-inner shadow-white/5",
        className
      )}
      style={{ width, height, minWidth: width }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={`${width}px`}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
