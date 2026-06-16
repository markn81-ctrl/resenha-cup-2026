"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import { useNavigationFeedback } from "@/components/layout/navigation-feedback";

const prefetchedHrefs = new Set<string>();

type SmartNavLinkProps = {
  href: string;
  className?: string;
  ariaLabel?: string;
  prefetchOnIntent?: boolean;
  children: ReactNode;
};

export function SmartNavLink({
  href,
  className,
  ariaLabel,
  prefetchOnIntent = true,
  children
}: SmartNavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { finishNavigation, startNavigation } = useNavigationFeedback();
  const prefetchTimer = useRef<number | null>(null);

  function prefetch() {
    if (!prefetchOnIntent) {
      return;
    }

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

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const currentHref =
      typeof window === "undefined"
        ? pathname
        : `${window.location.pathname}${window.location.search}`;

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      currentHref === href
    ) {
      return;
    }

    startNavigation();

    if (typeof window !== "undefined") {
      const target = new URL(href, window.location.origin);

      if (target.pathname === window.location.pathname) {
        window.setTimeout(finishNavigation, 900);
      }
    }
  }

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={ariaLabel}
      className={className}
      onClick={handleClick}
      onFocus={schedulePrefetch}
      onPointerEnter={schedulePrefetch}
      onPointerLeave={cancelScheduledPrefetch}
      onTouchStart={prefetch}
    >
      {children}
    </Link>
  );
}
