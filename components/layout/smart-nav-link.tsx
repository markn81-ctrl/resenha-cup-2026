"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef } from "react";

const prefetchedHrefs = new Set<string>();

type SmartNavLinkProps = {
  href: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export function SmartNavLink({ href, className, ariaLabel, children }: SmartNavLinkProps) {
  const router = useRouter();
  const prefetchTimer = useRef<number | null>(null);

  function prefetch() {
    if (prefetchedHrefs.has(href)) {
      return;
    }

    prefetchedHrefs.add(href);
    router.prefetch(href);
  }

  function schedulePrefetch() {
    if (prefetchTimer.current) {
      return;
    }

    prefetchTimer.current = window.setTimeout(() => {
      prefetchTimer.current = null;
      prefetch();
    }, 120);
  }

  function cancelScheduledPrefetch() {
    if (!prefetchTimer.current) {
      return;
    }

    window.clearTimeout(prefetchTimer.current);
    prefetchTimer.current = null;
  }

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={ariaLabel}
      className={className}
      onFocus={schedulePrefetch}
      onPointerEnter={schedulePrefetch}
      onPointerLeave={cancelScheduledPrefetch}
      onTouchStart={prefetch}
    >
      {children}
    </Link>
  );
}
