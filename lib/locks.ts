import { MatchStatus } from "@prisma/client";

export const PREDICTION_LOCK_LEAD_MINUTES = 10;

export function getMatchLockDate(startsAt: Date | string) {
  return new Date(
    new Date(startsAt).getTime() - PREDICTION_LOCK_LEAD_MINUTES * 60 * 1000
  );
}

export function getDerivedMatchStatus(startsAt: Date | string, finishedAt?: Date | null) {
  if (finishedAt) {
    return MatchStatus.FINISHED;
  }

  const lockAt = getMatchLockDate(startsAt);
  return new Date() >= lockAt ? MatchStatus.LOCKED : MatchStatus.SCHEDULED;
}

export function getEffectiveMatchStatus(
  status: MatchStatus,
  lockAt: Date | string,
  now = new Date()
) {
  if (status === MatchStatus.FINISHED) {
    return MatchStatus.FINISHED;
  }

  return now >= new Date(lockAt) ? MatchStatus.LOCKED : MatchStatus.SCHEDULED;
}

export function ensurePredictionEditable(lockAt: Date | string) {
  if (new Date() >= new Date(lockAt)) {
    throw new Error("Este palpite ja foi travado.");
  }
}
