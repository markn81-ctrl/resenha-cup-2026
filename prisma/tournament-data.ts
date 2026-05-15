import { Phase, PlayerPosition } from "@prisma/client";

export type GroupTeam = {
  code: string;
  countryCode: string;
  name: string;
  shortName: string;
  flagEmoji: string;
};

export type TournamentMatchSeed = {
  number: number;
  slug: string;
  phase: Phase;
  groupKey?: string | null;
  startsAt: Date;
  lockAt: Date;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
};

export type TeamPlayerSlotSeed = {
  teamId: string;
  slotNumber: number;
  name: string;
  shortName: string;
  position: PlayerPosition;
  isOfficial: boolean;
  isActive: boolean;
};

export const groups = {
  A: [
    { code: "BRA", countryCode: "br", name: "Brasil", shortName: "Brasil", flagEmoji: "🇧🇷" },
    { code: "MEX", countryCode: "mx", name: "Mexico", shortName: "Mexico", flagEmoji: "🇲🇽" },
    { code: "SUI", countryCode: "ch", name: "Suica", shortName: "Suica", flagEmoji: "🇨🇭" },
    { code: "EGY", countryCode: "eg", name: "Egito", shortName: "Egito", flagEmoji: "🇪🇬" }
  ],
  B: [
    { code: "FRA", countryCode: "fr", name: "Franca", shortName: "Franca", flagEmoji: "🇫🇷" },
    { code: "JPN", countryCode: "jp", name: "Japao", shortName: "Japao", flagEmoji: "🇯🇵" },
    { code: "CAN", countryCode: "ca", name: "Canada", shortName: "Canada", flagEmoji: "🇨🇦" },
    { code: "GHA", countryCode: "gh", name: "Gana", shortName: "Gana", flagEmoji: "🇬🇭" }
  ],
  C: [
    { code: "ARG", countryCode: "ar", name: "Argentina", shortName: "Argentina", flagEmoji: "🇦🇷" },
    { code: "NED", countryCode: "nl", name: "Holanda", shortName: "Holanda", flagEmoji: "🇳🇱" },
    { code: "KOR", countryCode: "kr", name: "Coreia do Sul", shortName: "Coreia", flagEmoji: "🇰🇷" },
    { code: "NGA", countryCode: "ng", name: "Nigeria", shortName: "Nigeria", flagEmoji: "🇳🇬" }
  ],
  D: [
    { code: "ESP", countryCode: "es", name: "Espanha", shortName: "Espanha", flagEmoji: "🇪🇸" },
    { code: "POR", countryCode: "pt", name: "Portugal", shortName: "Portugal", flagEmoji: "🇵🇹" },
    { code: "USA", countryCode: "us", name: "Estados Unidos", shortName: "EUA", flagEmoji: "🇺🇸" },
    { code: "ECU", countryCode: "ec", name: "Equador", shortName: "Equador", flagEmoji: "🇪🇨" }
  ],
  E: [
    { code: "ENG", countryCode: "gb", name: "Inglaterra", shortName: "Inglaterra", flagEmoji: "🏴" },
    { code: "URU", countryCode: "uy", name: "Uruguai", shortName: "Uruguai", flagEmoji: "🇺🇾" },
    { code: "MAR", countryCode: "ma", name: "Marrocos", shortName: "Marrocos", flagEmoji: "🇲🇦" },
    { code: "AUS", countryCode: "au", name: "Australia", shortName: "Australia", flagEmoji: "🇦🇺" }
  ],
  F: [
    { code: "GER", countryCode: "de", name: "Alemanha", shortName: "Alemanha", flagEmoji: "🇩🇪" },
    { code: "COL", countryCode: "co", name: "Colombia", shortName: "Colombia", flagEmoji: "🇨🇴" },
    { code: "SEN", countryCode: "sn", name: "Senegal", shortName: "Senegal", flagEmoji: "🇸🇳" },
    { code: "CRC", countryCode: "cr", name: "Costa Rica", shortName: "Costa Rica", flagEmoji: "🇨🇷" }
  ],
  G: [
    { code: "ITA", countryCode: "it", name: "Italia", shortName: "Italia", flagEmoji: "🇮🇹" },
    { code: "DEN", countryCode: "dk", name: "Dinamarca", shortName: "Dinamarca", flagEmoji: "🇩🇰" },
    { code: "IRN", countryCode: "ir", name: "Ira", shortName: "Ira", flagEmoji: "🇮🇷" },
    { code: "CMR", countryCode: "cm", name: "Camaroes", shortName: "Camaroes", flagEmoji: "🇨🇲" }
  ],
  H: [
    { code: "BEL", countryCode: "be", name: "Belgica", shortName: "Belgica", flagEmoji: "🇧🇪" },
    { code: "CRO", countryCode: "hr", name: "Croacia", shortName: "Croacia", flagEmoji: "🇭🇷" },
    { code: "PAR", countryCode: "py", name: "Paraguai", shortName: "Paraguai", flagEmoji: "🇵🇾" },
    { code: "KSA", countryCode: "sa", name: "Arabia Saudita", shortName: "Arabia Saudita", flagEmoji: "🇸🇦" }
  ],
  I: [
    { code: "TUR", countryCode: "tr", name: "Turquia", shortName: "Turquia", flagEmoji: "🇹🇷" },
    { code: "POL", countryCode: "pl", name: "Polonia", shortName: "Polonia", flagEmoji: "🇵🇱" },
    { code: "ALG", countryCode: "dz", name: "Argelia", shortName: "Argelia", flagEmoji: "🇩🇿" },
    { code: "PER", countryCode: "pe", name: "Peru", shortName: "Peru", flagEmoji: "🇵🇪" }
  ],
  J: [
    { code: "SWE", countryCode: "se", name: "Suecia", shortName: "Suecia", flagEmoji: "🇸🇪" },
    { code: "CHI", countryCode: "cl", name: "Chile", shortName: "Chile", flagEmoji: "🇨🇱" },
    { code: "TUN", countryCode: "tn", name: "Tunisia", shortName: "Tunisia", flagEmoji: "🇹🇳" },
    { code: "NOR", countryCode: "no", name: "Noruega", shortName: "Noruega", flagEmoji: "🇳🇴" }
  ],
  K: [
    { code: "CZE", countryCode: "cz", name: "Republica Tcheca", shortName: "Tchequia", flagEmoji: "🇨🇿" },
    { code: "CIV", countryCode: "ci", name: "Costa do Marfim", shortName: "Costa do Marfim", flagEmoji: "🇨🇮" },
    { code: "SCO", countryCode: "gb", name: "Escocia", shortName: "Escocia", flagEmoji: "🏴" },
    { code: "UAE", countryCode: "ae", name: "Emirados Arabes", shortName: "EAU", flagEmoji: "🇦🇪" }
  ],
  L: [
    { code: "AUT", countryCode: "at", name: "Austria", shortName: "Austria", flagEmoji: "🇦🇹" },
    { code: "GRE", countryCode: "gr", name: "Grecia", shortName: "Grecia", flagEmoji: "🇬🇷" },
    { code: "MLI", countryCode: "ml", name: "Mali", shortName: "Mali", flagEmoji: "🇲🇱" },
    { code: "NZL", countryCode: "nz", name: "Nova Zelandia", shortName: "Nova Zelandia", flagEmoji: "🇳🇿" }
  ]
} satisfies Record<string, GroupTeam[]>;

