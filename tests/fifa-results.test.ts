import assert from "node:assert/strict";
import { CardsEdge, CardsRange } from "@prisma/client";
import {
  formatFifaApiDate,
  parseFifaMatchDetails,
  type FifaMatchDetails
} from "../lib/fifa-results";

const fixture: FifaMatchDetails = {
  IdCompetition: "17",
  IdSeason: "285023",
  IdMatch: "400021443",
  MatchNumber: 1,
  Date: "2026-06-11T19:00:00Z",
  Period: 10,
  MatchTime: "98'",
  HomeTeam: {
    IdTeam: "43911",
    Score: 2,
    Abbreviation: "MEX",
    TeamName: [{ Locale: "en-GB", Description: "Mexico" }],
    Players: [
      {
        IdPlayer: "1",
        PlayerName: [{ Locale: "en-GB", Description: "Jogador Um" }]
      },
      {
        IdPlayer: "2",
        PlayerName: [{ Locale: "en-GB", Description: "Jogador Dois" }]
      }
    ],
    Goals: [
      { IdPlayer: "1", IdTeam: "43911", Minute: "9'", Type: 2 },
      { IdPlayer: "2", IdTeam: "43911", Minute: "67'", Type: 2 }
    ],
    Bookings: [
      { IdPlayer: "1", IdTeam: "43911", Minute: "23'", Card: 1 },
      { IdPlayer: "2", IdTeam: "43911", Minute: "90'+2'", Card: 2 }
    ]
  },
  AwayTeam: {
    IdTeam: "43883",
    Score: 0,
    Abbreviation: "RSA",
    TeamName: [{ Locale: "en-GB", Description: "South Africa" }],
    Players: [
      {
        IdPlayer: "3",
        PlayerName: [{ Locale: "en-GB", Description: "Jogador Tres" }]
      }
    ],
    Goals: [],
    Bookings: [{ IdPlayer: "3", IdTeam: "43883", Minute: "17'", Card: 1 }]
  }
};

const result = parseFifaMatchDetails(fixture, {
  number: 1,
  startsAt: new Date("2026-06-11T19:00:00Z"),
  homeCode: "MEX",
  awayCode: "RSA"
});

assert.equal(result.match.finished, true);
assert.deepEqual(result.score, { home: 2, away: 0 });
assert.deepEqual(result.scorers, ["Jogador Um", "Jogador Dois"]);
assert.equal(result.cards.homeYellow, 1);
assert.equal(result.cards.awayYellow, 1);
assert.equal(result.cards.totalYellow, 2);
assert.equal(result.cards.edge, CardsEdge.EQUAL);
assert.equal(result.cards.range, CardsRange.ONE_TWO);
assert.equal(result.cards.events[1]?.color, "RED");
assert.deepEqual(result.warnings, []);
assert.equal(formatFifaApiDate(new Date("2026-06-12T02:00:00.000Z")), "2026-06-12T02:00:00Z");

assert.throws(
  () =>
    parseFifaMatchDetails(fixture, {
      number: 2,
      startsAt: new Date("2026-06-11T19:00:00Z"),
      homeCode: "MEX",
      awayCode: "RSA"
    }),
  /numero da partida/
);

console.log("FIFA result parsing tests passed.");
