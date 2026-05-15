import { MatchStatus } from "@prisma/client";

export function getMatchLockDate(startsAt: Date | string) {
  return new Date(new Date(startsAt).getTime() - 2 * 60 * 60 * 1000);
}

export function getDerivedMatchStatus(startsAt: Date | string, finishedAt?: Date | null) {
  if (finishedAt) {
    return MatchStatus.FINISHED;
  }

  const lockAt = getMatchLockDate(startsAt);
  return new Date() >= lockAt ? MatchStatus.LOCKED : MatchStatus.SCHEDULED;
}

export function ensurePredictionEditable(lockAt: Date | string) {
  if (new Date() >= new Date(lockAt)) {
    throw new Error("Este palpite ja foi travado.");
  }
}
