import { LeaderboardScope, PlayerTier } from "@prisma/client";
import { playerTierMeta } from "@/lib/constants";

export function getPlayerTierFromPercentile(percentile: number) {
  if (percentile <= 0.1) {
    return PlayerTier.LEGENDARY;
  }

  if (percentile <= 0.3) {
    return PlayerTier.GOOD;
  }

  if (percentile <= 0.6) {
    return PlayerTier.AVERAGE;
  }

  return PlayerTier.POOR;
}

export function buildPlayerStatus(args: {
  scope: LeaderboardScope;
  rankPosition: number;
  totalPlayers: number;
}) {
  const percentile = args.totalPlayers <= 1 ? 0.1 : args.rankPosition / args.totalPlayers;
  const tier = getPlayerTierFromPercentile(percentile);

  return {
    scope: args.scope,
    tier,
    percentile,
    rankPosition: args.rankPosition,
    colorHex: playerTierMeta[tier].color
  };
}
