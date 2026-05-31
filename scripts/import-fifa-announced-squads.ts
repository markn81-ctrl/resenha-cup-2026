import { PlayerPosition, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SquadPlayer = {
  name: string;
  position: PlayerPosition;
};

type SquadImport = {
  code: string;
  sourceUrl: string;
  status: "announced" | "preliminary";
  players: SquadPlayer[];
};

function players(position: PlayerPosition, names: string[]): SquadPlayer[] {
  return names.map((name) => ({ name, position }));
}

const squads: SquadImport[] = [
  {
    code: "AUT",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/austria-ralf-rangnick-world-cup-squad",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Patrick Pentz", "Alexander Schlager", "Florian Wiegele"]),
      ...players(PlayerPosition.DEFENDER, [
        "David Affengruber",
        "David Alaba",
        "Kevin Danso",
        "Marco Friedl",
        "Philipp Lienhart",
        "Phillipp Mwene",
        "Stefan Posch",
        "Alexander Prass",
        "Michael Svoboda"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Christoph Baumgartner",
        "Carney Chukwuemeka",
        "Florian Grillitsch",
        "Konrad Laimer",
        "Marcel Sabitzer",
        "Xaver Schlager",
        "Romano Schmid",
        "Alessandro Schopf",
        "Nicolas Seiwald",
        "Paul Wanner",
        "Patrick Wimmer"
      ]),
      ...players(PlayerPosition.FORWARD, ["Marko Arnautovic", "Michael Gregoritsch", "Sasa Kalajdzic"])
    ]
  },
  {
    code: "BEL",
    status: "announced",
    sourceUrl: "https://www.fifa.com/en/articles/belgium-squad-garcia-lukaku-named",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Thibaut Courtois", "Senne Lammens", "Mike Penders"]),
      ...players(PlayerPosition.DEFENDER, [
        "Timothy Castagne",
        "Zeno Debast",
        "Maxim De Cuyper",
        "Koni De Winter",
        "Brandon Mechele",
        "Thomas Meunier",
        "Nathan Ngoy",
        "Joaquin Seys",
        "Arthur Theate"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Kevin De Bruyne",
        "Amadou Onana",
        "Nicolas Raskin",
        "Youri Tielemans",
        "Hans Vanaken",
        "Axel Witsel"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Charles De Ketelaere",
        "Jeremy Doku",
        "Matias Fernandez-Pardo",
        "Romelu Lukaku",
        "Dodi Lukebakio",
        "Diego Moreira",
        "Alexis Saelemaekers",
        "Leandro Trossard"
      ])
    ]
  },
  {
    code: "BRA",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/brazil-squad-announcement-carlo-ancelotti",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Alisson", "Ederson", "Weverton"]),
      ...players(PlayerPosition.DEFENDER, [
        "Alex Sandro",
        "Bremer",
        "Danilo",
        "Douglas Santos",
        "Gabriel Magalhaes",
        "Ibanez",
        "Leo Pereira",
        "Marquinhos",
        "Wesley"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Bruno Guimaraes",
        "Casemiro",
        "Danilo Santos",
        "Fabinho",
        "Lucas Paqueta"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Endrick",
        "Gabriel Martinelli",
        "Igor Thiago",
        "Luiz Henrique",
        "Matheus Cunha",
        "Neymar Junior",
        "Raphinha",
        "Rayan",
        "Vinicius Junior"
      ])
    ]
  },
  {
    code: "CAN",
    status: "announced",
    sourceUrl: "https://www.fifa.com/en/articles/canada-squad-announcement",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Maxime Crepeau", "Owen Goodman", "Dayne St. Clair"]),
      ...players(PlayerPosition.DEFENDER, [
        "Moise Bombito",
        "Derek Cornelius",
        "Alphonso Davies",
        "Luc de Fougerolles",
        "Alistair Johnston",
        "Alfie Jones",
        "Richie Laryea",
        "Niko Sigur",
        "Joel Waterman"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Ali Ahmed",
        "Tajon Buchanan",
        "Mathieu Choiniere",
        "Stephen Eustaquio",
        "Marcelo Flores",
        "Ismael Kone",
        "Liam Millar",
        "Jonathan Osorio",
        "Nathan-Dylan Saliba",
        "Jacob Shaffelburg"
      ]),
      ...players(PlayerPosition.FORWARD, ["Jonathan David", "Promise David", "Cyle Larin", "Tani Oluwaseyi"])
    ]
  },
  {
    code: "CIV",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/cote-divoire-squad-announcement-emerse-fae",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Yahia Fofana", "Mohamed Kone", "Alban Lafont"]),
      ...players(PlayerPosition.DEFENDER, [
        "Emmanuel Agbadou",
        "Christopher Operi",
        "Ousmane Diomande",
        "Guela Doue",
        "Ghislain Konan",
        "Odilon Kossounou",
        "Wilfried Singo",
        "Evan Ndicka"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Seko Fofana",
        "Parfait Guiagon",
        "Christ Inao Oulai",
        "Franck Kessie",
        "Ibrahim Sangare",
        "Jean Michael Seri"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Simon Adingra",
        "Ange-Yoan Bonny",
        "Amad Diallo",
        "Oumar Diakite",
        "Yan Diomande",
        "Evann Guessand",
        "Nicolas Pepe",
        "Bazoumana Toure",
        "Elye Wahi"
      ])
    ]
  },
  {
    code: "CZE",
    status: "preliminary",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/czechia-world-cup-squad-announced",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Lukas Hornicek", "Matej Kovar", "Jindrich Stanek"]),
      ...players(PlayerPosition.DEFENDER, [
        "Vladimir Coufal",
        "David Doudera",
        "Tomas Holes",
        "Robin Hranac",
        "Stepan Chaloupek",
        "David Jurasek",
        "Ladislav Krejci",
        "Jaroslav Zeleny",
        "David Zima"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Pavel Bucha",
        "Lukas Cerv",
        "Vladimir Darida",
        "Tomas Ladra",
        "Lukas Provod",
        "Michal Sadilek",
        "Hugo Sochurek",
        "Alexandr Sojka",
        "Tomas Soucek",
        "Pavel Sulc",
        "Denis Visinsky"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Adam Hlozek",
        "Tomas Chory",
        "Mojmir Chytil",
        "Christophe Kabongo",
        "Jan Kuchta",
        "Patrik Schick"
      ])
    ]
  },
  {
    code: "ENG",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/england-squad-named-thomas-tuchel",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Dean Henderson", "Jordan Pickford", "James Trafford"]),
      ...players(PlayerPosition.DEFENDER, [
        "Dan Burn",
        "Marc Guehi",
        "Reece James",
        "Ezri Konsa",
        "Tino Livramento",
        "Nico O'Reilly",
        "Jarell Quansah",
        "Djed Spence",
        "John Stones"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Elliott Anderson",
        "Jude Bellingham",
        "Eberechi Eze",
        "Jordan Henderson",
        "Kobbie Mainoo",
        "Declan Rice",
        "Morgan Rogers"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Anthony Gordon",
        "Harry Kane",
        "Noni Madueke",
        "Marcus Rashford",
        "Bukayo Saka",
        "Ivan Toney",
        "Ollie Watkins"
      ])
    ]
  },
  {
    code: "ESP",
    status: "announced",
    sourceUrl: "https://www.fifa.com/en/articles/spain-squad-announcement-luis-de-la-fuente",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Unai Simon", "David Raya", "Joan Garcia"]),
      ...players(PlayerPosition.DEFENDER, [
        "Pedro Porro",
        "Marcos Llorente",
        "Aymeric Laporte",
        "Pau Cubarsi",
        "Marc Pubill",
        "Eric Garcia",
        "Marc Cucurella",
        "Alejandro Grimaldo"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Rodrigo Hernandez",
        "Martin Zubimendi",
        "Pedri Gonzalez",
        "Fabian Ruiz",
        "Mikel Merino",
        "Pablo Paez Gavi",
        "Alex Baena"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Mikel Oyarzabal",
        "Lamine Yamal",
        "Ferran Torres",
        "Borja Iglesias",
        "Dani Olmo",
        "Victor Munoz",
        "Nico Williams",
        "Yeremy Pino"
      ])
    ]
  },
  {
    code: "FRA",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/france-world-cup-squad-named",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Mike Maignan", "Robin Risser", "Brice Samba"]),
      ...players(PlayerPosition.DEFENDER, [
        "Lucas Digne",
        "Malo Gusto",
        "Lucas Hernandez",
        "Theo Hernandez",
        "Ibrahima Konate",
        "Jules Kounde",
        "Maxence Lacroix",
        "William Saliba",
        "Dayot Upamecano"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "N'Golo Kante",
        "Manu Kone",
        "Adrien Rabiot",
        "Aurelien Tchouameni",
        "Warren Zaire-Emery"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Maghnes Akliouche",
        "Bradley Barcola",
        "Rayan Cherki",
        "Ousmane Dembele",
        "Desire Doue",
        "Jean-Philippe Mateta",
        "Kylian Mbappe",
        "Michael Olise",
        "Marcus Thuram"
      ])
    ]
  },
  {
    code: "GER",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/germany-squad-neuer-nagelsmann-named",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Oliver Baumann", "Manuel Neuer", "Alexander Nubel"]),
      ...players(PlayerPosition.DEFENDER, [
        "Waldemar Anton",
        "Nathaniel Brown",
        "Joshua Kimmich",
        "David Raum",
        "Antonio Rudiger",
        "Nico Schlotterbeck",
        "Jonathan Tah",
        "Malick Thiaw"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Nadiem Amiri",
        "Leon Goretzka",
        "Pascal Gross",
        "Lennart Karl",
        "Jamie Leweling",
        "Jamal Musiala",
        "Felix Nmecha",
        "Aleksandar Pavlovic",
        "Leroy Sane",
        "Angelo Stiller",
        "Florian Wirtz"
      ]),
      ...players(PlayerPosition.FORWARD, ["Maximilian Beier", "Kai Havertz", "Deniz Undav", "Nick Woltemade"])
    ]
  },
  {
    code: "HAI",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/haiti-squad-announcement-sebastien-migne",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Josue Duverger", "Alexandre Pierre", "Johny Placide"]),
      ...players(PlayerPosition.DEFENDER, [
        "Ricardo Ade",
        "Carlens Arcus",
        "Hannes Delcroix",
        "Jean-Kevin Duverne",
        "Martin Experience",
        "Duke Lacroix",
        "Wilguens Paugain",
        "Keeto Thermoncy"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Carl Fred Sainte",
        "Jean-Ricner Bellegarde",
        "Leverton Pierre",
        "Danley Jean Jacques",
        "Woodensky Pierre",
        "Dominique Simon"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Josue Casimir",
        "Louicius Deedson",
        "Derrick Etienne Jr.",
        "Yassin Fortune",
        "Wilson Isidor",
        "Lenny Joseph",
        "Duckens Nazon",
        "Frantzdy Pierrot",
        "Ruben Providence"
      ])
    ]
  },
  {
    code: "JPN",
    status: "announced",
    sourceUrl: "https://www.fifa.com/en/news/articles/japan-squad-announcement",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Tomoki Hayakawa", "Keisuke Osako", "Zion Suzuki"]),
      ...players(PlayerPosition.DEFENDER, [
        "Ko Itakura",
        "Hiroki Ito",
        "Yuto Nagatomo",
        "Ayumu Seko",
        "Yukinari Sugawara",
        "Junnosuke Suzuki",
        "Shogo Taniguchi",
        "Takehiro Tomiyasu",
        "Tsuyoshi Watanabe"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Ritsu Doan",
        "Wataru Endo",
        "Junya Ito",
        "Daichi Kamada",
        "Takefusa Kubo",
        "Keito Nakamura",
        "Kaishu Sano",
        "Ao Tanaka"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Keisuke Goto",
        "Daizen Maeda",
        "Koki Ogawa",
        "Kento Shiogai",
        "Yuito Suzuki",
        "Ayase Ueda"
      ])
    ]
  },
  {
    code: "KOR",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/korea-republic-world-cup-squad-hong-myungbo",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Song Bumkeun", "Jo Hyeonwoo", "Kim Seung-gyu"]),
      ...players(PlayerPosition.DEFENDER, [
        "Jens Castrop",
        "Lee Hanbeom",
        "Park Jinseob",
        "Lee Kihyuk",
        "Kim Minjae",
        "Kim Moonhwan",
        "Kim Taehyeon",
        "Lee Taeseok",
        "Seol Youngwoo",
        "Cho Yumin"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Lee Donggyeong",
        "Hwang Heechan",
        "Yang Hyunjun",
        "Hwang Inbeom",
        "Lee Jaesung",
        "Kim Jingyu",
        "Eom Jisung",
        "Bae Junho",
        "Lee Kangin",
        "Paik Seungho"
      ]),
      ...players(PlayerPosition.FORWARD, ["Cho Guesung", "Son Heungmin", "Oh Hyeongyu"])
    ]
  },
  {
    code: "NED",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/netherlands-ronald-koeman-squad-announced",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Mark Flekken", "Robin Roefs", "Bart Verbruggen"]),
      ...players(PlayerPosition.DEFENDER, [
        "Nathan Ake",
        "Denzel Dumfries",
        "Jorrel Hato",
        "Jurrien Timber",
        "Jan Paul van Hecke",
        "Virgil van Dijk",
        "Micky van de Ven"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Frenkie de Jong",
        "Marten de Roon",
        "Ryan Gravenberch",
        "Teun Koopmeiners",
        "Tijjani Reijnders",
        "Guus Til",
        "Quinten Timber",
        "Mats Wieffer"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Brian Brobbey",
        "Memphis Depay",
        "Cody Gakpo",
        "Justin Kluivert",
        "Noa Lang",
        "Donyell Malen",
        "Crysencio Summerville",
        "Wout Weghorst"
      ])
    ]
  },
  {
    code: "NOR",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/norway-squad-announcement-stale-solbakken",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Orjan Haskjold Nyland", "Egil Selvik", "Sander Tangvik"]),
      ...players(PlayerPosition.DEFENDER, [
        "Kristoffer Vassbakk Ajer",
        "Fredrik Bjorkan",
        "Henrik Falchener",
        "Sondre Langas",
        "Torbjorn Heggem",
        "Marcus Holmgren Pedersen",
        "Julian Ryerson",
        "David Moller Wolfe",
        "Leo Ostigard"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Thelonious Aasgaard",
        "Fredrik Aursnes",
        "Patrick Berg",
        "Sander Berge",
        "Oscar Bobb",
        "Jens Petter Hauge",
        "Antonio Nusa",
        "Andreas Schjelderup",
        "Morten Thorsby",
        "Kristian Thorstvedt",
        "Martin Odegaard"
      ]),
      ...players(PlayerPosition.FORWARD, ["Erling Haaland", "Jorgen Strand Larsen", "Alexander Sorloth"])
    ]
  },
  {
    code: "NZL",
    status: "announced",
    sourceUrl: "https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/nueva-zelanda-convocatoria",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Max Crocombe", "Alex Paulsen", "Michael Woud"]),
      ...players(PlayerPosition.DEFENDER, [
        "Tyler Bindon",
        "Michael Boxall",
        "Liberato Cacace",
        "Francis de Vries",
        "Callan Elliot",
        "Tim Payne",
        "Nando Pijnaker",
        "Tommy Smith",
        "Finn Surman"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Lachlan Bayliss",
        "Joe Bell",
        "Matt Garbett",
        "Eli Just",
        "Callum McCowatt",
        "Ben Old",
        "Alex Rufer",
        "Marko Stamenic",
        "Sarpreet Singh",
        "Ryan Thomas"
      ]),
      ...players(PlayerPosition.FORWARD, ["Kosta Barbarouses", "Jesse Randall", "Ben Waine", "Chris Wood"])
    ]
  },
  {
    code: "POR",
    status: "preliminary",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/cristiano-ronaldo-roberto-martinez-portugal-squad-announcement",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Diogo Costa", "Jose Sa", "Rui Silva", "Ricardo Velho"]),
      ...players(PlayerPosition.DEFENDER, [
        "Tomas Araujo",
        "Joao Cancelo",
        "Diogo Dalot",
        "Ruben Dias",
        "Goncalo Inacio",
        "Nuno Mendes",
        "Matheus Nunes",
        "Nelson Semedo",
        "Renato Veiga"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Samuel Costa",
        "Bruno Fernandes",
        "Joao Neves",
        "Ruben Neves",
        "Bernardo Silva",
        "Vitinha"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Francisco Conceicao",
        "Joao Felix",
        "Goncalo Guedes",
        "Rafael Leao",
        "Pedro Neto",
        "Goncalo Ramos",
        "Cristiano Ronaldo",
        "Francisco Trincao"
      ])
    ]
  },
  {
    code: "RSA",
    status: "preliminary",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/south-africa-hugo-broos-squad-announced",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Ronwen Williams", "Ricardo Goss", "Sipho Chaine", "Brandon Peterson"]),
      ...players(PlayerPosition.DEFENDER, [
        "Khuliso Mudau",
        "Olwethu Makhanya",
        "Bradley Cross",
        "Thabiso Monyane",
        "Thabang Matuludi",
        "Nkosinathi Sibisi",
        "Aubrey Modiba",
        "Khulumani Ndamane",
        "Ime Okon",
        "Samukele Kabini",
        "Mbekezeli Mbokazi"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Teboho Mokoena",
        "Jayden Adams",
        "Brooklyn Poggenpoel",
        "Lebohang Maboe",
        "Thalente Mbatha",
        "Sphephelo Sithole"
      ]),
      ...players(PlayerPosition.FORWARD, [
        "Oswin Appollis",
        "Tshepang Moremi",
        "Evidence Makgopa",
        "Lyle Foster",
        "Iqraam Rayners",
        "Relebohile Mofokeng",
        "Themba Zwane",
        "Patrick Maswanganyi",
        "Kamogelo Sebelebele",
        "Thapelo Morena",
        "Thapelo Maseko"
      ])
    ]
  },
  {
    code: "SCO",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/scotland-squad-announced-steve-clarke",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Craig Gordon", "Angus Gunn", "Liam Kelly"]),
      ...players(PlayerPosition.DEFENDER, [
        "Grant Hanley",
        "Jack Hendry",
        "Aaron Hickey",
        "Dom Hyam",
        "Scott McKenna",
        "Nathan Patterson",
        "Anthony Ralston",
        "Andy Robertson",
        "John Souttar",
        "Kieran Tierney"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Ryan Christie",
        "Findlay Curtis",
        "Lewis Ferguson",
        "Ben Gannon-Doak",
        "Billy Gilmour",
        "John McGinn",
        "Kenny McLean",
        "Scott McTominay"
      ]),
      ...players(PlayerPosition.FORWARD, ["Che Adams", "Lyndon Dykes", "George Hirst", "Lawrence Shankland", "Ross Stewart"])
    ]
  },
  {
    code: "USA",
    status: "announced",
    sourceUrl:
      "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/usa-squad-announcement-mauricio-pochettino",
    players: [
      ...players(PlayerPosition.GOALKEEPER, ["Chris Brady", "Matt Freese", "Matt Turner"]),
      ...players(PlayerPosition.DEFENDER, [
        "Max Arfsten",
        "Sergino Dest",
        "Alex Freeman",
        "Mark McKenzie",
        "Tim Ream",
        "Chris Richards",
        "Antonee Robinson",
        "Miles Robinson",
        "Joe Scally",
        "Auston Trusty"
      ]),
      ...players(PlayerPosition.MIDFIELDER, [
        "Tyler Adams",
        "Sebastian Berhalter",
        "Weston McKennie",
        "Cristian Roldan",
        "Brenden Aaronson",
        "Christian Pulisic",
        "Gio Reyna",
        "Malik Tillman",
        "Timothy Weah",
        "Alejandro Zendejas"
      ]),
      ...players(PlayerPosition.FORWARD, ["Folarin Balogun", "Ricardo Pepi", "Haji Wright"])
    ]
  }
];

