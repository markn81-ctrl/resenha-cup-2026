import { Phase } from "@prisma/client";
import { buildTournamentMatches, groups } from "../prisma/tournament-data";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function brt(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

const fakeIds = new Map(Object.values(groups).flat().map((team) => [team.code, team.code]));
const matches = buildTournamentMatches(fakeIds);
const groupTeams = new Map(
  Object.entries(groups).map(([groupKey, teams]) => [
    groupKey,
    new Set(teams.map((team) => team.code))
  ])
);

assert(Object.keys(groups).length === 12, "Expected 12 groups");
assert(Object.values(groups).flat().length === 48, "Expected 48 teams");
assert(new Set(Object.values(groups).flat().map((team) => team.code)).size === 48, "Team codes must be unique");
assert(matches.length === 104, "Expected 104 matches");
assert(new Set(matches.map((match) => match.number)).size === 104, "Match numbers must be unique");

const groupStage = matches.filter((match) => match.phase === Phase.GROUP_STAGE);
assert(groupStage.length === 72, "Expected 72 group-stage matches");

for (const groupKey of Object.keys(groups)) {
  const groupMatches = groupStage.filter((match) => match.groupKey === groupKey);
  assert(groupMatches.length === 6, `Expected 6 matches for group ${groupKey}`);

  const teamCodes = groupTeams.get(groupKey);
  if (!teamCodes) {
    throw new Error(`Missing group ${groupKey}`);
  }

  for (const match of groupMatches) {
    assert(match.homeTeamId && teamCodes.has(match.homeTeamId), `Match ${match.number} home team is outside group ${groupKey}`);
    assert(match.awayTeamId && teamCodes.has(match.awayTeamId), `Match ${match.number} away team is outside group ${groupKey}`);
  }
}

const byNumber = new Map(matches.map((match) => [match.number, match]));
const match1 = byNumber.get(1);
const match7 = byNumber.get(7);
const match29 = byNumber.get(29);
const match49 = byNumber.get(49);
const final = byNumber.get(104);

assert(match1?.homeTeamId === "MEX" && match1.awayTeamId === "RSA", "Match 1 must be Mexico v South Africa");
assert(match1 && brt(match1.startsAt) === "2026-06-11, 16:00", "Match 1 must be 16:00 BRT");
assert(match7?.homeTeamId === "BRA" && match7.awayTeamId === "MAR", "Match 7 must be Brazil v Morocco");
assert(match7 && brt(match7.startsAt) === "2026-06-13, 19:00", "Brazil v Morocco must be 19:00 BRT");
assert(match29?.homeTeamId === "BRA" && match29.awayTeamId === "HAI", "Match 29 must be Brazil v Haiti");
assert(match29 && brt(match29.startsAt) === "2026-06-19, 21:30", "Brazil v Haiti must be 21:30 BRT");
assert(match49?.homeTeamId === "SCO" && match49.awayTeamId === "BRA", "Match 49 must be Scotland v Brazil");
assert(match49 && brt(match49.startsAt) === "2026-06-24, 19:00", "Scotland v Brazil must be 19:00 BRT");
assert(final?.phase === Phase.FINAL, "Match 104 must be the final");
assert(final && brt(final.startsAt) === "2026-07-19, 16:00", "Final must be 16:00 BRT");

console.log("Official schedule validation completed successfully.");
