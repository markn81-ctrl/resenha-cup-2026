"use client";

import { MatchStatus } from "@prisma/client";
import { useEffect, useState } from "react";

const MAX_TIMEOUT_MS = 2_147_000_000;

export function usePredictionLock(status: MatchStatus, lockAt: Date | string) {
  const [lockReached, setLockReached] = useState(status !== MatchStatus.SCHEDULED);

  useEffect(() => {
    if (status !== MatchStatus.SCHEDULED) {
      setLockReached(true);
      return;
    }

    setLockReached(false);
    const lockTimestamp = new Date(lockAt).getTime();
    let timeout: number | undefined;

    const scheduleLock = () => {
      const delay = lockTimestamp - Date.now();

      if (delay <= 0) {
        setLockReached(true);
        return;
      }

      timeout = window.setTimeout(scheduleLock, Math.min(delay, MAX_TIMEOUT_MS));
    };

    scheduleLock();

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [lockAt, status]);

  return lockReached;
}
