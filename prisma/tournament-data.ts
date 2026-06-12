import { Phase, PlayerPosition } from "@prisma/client";
import { getMatchLockDate } from "../lib/locks";

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

type OfficialMatchInput = {
  number: number;
  phase: Phase;
  groupKey?: string;
  date: string;
  time: string;
  utcOffset: number;
  venue: string;
  city: string;
  country: string;
  homeCode?: string;
  awayCode?: string;
  homePlaceholder?: string;
  awayPlaceholder?: string;
};

export const groups = {
  A: [
    { code: "MEX", countryCode: "mx", name: "Mexico", shortName: "Mexico", flagEmoji: "" },
    { code: "RSA", countryCode: "za", name: "Africa do Sul", shortName: "Africa do Sul", flagEmoji: "" },
    { code: "KOR", countryCode: "kr", name: "Coreia do Sul", shortName: "Coreia", flagEmoji: "" },
    { code: "CZE", countryCode: "cz", name: "Republica Tcheca", shortName: "Tchequia", flagEmoji: "" }
  ],
  B: [
    { code: "CAN", countryCode: "ca", name: "Canada", shortName: "Canada", flagEmoji: "" },
    { code: "BIH", countryCode: "ba", name: "Bosnia e Herzegovina", shortName: "Bosnia", flagEmoji: "" },
    { code: "QAT", countryCode: "qa", name: "Qatar", shortName: "Qatar", flagEmoji: "" },
    { code: "SUI", countryCode: "ch", name: "Suica", shortName: "Suica", flagEmoji: "" }
  ],
  C: [
    { code: "BRA", countryCode: "br", name: "Brasil", shortName: "Brasil", flagEmoji: "" },
    { code: "MAR", countryCode: "ma", name: "Marrocos", shortName: "Marrocos", flagEmoji: "" },
    { code: "HAI", countryCode: "ht", name: "Haiti", shortName: "Haiti", flagEmoji: "" },
    { code: "SCO", countryCode: "gb", name: "Escocia", shortName: "Escocia", flagEmoji: "" }
  ],
  D: [
    { code: "USA", countryCode: "us", name: "Estados Unidos", shortName: "EUA", flagEmoji: "" },
    { code: "PAR", countryCode: "py", name: "Paraguai", shortName: "Paraguai", flagEmoji: "" },
    { code: "AUS", countryCode: "au", name: "Australia", shortName: "Australia", flagEmoji: "" },
    { code: "TUR", countryCode: "tr", name: "Turquia", shortName: "Turquia", flagEmoji: "" }
  ],
  E: [
    { code: "GER", countryCode: "de", name: "Alemanha", shortName: "Alemanha", flagEmoji: "" },
    { code: "CUW", countryCode: "cw", name: "Curacao", shortName: "Curacao", flagEmoji: "" },
    { code: "CIV", countryCode: "ci", name: "Costa do Marfim", shortName: "Costa do Marfim", flagEmoji: "" },
    { code: "ECU", countryCode: "ec", name: "Equador", shortName: "Equador", flagEmoji: "" }
  ],
  F: [
    { code: "NED", countryCode: "nl", name: "Holanda", shortName: "Holanda", flagEmoji: "" },
    { code: "JPN", countryCode: "jp", name: "Japao", shortName: "Japao", flagEmoji: "" },
    { code: "TUN", countryCode: "tn", name: "Tunisia", shortName: "Tunisia", flagEmoji: "" },
    { code: "SWE", countryCode: "se", name: "Suecia", shortName: "Suecia", flagEmoji: "" }
  ],
  G: [
    { code: "BEL", countryCode: "be", name: "Belgica", shortName: "Belgica", flagEmoji: "" },
    { code: "EGY", countryCode: "eg", name: "Egito", shortName: "Egito", flagEmoji: "" },
    { code: "IRN", countryCode: "ir", name: "Ira", shortName: "Ira", flagEmoji: "" },
    { code: "NZL", countryCode: "nz", name: "Nova Zelandia", shortName: "Nova Zelandia", flagEmoji: "" }
  ],
  H: [
    { code: "ESP", countryCode: "es", name: "Espanha", shortName: "Espanha", flagEmoji: "" },
    { code: "CPV", countryCode: "cv", name: "Cabo Verde", shortName: "Cabo Verde", flagEmoji: "" },
    { code: "KSA", countryCode: "sa", name: "Arabia Saudita", shortName: "Arabia Saudita", flagEmoji: "" },
    { code: "URU", countryCode: "uy", name: "Uruguai", shortName: "Uruguai", flagEmoji: "" }
  ],
  I: [
    { code: "FRA", countryCode: "fr", name: "Franca", shortName: "Franca", flagEmoji: "" },
    { code: "SEN", countryCode: "sn", name: "Senegal", shortName: "Senegal", flagEmoji: "" },
    { code: "IRQ", countryCode: "iq", name: "Iraque", shortName: "Iraque", flagEmoji: "" },
    { code: "NOR", countryCode: "no", name: "Noruega", shortName: "Noruega", flagEmoji: "" }
  ],
  J: [
    { code: "ARG", countryCode: "ar", name: "Argentina", shortName: "Argentina", flagEmoji: "" },
    { code: "ALG", countryCode: "dz", name: "Argelia", shortName: "Argelia", flagEmoji: "" },
    { code: "AUT", countryCode: "at", name: "Austria", shortName: "Austria", flagEmoji: "" },
    { code: "JOR", countryCode: "jo", name: "Jordania", shortName: "Jordania", flagEmoji: "" }
  ],
  K: [
    { code: "POR", countryCode: "pt", name: "Portugal", shortName: "Portugal", flagEmoji: "" },
    { code: "COD", countryCode: "cd", name: "RD Congo", shortName: "RD Congo", flagEmoji: "" },
    { code: "UZB", countryCode: "uz", name: "Uzbequistao", shortName: "Uzbequistao", flagEmoji: "" },
    { code: "COL", countryCode: "co", name: "Colombia", shortName: "Colombia", flagEmoji: "" }
  ],
  L: [
    { code: "ENG", countryCode: "gb", name: "Inglaterra", shortName: "Inglaterra", flagEmoji: "" },
    { code: "CRO", countryCode: "hr", name: "Croacia", shortName: "Croacia", flagEmoji: "" },
    { code: "GHA", countryCode: "gh", name: "Gana", shortName: "Gana", flagEmoji: "" },
    { code: "PAN", countryCode: "pa", name: "Panama", shortName: "Panama", flagEmoji: "" }
  ]
} satisfies Record<string, GroupTeam[]>;

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