function shortName(name: string) {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(-2)
    .join(" ");
}

async function importSquad(squad: SquadImport) {
  const team = await prisma.team.findUnique({
    where: { code: squad.code },
    select: { id: true, code: true, name: true }
  });

  if (!team) {
    return { code: squad.code, skipped: true, reason: "team_not_found", count: 0 };
  }

  const activeSlots = squad.players.map((_, index) => index + 1);

  await prisma.$transaction(async (tx) => {
    await tx.player.updateMany({
      where: {
        teamId: team.id,
        slotNumber: {
          notIn: activeSlots
        }
      },
      data: {
        isActive: false
      }
    });

    for (const [index, player] of squad.players.entries()) {
      const slotNumber = index + 1;

      await tx.player.upsert({
        where: {
          teamId_slotNumber: {
            teamId: team.id,
            slotNumber
          }
        },
        update: {
          name: player.name,
          shortName: shortName(player.name),
          position: player.position,
          isOfficial: true,
          isActive: true
        },
        create: {
          teamId: team.id,
          slotNumber,
          name: player.name,
          shortName: shortName(player.name),
          position: player.position,
          isOfficial: true,
          isActive: true
        }
      });
    }

    await tx.auditLog.create({
      data: {
        action: "players.fifa_squad_imported",
        entityType: "Team",
        entityId: team.id,
        payload: {
          code: team.code,
          name: team.name,
          status: squad.status,
          sourceUrl: squad.sourceUrl,
          players: squad.players.length
        }
      }
    });
  });

  return {
    code: team.code,
    skipped: false,
    status: squad.status,
    count: squad.players.length
  };
}

async function main() {
  const results = [];

  for (const squad of squads) {
    results.push(await importSquad(squad));
  }

  console.table(results);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