const groupPairings: Array<[number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2]
];

const roundOf32Slots: Array<[string, string]> = [
  ["1A", "3B"], ["1C", "3D"], ["1E", "3F"], ["1G", "3H"],
  ["1I", "3J"], ["1K", "3L"], ["2A", "2B"], ["2C", "2D"],
  ["2E", "2F"], ["2G", "2H"], ["2I", "2J"], ["2K", "2L"],
  ["1B", "3A"], ["1D", "3C"], ["1F", "3E"], ["1H", "3G"]
];

const rosterTemplate: PlayerPosition[] = [
  PlayerPosition.GOALKEEPER,
  PlayerPosition.GOALKEEPER,
  PlayerPosition.GOALKEEPER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.DEFENDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.MIDFIELDER,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD,
  PlayerPosition.FORWARD
];

function dateAt(dayOffset: number, hourUTC: number) {
  return new Date(Date.UTC(2026, 5, 11 + dayOffset, hourUTC, 0, 0));
}

function lockAt(startsAt: Date) {
  return new Date(startsAt.getTime() - 2 * 60 * 60 * 1000);
}

export function buildTournamentMatches(teamIdByCode: Map<string, string>): TournamentMatchSeed[] {
  const matches: TournamentMatchSeed[] = [];

  let gameNumber = 1;
  Object.entries(groups).forEach(([groupKey, teams], groupIndex) => {
    groupPairings.forEach(([homeIndex, awayIndex], pairingIndex) => {
      const startsAt = dateAt(groupIndex * 2 + Math.floor(pairingIndex / 2), 16 + (pairingIndex % 2) * 4);
      const home = teams[homeIndex];
      const away = teams[awayIndex];

      matches.push({
        number: gameNumber,
        slug: `match-${String(gameNumber).padStart(3, "0")}-${groupKey.toLowerCase()}`,
        phase: Phase.GROUP_STAGE,
        groupKey,
        startsAt,
        lockAt: lockAt(startsAt),
        venue: `Arena ${groupKey}${pairingIndex + 1}`,
        city: ["Toronto", "Monterrey", "Los Angeles", "Atlanta"][pairingIndex % 4],
        country: ["Canada", "Mexico", "Estados Unidos"][pairingIndex % 3],
        homeTeamId: teamIdByCode.get(home.code),
        awayTeamId: teamIdByCode.get(away.code)
      });
      gameNumber += 1;
    });
  });

  roundOf32Slots.forEach(([home, away], index) => {
    const startsAt = dateAt(17 + Math.floor(index / 4), 18 + (index % 4) * 2);
    matches.push({
      number: gameNumber,
      slug: `match-${String(gameNumber).padStart(3, "0")}-r32`,
      phase: Phase.ROUND_OF_32,
      startsAt,
      lockAt: lockAt(startsAt),
      homePlaceholder: home,
      awayPlaceholder: away,
      venue: `Knockout Arena ${index + 1}`,
      city: ["Seattle", "Houston", "Boston", "Vancouver"][index % 4],
      country: ["Estados Unidos", "Canada", "Mexico"][index % 3]
    });
    gameNumber += 1;
  });

  Array.from({ length: 8 }).forEach((_, index) => {
    const startsAt = dateAt(23 + Math.floor(index / 4), 18 + (index % 4) * 2);
    matches.push({
      number: gameNumber,
      slug: `match-${String(gameNumber).padStart(3, "0")}-r16`,
      phase: Phase.ROUND_OF_16,
      startsAt,
      lockAt: lockAt(startsAt),
      homePlaceholder: `Vencedor J${73 + index * 2}`,
      awayPlaceholder: `Vencedor J${74 + index * 2}`,
      venue: `Round 16 Arena ${index + 1}`,
      city: ["Dallas", "Miami", "Guadalajara", "Kansas City"][index % 4],
      country: ["Estados Unidos", "Mexico"][index % 2]
    });
    gameNumber += 1;
  });

  Array.from({ length: 4 }).forEach((_, index) => {
    const startsAt = dateAt(27 + Math.floor(index / 2), 19 + (index % 2) * 3);
    matches.push({
      number: gameNumber,
      slug: `match-${String(gameNumber).padStart(3, "0")}-qf`,
      phase: Phase.QUARTER_FINAL,
      startsAt,
      lockAt: lockAt(startsAt),
      homePlaceholder: `Vencedor J${89 + index * 2}`,
      awayPlaceholder: `Vencedor J${90 + index * 2}`,
      venue: `Quarter Arena ${index + 1}`,
      city: ["Philadelphia", "Mexico City"][index % 2],
      country: ["Estados Unidos", "Mexico"][index % 2]
    });
    gameNumber += 1;
  });

  Array.from({ length: 2 }).forEach((_, index) => {
    const startsAt = dateAt(30 + index, 20);
    matches.push({
      number: gameNumber,
      slug: `match-${String(gameNumber).padStart(3, "0")}-sf`,
      phase: Phase.SEMI_FINAL,
      startsAt,
      lockAt: lockAt(startsAt),
      homePlaceholder: `Vencedor J${97 + index * 2}`,
      awayPlaceholder: `Vencedor J${98 + index * 2}`,
      venue: `Semi Arena ${index + 1}`,
      city: ["New York", "Los Angeles"][index],
      country: "Estados Unidos"
    });
    gameNumber += 1;
  });

  const thirdPlaceDate = dateAt(33, 18);
  matches.push({
    number: gameNumber,
    slug: `match-${String(gameNumber).padStart(3, "0")}-third`,
    phase: Phase.THIRD_PLACE,
    startsAt: thirdPlaceDate,
    lockAt: lockAt(thirdPlaceDate),
    homePlaceholder: "Perdedor J101",
    awayPlaceholder: "Perdedor J102",
    venue: "Third Place Arena",
    city: "Dallas",
    country: "Estados Unidos"
  });
  gameNumber += 1;

  const finalDate = dateAt(34, 20);
  matches.push({
    number: gameNumber,
    slug: `match-${String(gameNumber).padStart(3, "0")}-final`,
    phase: Phase.FINAL,
    startsAt: finalDate,
    lockAt: lockAt(finalDate),
    homePlaceholder: "Vencedor J101",
    awayPlaceholder: "Vencedor J102",
    venue: "MetLife Stadium",
    city: "New York",
    country: "Estados Unidos"
  });

  return matches;
}

export function buildTeamPlayerSlots(args: {
  teamId: string;
  teamShortName: string;
}): TeamPlayerSlotSeed[] {
  return rosterTemplate.map((position, index) => {
    const slotNumber = index + 1;
    const paddedSlot = String(slotNumber).padStart(2, "0");

    return {
      teamId: args.teamId,
      slotNumber,
      name: `${args.teamShortName} Jogador ${paddedSlot}`,
      shortName: `J${paddedSlot}`,
      position,
      isOfficial: false,
      isActive: true
    };
  });
}