function startsAt(date: string, time: string, utcOffset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - utcOffset, minute, 0));
}

function groupMatch(args: Omit<OfficialMatchInput, "phase">): OfficialMatchInput {
  return { ...args, phase: Phase.GROUP_STAGE };
}

function knockoutMatch(args: Omit<OfficialMatchInput, "phase"> & { phase: Phase }): OfficialMatchInput {
  return args;
}

const officialMatches: OfficialMatchInput[] = [
  groupMatch({ number: 1, groupKey: "A", date: "2026-06-11", time: "13:00", utcOffset: -6, homeCode: "MEX", awayCode: "RSA", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" }),
  groupMatch({ number: 2, groupKey: "A", date: "2026-06-11", time: "20:00", utcOffset: -6, homeCode: "KOR", awayCode: "CZE", venue: "Estadio Akron", city: "Zapopan", country: "Mexico" }),
  groupMatch({ number: 3, groupKey: "B", date: "2026-06-12", time: "15:00", utcOffset: -4, homeCode: "CAN", awayCode: "BIH", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  groupMatch({ number: 4, groupKey: "D", date: "2026-06-12", time: "18:00", utcOffset: -7, homeCode: "USA", awayCode: "PAR", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  groupMatch({ number: 5, groupKey: "C", date: "2026-06-13", time: "21:00", utcOffset: -4, homeCode: "HAI", awayCode: "SCO", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  groupMatch({ number: 6, groupKey: "D", date: "2026-06-13", time: "21:00", utcOffset: -7, homeCode: "AUS", awayCode: "TUR", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  groupMatch({ number: 7, groupKey: "C", date: "2026-06-13", time: "18:00", utcOffset: -4, homeCode: "BRA", awayCode: "MAR", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  groupMatch({ number: 8, groupKey: "B", date: "2026-06-13", time: "12:00", utcOffset: -7, homeCode: "QAT", awayCode: "SUI", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  groupMatch({ number: 9, groupKey: "E", date: "2026-06-14", time: "19:00", utcOffset: -4, homeCode: "CIV", awayCode: "ECU", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  groupMatch({ number: 10, groupKey: "E", date: "2026-06-14", time: "12:00", utcOffset: -5, homeCode: "GER", awayCode: "CUW", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  groupMatch({ number: 11, groupKey: "F", date: "2026-06-14", time: "15:00", utcOffset: -5, homeCode: "NED", awayCode: "JPN", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  groupMatch({ number: 12, groupKey: "F", date: "2026-06-14", time: "20:00", utcOffset: -6, homeCode: "SWE", awayCode: "TUN", venue: "Estadio BBVA", city: "Guadalupe", country: "Mexico" }),
  groupMatch({ number: 13, groupKey: "H", date: "2026-06-15", time: "18:00", utcOffset: -4, homeCode: "KSA", awayCode: "URU", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  groupMatch({ number: 14, groupKey: "H", date: "2026-06-15", time: "12:00", utcOffset: -4, homeCode: "ESP", awayCode: "CPV", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  groupMatch({ number: 15, groupKey: "G", date: "2026-06-15", time: "18:00", utcOffset: -7, homeCode: "IRN", awayCode: "NZL", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  groupMatch({ number: 16, groupKey: "G", date: "2026-06-15", time: "12:00", utcOffset: -7, homeCode: "BEL", awayCode: "EGY", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  groupMatch({ number: 17, groupKey: "I", date: "2026-06-16", time: "15:00", utcOffset: -4, homeCode: "FRA", awayCode: "SEN", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  groupMatch({ number: 18, groupKey: "I", date: "2026-06-16", time: "18:00", utcOffset: -4, homeCode: "IRQ", awayCode: "NOR", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  groupMatch({ number: 19, groupKey: "J", date: "2026-06-16", time: "20:00", utcOffset: -5, homeCode: "ARG", awayCode: "ALG", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  groupMatch({ number: 20, groupKey: "J", date: "2026-06-16", time: "21:00", utcOffset: -7, homeCode: "AUT", awayCode: "JOR", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  groupMatch({ number: 21, groupKey: "L", date: "2026-06-17", time: "19:00", utcOffset: -4, homeCode: "GHA", awayCode: "PAN", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  groupMatch({ number: 22, groupKey: "L", date: "2026-06-17", time: "15:00", utcOffset: -5, homeCode: "ENG", awayCode: "CRO", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  groupMatch({ number: 23, groupKey: "K", date: "2026-06-17", time: "12:00", utcOffset: -5, homeCode: "POR", awayCode: "COD", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  groupMatch({ number: 24, groupKey: "K", date: "2026-06-17", time: "20:00", utcOffset: -6, homeCode: "UZB", awayCode: "COL", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" }),
  groupMatch({ number: 25, groupKey: "A", date: "2026-06-18", time: "12:00", utcOffset: -4, homeCode: "CZE", awayCode: "RSA", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  groupMatch({ number: 26, groupKey: "B", date: "2026-06-18", time: "12:00", utcOffset: -7, homeCode: "SUI", awayCode: "BIH", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  groupMatch({ number: 27, groupKey: "B", date: "2026-06-18", time: "15:00", utcOffset: -7, homeCode: "CAN", awayCode: "QAT", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  groupMatch({ number: 28, groupKey: "A", date: "2026-06-18", time: "19:00", utcOffset: -6, homeCode: "MEX", awayCode: "KOR", venue: "Estadio Akron", city: "Zapopan", country: "Mexico" }),
  groupMatch({ number: 29, groupKey: "C", date: "2026-06-19", time: "20:30", utcOffset: -4, homeCode: "BRA", awayCode: "HAI", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  groupMatch({ number: 30, groupKey: "C", date: "2026-06-19", time: "18:00", utcOffset: -4, homeCode: "SCO", awayCode: "MAR", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  groupMatch({ number: 31, groupKey: "D", date: "2026-06-19", time: "20:00", utcOffset: -7, homeCode: "TUR", awayCode: "PAR", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  groupMatch({ number: 32, groupKey: "D", date: "2026-06-19", time: "12:00", utcOffset: -7, homeCode: "USA", awayCode: "AUS", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  groupMatch({ number: 33, groupKey: "E", date: "2026-06-20", time: "16:00", utcOffset: -4, homeCode: "GER", awayCode: "CIV", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  groupMatch({ number: 34, groupKey: "E", date: "2026-06-20", time: "19:00", utcOffset: -5, homeCode: "ECU", awayCode: "CUW", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  groupMatch({ number: 35, groupKey: "F", date: "2026-06-20", time: "12:00", utcOffset: -5, homeCode: "NED", awayCode: "SWE", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  groupMatch({ number: 36, groupKey: "F", date: "2026-06-20", time: "22:00", utcOffset: -6, homeCode: "TUN", awayCode: "JPN", venue: "Estadio BBVA", city: "Guadalupe", country: "Mexico" }),
  groupMatch({ number: 37, groupKey: "H", date: "2026-06-21", time: "18:00", utcOffset: -4, homeCode: "URU", awayCode: "CPV", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  groupMatch({ number: 38, groupKey: "H", date: "2026-06-21", time: "12:00", utcOffset: -4, homeCode: "ESP", awayCode: "KSA", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  groupMatch({ number: 39, groupKey: "G", date: "2026-06-21", time: "12:00", utcOffset: -7, homeCode: "BEL", awayCode: "IRN", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  groupMatch({ number: 40, groupKey: "G", date: "2026-06-21", time: "18:00", utcOffset: -7, homeCode: "NZL", awayCode: "EGY", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  groupMatch({ number: 41, groupKey: "I", date: "2026-06-22", time: "20:00", utcOffset: -4, homeCode: "NOR", awayCode: "SEN", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  groupMatch({ number: 42, groupKey: "I", date: "2026-06-22", time: "17:00", utcOffset: -4, homeCode: "FRA", awayCode: "IRQ", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  groupMatch({ number: 43, groupKey: "J", date: "2026-06-22", time: "12:00", utcOffset: -5, homeCode: "ARG", awayCode: "AUT", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  groupMatch({ number: 44, groupKey: "J", date: "2026-06-22", time: "20:00", utcOffset: -7, homeCode: "JOR", awayCode: "ALG", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  groupMatch({ number: 45, groupKey: "L", date: "2026-06-23", time: "16:00", utcOffset: -4, homeCode: "ENG", awayCode: "GHA", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  groupMatch({ number: 46, groupKey: "L", date: "2026-06-23", time: "19:00", utcOffset: -4, homeCode: "PAN", awayCode: "CRO", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  groupMatch({ number: 47, groupKey: "K", date: "2026-06-23", time: "12:00", utcOffset: -5, homeCode: "POR", awayCode: "UZB", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  groupMatch({ number: 48, groupKey: "K", date: "2026-06-23", time: "20:00", utcOffset: -6, homeCode: "COL", awayCode: "COD", venue: "Estadio Akron", city: "Zapopan", country: "Mexico" }),
  groupMatch({ number: 49, groupKey: "C", date: "2026-06-24", time: "18:00", utcOffset: -4, homeCode: "SCO", awayCode: "BRA", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  groupMatch({ number: 50, groupKey: "C", date: "2026-06-24", time: "18:00", utcOffset: -4, homeCode: "MAR", awayCode: "HAI", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  groupMatch({ number: 51, groupKey: "B", date: "2026-06-24", time: "12:00", utcOffset: -7, homeCode: "SUI", awayCode: "CAN", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  groupMatch({ number: 52, groupKey: "B", date: "2026-06-24", time: "12:00", utcOffset: -7, homeCode: "BIH", awayCode: "QAT", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  groupMatch({ number: 53, groupKey: "A", date: "2026-06-24", time: "19:00", utcOffset: -6, homeCode: "CZE", awayCode: "MEX", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" }),
  groupMatch({ number: 54, groupKey: "A", date: "2026-06-24", time: "19:00", utcOffset: -6, homeCode: "RSA", awayCode: "KOR", venue: "Estadio BBVA", city: "Guadalupe", country: "Mexico" }),
  groupMatch({ number: 55, groupKey: "E", date: "2026-06-25", time: "16:00", utcOffset: -4, homeCode: "CUW", awayCode: "CIV", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  groupMatch({ number: 56, groupKey: "E", date: "2026-06-25", time: "16:00", utcOffset: -4, homeCode: "ECU", awayCode: "GER", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  groupMatch({ number: 57, groupKey: "F", date: "2026-06-25", time: "18:00", utcOffset: -5, homeCode: "JPN", awayCode: "SWE", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  groupMatch({ number: 58, groupKey: "F", date: "2026-06-25", time: "18:00", utcOffset: -5, homeCode: "TUN", awayCode: "NED", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  groupMatch({ number: 59, groupKey: "D", date: "2026-06-25", time: "19:00", utcOffset: -7, homeCode: "TUR", awayCode: "USA", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  groupMatch({ number: 60, groupKey: "D", date: "2026-06-25", time: "19:00", utcOffset: -7, homeCode: "PAR", awayCode: "AUS", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  groupMatch({ number: 61, groupKey: "I", date: "2026-06-26", time: "15:00", utcOffset: -4, homeCode: "NOR", awayCode: "FRA", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  groupMatch({ number: 62, groupKey: "I", date: "2026-06-26", time: "15:00", utcOffset: -4, homeCode: "SEN", awayCode: "IRQ", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  groupMatch({ number: 63, groupKey: "G", date: "2026-06-26", time: "20:00", utcOffset: -7, homeCode: "EGY", awayCode: "IRN", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  groupMatch({ number: 64, groupKey: "G", date: "2026-06-26", time: "20:00", utcOffset: -7, homeCode: "NZL", awayCode: "BEL", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  groupMatch({ number: 65, groupKey: "H", date: "2026-06-26", time: "19:00", utcOffset: -5, homeCode: "CPV", awayCode: "KSA", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  groupMatch({ number: 66, groupKey: "H", date: "2026-06-26", time: "18:00", utcOffset: -6, homeCode: "URU", awayCode: "ESP", venue: "Estadio Akron", city: "Zapopan", country: "Mexico" }),
  groupMatch({ number: 67, groupKey: "L", date: "2026-06-27", time: "17:00", utcOffset: -4, homeCode: "PAN", awayCode: "ENG", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  groupMatch({ number: 68, groupKey: "L", date: "2026-06-27", time: "17:00", utcOffset: -4, homeCode: "CRO", awayCode: "GHA", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  groupMatch({ number: 69, groupKey: "J", date: "2026-06-27", time: "21:00", utcOffset: -5, homeCode: "ALG", awayCode: "AUT", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  groupMatch({ number: 70, groupKey: "J", date: "2026-06-27", time: "21:00", utcOffset: -5, homeCode: "JOR", awayCode: "ARG", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  groupMatch({ number: 71, groupKey: "K", date: "2026-06-27", time: "19:30", utcOffset: -4, homeCode: "COL", awayCode: "POR", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  groupMatch({ number: 72, groupKey: "K", date: "2026-06-27", time: "19:30", utcOffset: -4, homeCode: "COD", awayCode: "UZB", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  knockoutMatch({ number: 73, phase: Phase.ROUND_OF_32, date: "2026-06-28", time: "12:00", utcOffset: -7, homePlaceholder: "2o Grupo A", awayPlaceholder: "2o Grupo B", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  knockoutMatch({ number: 74, phase: Phase.ROUND_OF_32, date: "2026-06-29", time: "16:30", utcOffset: -4, homePlaceholder: "1o Grupo E", awayPlaceholder: "3o Grupo A/B/C/D/F", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  knockoutMatch({ number: 75, phase: Phase.ROUND_OF_32, date: "2026-06-29", time: "19:00", utcOffset: -6, homePlaceholder: "1o Grupo F", awayPlaceholder: "2o Grupo C", venue: "Estadio BBVA", city: "Guadalupe", country: "Mexico" }),
  knockoutMatch({ number: 76, phase: Phase.ROUND_OF_32, date: "2026-06-29", time: "12:00", utcOffset: -5, homePlaceholder: "1o Grupo C", awayPlaceholder: "2o Grupo F", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  knockoutMatch({ number: 77, phase: Phase.ROUND_OF_32, date: "2026-06-30", time: "17:00", utcOffset: -4, homePlaceholder: "1o Grupo I", awayPlaceholder: "3o Grupo C/D/F/G/H", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  knockoutMatch({ number: 78, phase: Phase.ROUND_OF_32, date: "2026-06-30", time: "12:00", utcOffset: -5, homePlaceholder: "2o Grupo E", awayPlaceholder: "2o Grupo I", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  knockoutMatch({ number: 79, phase: Phase.ROUND_OF_32, date: "2026-06-30", time: "19:00", utcOffset: -6, homePlaceholder: "1o Grupo A", awayPlaceholder: "3o Grupo C/E/F/H/I", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" }),
  knockoutMatch({ number: 80, phase: Phase.ROUND_OF_32, date: "2026-07-01", time: "12:00", utcOffset: -4, homePlaceholder: "1o Grupo L", awayPlaceholder: "3o Grupo E/H/I/J/K", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  knockoutMatch({ number: 81, phase: Phase.ROUND_OF_32, date: "2026-07-01", time: "17:00", utcOffset: -7, homePlaceholder: "1o Grupo D", awayPlaceholder: "3o Grupo B/E/F/I/J", venue: "Levi's Stadium", city: "Santa Clara", country: "Estados Unidos" }),
  knockoutMatch({ number: 82, phase: Phase.ROUND_OF_32, date: "2026-07-01", time: "13:00", utcOffset: -7, homePlaceholder: "1o Grupo G", awayPlaceholder: "3o Grupo A/E/H/I/J", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  knockoutMatch({ number: 83, phase: Phase.ROUND_OF_32, date: "2026-07-02", time: "19:00", utcOffset: -4, homePlaceholder: "2o Grupo K", awayPlaceholder: "2o Grupo L", venue: "BMO Field", city: "Toronto", country: "Canada" }),
  knockoutMatch({ number: 84, phase: Phase.ROUND_OF_32, date: "2026-07-02", time: "12:00", utcOffset: -7, homePlaceholder: "1o Grupo H", awayPlaceholder: "2o Grupo J", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  knockoutMatch({ number: 85, phase: Phase.ROUND_OF_32, date: "2026-07-02", time: "20:00", utcOffset: -7, homePlaceholder: "1o Grupo B", awayPlaceholder: "3o Grupo E/F/G/I/J", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  knockoutMatch({ number: 86, phase: Phase.ROUND_OF_32, date: "2026-07-03", time: "18:00", utcOffset: -4, homePlaceholder: "1o Grupo J", awayPlaceholder: "2o Grupo H", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  knockoutMatch({ number: 87, phase: Phase.ROUND_OF_32, date: "2026-07-03", time: "20:30", utcOffset: -5, homePlaceholder: "1o Grupo K", awayPlaceholder: "3o Grupo D/E/I/J/L", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  knockoutMatch({ number: 88, phase: Phase.ROUND_OF_32, date: "2026-07-03", time: "13:00", utcOffset: -5, homePlaceholder: "2o Grupo D", awayPlaceholder: "2o Grupo G", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  knockoutMatch({ number: 89, phase: Phase.ROUND_OF_16, date: "2026-07-04", time: "17:00", utcOffset: -4, homePlaceholder: "Vencedor J74", awayPlaceholder: "Vencedor J77", venue: "Lincoln Financial Field", city: "Philadelphia", country: "Estados Unidos" }),
  knockoutMatch({ number: 90, phase: Phase.ROUND_OF_16, date: "2026-07-04", time: "12:00", utcOffset: -5, homePlaceholder: "Vencedor J73", awayPlaceholder: "Vencedor J75", venue: "NRG Stadium", city: "Houston", country: "Estados Unidos" }),
  knockoutMatch({ number: 91, phase: Phase.ROUND_OF_16, date: "2026-07-05", time: "16:00", utcOffset: -4, homePlaceholder: "Vencedor J76", awayPlaceholder: "Vencedor J78", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" }),
  knockoutMatch({ number: 92, phase: Phase.ROUND_OF_16, date: "2026-07-05", time: "18:00", utcOffset: -6, homePlaceholder: "Vencedor J79", awayPlaceholder: "Vencedor J80", venue: "Estadio Azteca", city: "Mexico City", country: "Mexico" }),
  knockoutMatch({ number: 93, phase: Phase.ROUND_OF_16, date: "2026-07-06", time: "14:00", utcOffset: -5, homePlaceholder: "Vencedor J83", awayPlaceholder: "Vencedor J84", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  knockoutMatch({ number: 94, phase: Phase.ROUND_OF_16, date: "2026-07-06", time: "17:00", utcOffset: -7, homePlaceholder: "Vencedor J81", awayPlaceholder: "Vencedor J82", venue: "Lumen Field", city: "Seattle", country: "Estados Unidos" }),
  knockoutMatch({ number: 95, phase: Phase.ROUND_OF_16, date: "2026-07-07", time: "12:00", utcOffset: -4, homePlaceholder: "Vencedor J86", awayPlaceholder: "Vencedor J88", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  knockoutMatch({ number: 96, phase: Phase.ROUND_OF_16, date: "2026-07-07", time: "13:00", utcOffset: -7, homePlaceholder: "Vencedor J85", awayPlaceholder: "Vencedor J87", venue: "BC Place", city: "Vancouver", country: "Canada" }),
  knockoutMatch({ number: 97, phase: Phase.QUARTER_FINAL, date: "2026-07-09", time: "16:00", utcOffset: -4, homePlaceholder: "Vencedor J89", awayPlaceholder: "Vencedor J90", venue: "Gillette Stadium", city: "Foxborough", country: "Estados Unidos" }),
  knockoutMatch({ number: 98, phase: Phase.QUARTER_FINAL, date: "2026-07-10", time: "12:00", utcOffset: -7, homePlaceholder: "Vencedor J93", awayPlaceholder: "Vencedor J94", venue: "SoFi Stadium", city: "Inglewood", country: "Estados Unidos" }),
  knockoutMatch({ number: 99, phase: Phase.QUARTER_FINAL, date: "2026-07-11", time: "17:00", utcOffset: -4, homePlaceholder: "Vencedor J91", awayPlaceholder: "Vencedor J92", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  knockoutMatch({ number: 100, phase: Phase.QUARTER_FINAL, date: "2026-07-11", time: "20:00", utcOffset: -5, homePlaceholder: "Vencedor J95", awayPlaceholder: "Vencedor J96", venue: "Arrowhead Stadium", city: "Kansas City", country: "Estados Unidos" }),
  knockoutMatch({ number: 101, phase: Phase.SEMI_FINAL, date: "2026-07-14", time: "14:00", utcOffset: -5, homePlaceholder: "Vencedor J97", awayPlaceholder: "Vencedor J98", venue: "AT&T Stadium", city: "Arlington", country: "Estados Unidos" }),
  knockoutMatch({ number: 102, phase: Phase.SEMI_FINAL, date: "2026-07-15", time: "15:00", utcOffset: -4, homePlaceholder: "Vencedor J99", awayPlaceholder: "Vencedor J100", venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "Estados Unidos" }),
  knockoutMatch({ number: 103, phase: Phase.THIRD_PLACE, date: "2026-07-18", time: "17:00", utcOffset: -4, homePlaceholder: "Perdedor J101", awayPlaceholder: "Perdedor J102", venue: "Hard Rock Stadium", city: "Miami Gardens", country: "Estados Unidos" }),
  knockoutMatch({ number: 104, phase: Phase.FINAL, date: "2026-07-19", time: "15:00", utcOffset: -4, homePlaceholder: "Vencedor J101", awayPlaceholder: "Vencedor J102", venue: "MetLife Stadium", city: "East Rutherford", country: "Estados Unidos" })
];

export function buildTournamentMatches(teamIdByCode: Map<string, string>): TournamentMatchSeed[] {
  return officialMatches
    .map((match) => {
      const matchStartsAt = startsAt(match.date, match.time, match.utcOffset);

      return {
        number: match.number,
        slug: `match-${String(match.number).padStart(3, "0")}`,
        phase: match.phase,
        groupKey: match.groupKey ?? null,
        startsAt: matchStartsAt,
        lockAt: getMatchLockDate(matchStartsAt),
        venue: match.venue,
        city: match.city,
        country: match.country,
        homeTeamId: match.homeCode ? teamIdByCode.get(match.homeCode) : null,
        awayTeamId: match.awayCode ? teamIdByCode.get(match.awayCode) : null,
        homePlaceholder: match.homePlaceholder ?? null,
        awayPlaceholder: match.awayPlaceholder ?? null
      };
    })
    .sort((left, right) => left.number - right.number);
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
