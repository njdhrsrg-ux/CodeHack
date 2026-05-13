export const RINGBOUND_RING_TYPES = {
  attribute: { id: "attribute", label: "Atributo", color: "#4aa8ff" },
  word: { id: "word", label: "Palavra", color: "#ffd84d" },
  place: { id: "place", label: "Lugar", color: "#ff5a6f" }
};

export const RINGBOUND_RULES = {
  Geral: {
    attribute: [
      { code: "G_A_METAL", label: "tem metal" },
      { code: "G_A_COLD", label: "costuma ser frio" },
      { code: "G_A_HOLE", label: "tem um ou mais buracos" }
    ],
    word: [
      { code: "G_W_3SYL", label: "tem exatamente 3 silabas" },
      { code: "G_W_A", label: "tem a letra A" },
      { code: "G_W_DOUBLE", label: "tem letra repetida" }
    ],
    place: [
      { code: "G_P_KITCHEN", label: "pode ser encontrado na cozinha" },
      { code: "G_P_PICNIC", label: "pode aparecer em um piquenique" },
      { code: "G_P_SCHOOL", label: "pode ser encontrado em uma escola" }
    ]
  },
  Pokemon: {
    attribute: [
      { code: "P_A_FIREWEAK", label: "e fraco contra fogo" },
      { code: "P_A_EVOLVES", label: "tem evolucao na linha evolutiva" },
      { code: "P_A_ASH", label: "ja foi do time do Ash" }
    ],
    word: [
      { code: "P_W_A", label: "tem a letra A" },
      { code: "P_W_6PLUS", label: "tem 6 ou mais letras" },
      { code: "P_W_DOUBLE", label: "tem letra repetida" }
    ],
    place: [
      { code: "P_P_KANTO", label: "aparece em Kanto" },
      { code: "P_P_WATER", label: "pode ser encontrado perto de agua" },
      { code: "P_P_FOREST", label: "pode ser encontrado em florestas" }
    ]
  },
  Filmes: {
    attribute: [
      { code: "F_A_ANIMATED", label: "e animado" },
      { code: "F_A_OSCAR", label: "venceu ou disputou Oscar importante" },
      { code: "F_A_FANTASY", label: "tem fantasia ou ficcao especulativa" }
    ],
    word: [
      { code: "F_W_ONE", label: "tem titulo de uma palavra" },
      { code: "F_W_A", label: "tem a letra A no titulo" },
      { code: "F_W_8PLUS", label: "tem 8 ou mais letras no titulo principal" }
    ],
    place: [
      { code: "F_P_SPACE", label: "tem cenas ou tema espacial" },
      { code: "F_P_CITY", label: "tem cidade marcante" },
      { code: "F_P_SCHOOL", label: "tem ambiente escolar ou infantil" }
    ]
  },
  Jogos: {
    attribute: [
      { code: "J_A_WEAPON", label: "usa arma ou combate direto" },
      { code: "J_A_MAGIC", label: "tem magia ou poder sobrenatural" },
      { code: "J_A_ICON", label: "e mascote ou personagem muito iconico" }
    ],
    word: [
      { code: "J_W_5LESS", label: "tem 5 letras ou menos" },
      { code: "J_W_A", label: "tem a letra A" },
      { code: "J_W_DOUBLE", label: "tem letra repetida" }
    ],
    place: [
      { code: "J_P_NINTENDO", label: "vem de franquia Nintendo" },
      { code: "J_P_FANTASY", label: "vem de mundo de fantasia" },
      { code: "J_P_FUTURE", label: "vem de universo futurista" }
    ]
  },
  Anime: {
    attribute: [
      { code: "A_A_POWER", label: "tem poderes sobrenaturais" },
      { code: "A_A_TEAM", label: "faz parte de grupo ou equipe" },
      { code: "A_A_KIND", label: "tem aparencia ou comportamento gentil" }
    ],
    word: [
      { code: "A_W_5LESS", label: "tem 5 letras ou menos" },
      { code: "A_W_A", label: "tem a letra A" },
      { code: "A_W_FULL", label: "e conhecido por nome e sobrenome" }
    ],
    place: [
      { code: "A_P_SCHOOL", label: "tem ligacao com escola ou academia" },
      { code: "A_P_BATTLE", label: "vem de obra centrada em batalhas" },
      { code: "A_P_FAMILY", label: "tem familia como tema forte" }
    ]
  },
  Geek: {
    attribute: [
      { code: "K_A_MASK", label: "usa mascara ou identidade secreta" },
      { code: "K_A_MAGIC", label: "tem magia ou sobrenatural" },
      { code: "K_A_POWER", label: "tem poderes extraordinarios" }
    ],
    word: [
      { code: "K_W_A", label: "tem a letra A" },
      { code: "K_W_TWO", label: "tem duas palavras no nome" },
      { code: "K_W_8PLUS", label: "tem 8 ou mais letras" }
    ],
    place: [
      { code: "K_P_MARVEL", label: "vem da Marvel" },
      { code: "K_P_DC", label: "vem da DC" },
      { code: "K_P_SPACE", label: "vem de universo espacial" }
    ]
  },
  Famosos: {
    attribute: [
      { code: "X_A_BRAZIL", label: "e brasileiro" },
      { code: "X_A_HISTORY", label: "e figura historica" },
      { code: "X_A_ALIVE", label: "esta vivo atualmente" }
    ],
    word: [
      { code: "X_W_TWO", label: "tem duas palavras no nome" },
      { code: "X_W_A", label: "tem a letra A" },
      { code: "X_W_7PLUS", label: "tem 7 ou mais letras no nome principal" }
    ],
    place: [
      { code: "X_P_MUSIC", label: "tem ligacao com musica" },
      { code: "X_P_SPORT", label: "tem ligacao com esporte" },
      { code: "X_P_SCIENCE", label: "tem ligacao com ciencia" }
    ]
  }
};

export const RINGBOUND_ITEMS = {
  Geral: [
    ["banana", ["G_W_3SYL", "G_W_A", "G_P_KITCHEN", "G_P_PICNIC", "G_P_SCHOOL"]],
    ["colher", ["G_A_METAL", "G_A_COLD", "G_P_KITCHEN", "G_P_PICNIC", "G_P_SCHOOL"]],
    ["panela", ["G_A_METAL", "G_A_HOLE", "G_W_3SYL", "G_W_A", "G_P_KITCHEN"]],
    ["pizza", ["G_A_HOLE", "G_W_A", "G_W_DOUBLE", "G_P_KITCHEN", "G_P_PICNIC"]],
    ["relogio", ["G_A_METAL", "G_A_HOLE", "G_W_3SYL", "G_P_SCHOOL"]],
    ["ventilador", ["G_A_METAL", "G_A_COLD", "G_P_SCHOOL"]],
    ["bicicleta", ["G_A_METAL", "G_W_3SYL", "G_W_A", "G_P_SCHOOL"]],
    ["bola", ["G_A_HOLE", "G_W_A", "G_P_PICNIC", "G_P_SCHOOL"]],
    ["faca", ["G_A_METAL", "G_A_COLD", "G_W_A", "G_P_KITCHEN", "G_P_PICNIC"]],
    ["abacaxi", ["G_W_A", "G_W_DOUBLE", "G_P_KITCHEN", "G_P_PICNIC"]],
    ["lanterna", ["G_A_METAL", "G_A_HOLE", "G_W_3SYL", "G_W_A", "G_P_PICNIC"]],
    ["caderno", ["G_W_3SYL", "G_P_SCHOOL"]],
    ["garrafa", ["G_A_COLD", "G_A_HOLE", "G_W_3SYL", "G_W_A", "G_W_DOUBLE", "G_P_KITCHEN", "G_P_PICNIC", "G_P_SCHOOL"]],
    ["queijo", ["G_A_COLD", "G_P_KITCHEN", "G_P_PICNIC"]]
  ],
  Pokemon: [
    ["Pikachu", ["P_A_EVOLVES", "P_A_ASH", "P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_FOREST"]],
    ["Charizard", ["P_A_ASH", "P_W_A", "P_W_6PLUS", "P_P_KANTO"]],
    ["Squirtle", ["P_A_EVOLVES", "P_A_ASH", "P_W_6PLUS", "P_P_KANTO", "P_P_WATER"]],
    ["Bulbasaur", ["P_A_EVOLVES", "P_A_ASH", "P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_FOREST"]],
    ["Jigglypuff", ["P_W_6PLUS", "P_W_DOUBLE", "P_P_KANTO", "P_P_FOREST"]],
    ["Gyarados", ["P_A_FIREWEAK", "P_A_EVOLVES", "P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_WATER"]],
    ["Magikarp", ["P_A_EVOLVES", "P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_WATER"]],
    ["Lapras", ["P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_WATER"]],
    ["Gengar", ["P_A_EVOLVES", "P_W_6PLUS", "P_P_KANTO"]],
    ["Butterfree", ["P_A_FIREWEAK", "P_A_EVOLVES", "P_A_ASH", "P_W_6PLUS", "P_W_DOUBLE", "P_P_KANTO", "P_P_FOREST"]],
    ["Snorlax", ["P_W_A", "P_W_6PLUS", "P_P_KANTO", "P_P_FOREST"]],
    ["Eevee", ["P_A_EVOLVES", "P_W_DOUBLE", "P_P_KANTO"]]
  ],
  Filmes: [
    ["Toy Story", ["F_A_ANIMATED", "F_A_OSCAR", "F_P_SCHOOL"]],
    ["Avatar", ["F_A_FANTASY", "F_W_ONE", "F_W_A", "F_P_SPACE"]],
    ["Star Wars", ["F_A_FANTASY", "F_W_A", "F_P_SPACE"]],
    ["Matrix", ["F_A_FANTASY", "F_W_ONE", "F_W_A", "F_P_CITY"]],
    ["Frozen", ["F_A_ANIMATED", "F_W_ONE", "F_P_SCHOOL"]],
    ["Shrek", ["F_A_ANIMATED", "F_A_FANTASY", "F_W_ONE"]],
    ["Oppenheimer", ["F_A_OSCAR", "F_W_ONE", "F_W_8PLUS", "F_P_CITY"]],
    ["Batman", ["F_A_FANTASY", "F_W_ONE", "F_W_A", "F_P_CITY"]],
    ["Wall-E", ["F_A_ANIMATED", "F_W_ONE", "F_P_SPACE"]],
    ["Gladiador", ["F_A_OSCAR", "F_W_ONE", "F_W_A", "F_W_8PLUS"]],
    ["Alien", ["F_A_FANTASY", "F_W_ONE", "F_W_A", "F_P_SPACE"]],
    ["Escola de Rock", ["F_W_A", "F_P_SCHOOL"]]
  ],
  Jogos: [
    ["Mario", ["J_A_ICON", "J_W_5LESS", "J_W_A", "J_P_NINTENDO"]],
    ["Link", ["J_A_WEAPON", "J_A_MAGIC", "J_A_ICON", "J_W_5LESS", "J_P_NINTENDO", "J_P_FANTASY"]],
    ["Sonic", ["J_A_ICON", "J_W_5LESS"]],
    ["Kratos", ["J_A_WEAPON", "J_A_MAGIC", "J_A_ICON", "J_W_A", "J_P_FANTASY"]],
    ["Kirby", ["J_A_MAGIC", "J_A_ICON", "J_W_5LESS", "J_P_NINTENDO", "J_P_FANTASY"]],
    ["Samus", ["J_A_WEAPON", "J_A_ICON", "J_W_A", "J_P_NINTENDO", "J_P_FUTURE"]],
    ["Cloud", ["J_A_WEAPON", "J_A_MAGIC", "J_A_ICON", "J_W_5LESS", "J_P_FANTASY"]],
    ["Scorpion", ["J_A_WEAPON", "J_A_ICON"]],
    ["Zelda", ["J_A_MAGIC", "J_W_5LESS", "J_W_A", "J_P_NINTENDO", "J_P_FANTASY"]],
    ["Doom Slayer", ["J_A_WEAPON", "J_P_FUTURE"]],
    ["Pac-Man", ["J_A_ICON", "J_W_A"]],
    ["Donkey Kong", ["J_A_ICON", "J_P_NINTENDO"]]
  ],
  Anime: [
    ["Goku", ["A_A_POWER", "A_A_TEAM", "A_W_5LESS", "A_P_BATTLE"]],
    ["Naruto", ["A_A_POWER", "A_A_TEAM", "A_W_A", "A_P_BATTLE", "A_P_FAMILY"]],
    ["Luffy", ["A_A_POWER", "A_A_TEAM", "A_W_5LESS", "A_P_BATTLE"]],
    ["Saitama", ["A_A_POWER", "A_W_A", "A_P_BATTLE"]],
    ["Anya Forger", ["A_A_KIND", "A_W_A", "A_W_FULL", "A_P_SCHOOL", "A_P_FAMILY"]],
    ["Soma Yukihira", ["A_A_TEAM", "A_W_A", "A_W_FULL", "A_P_SCHOOL", "A_P_FAMILY"]],
    ["Gojo", ["A_A_POWER", "A_A_TEAM", "A_W_5LESS", "A_P_SCHOOL", "A_P_BATTLE"]],
    ["Nezuko Kamado", ["A_A_POWER", "A_A_TEAM", "A_W_A", "A_W_FULL", "A_P_BATTLE", "A_P_FAMILY"]],
    ["Light Yagami", ["A_A_POWER", "A_W_A", "A_W_FULL", "A_P_SCHOOL"]],
    ["Edward Elric", ["A_A_POWER", "A_A_TEAM", "A_W_A", "A_W_FULL", "A_P_BATTLE", "A_P_FAMILY"]],
    ["Totoro", ["A_A_KIND", "A_P_FAMILY"]],
    ["Sailor Moon", ["A_A_POWER", "A_A_TEAM", "A_W_FULL", "A_P_BATTLE"]]
  ],
  Geek: [
    ["Batman", ["K_A_MASK", "K_A_POWER", "K_W_A", "K_P_DC"]],
    ["Homem Aranha", ["K_A_MASK", "K_A_POWER", "K_W_A", "K_W_TWO", "K_W_8PLUS", "K_P_MARVEL"]],
    ["Superman", ["K_A_POWER", "K_W_A", "K_W_8PLUS", "K_P_DC"]],
    ["Darth Vader", ["K_A_MASK", "K_A_POWER", "K_W_A", "K_W_TWO", "K_W_8PLUS", "K_P_SPACE"]],
    ["Iron Man", ["K_A_MASK", "K_A_POWER", "K_W_A", "K_W_TWO", "K_P_MARVEL"]],
    ["Harry Potter", ["K_A_MAGIC", "K_A_POWER", "K_W_A", "K_W_TWO", "K_W_8PLUS"]],
    ["Doctor Strange", ["K_A_MAGIC", "K_A_POWER", "K_W_A", "K_W_TWO", "K_W_8PLUS", "K_P_MARVEL"]],
    ["Flash", ["K_A_MASK", "K_A_POWER", "K_W_A", "K_P_DC"]],
    ["Yoda", ["K_A_MAGIC", "K_A_POWER", "K_W_A", "K_P_SPACE"]],
    ["Wolverine", ["K_A_POWER", "K_W_8PLUS", "K_P_MARVEL"]],
    ["Mandaloriano", ["K_A_MASK", "K_W_A", "K_W_8PLUS", "K_P_SPACE"]],
    ["Mulher Maravilha", ["K_A_POWER", "K_W_A", "K_W_TWO", "K_W_8PLUS", "K_P_DC"]]
  ],
  Famosos: [
    ["Pele", ["X_A_BRAZIL", "X_A_HISTORY", "X_W_7PLUS", "X_P_SPORT"]],
    ["Ayrton Senna", ["X_A_BRAZIL", "X_A_HISTORY", "X_W_TWO", "X_W_A", "X_W_7PLUS", "X_P_SPORT"]],
    ["Einstein", ["X_A_HISTORY", "X_W_7PLUS", "X_P_SCIENCE"]],
    ["Zeca Pagodinho", ["X_A_BRAZIL", "X_A_ALIVE", "X_W_TWO", "X_W_A", "X_W_7PLUS", "X_P_MUSIC"]],
    ["Machado de Assis", ["X_A_BRAZIL", "X_A_HISTORY", "X_W_A", "X_W_7PLUS"]],
    ["Marta", ["X_A_BRAZIL", "X_A_ALIVE", "X_W_A", "X_P_SPORT"]],
    ["Galileu", ["X_A_HISTORY", "X_W_A", "X_W_7PLUS", "X_P_SCIENCE"]],
    ["Anitta", ["X_A_BRAZIL", "X_A_ALIVE", "X_W_A", "X_W_7PLUS", "X_P_MUSIC"]],
    ["Marie Curie", ["X_A_HISTORY", "X_W_TWO", "X_W_A", "X_P_SCIENCE"]],
    ["Neymar", ["X_A_BRAZIL", "X_A_ALIVE", "X_W_A", "X_P_SPORT"]],
    ["Elis Regina", ["X_A_BRAZIL", "X_A_HISTORY", "X_W_TWO", "X_W_7PLUS", "X_P_MUSIC"]],
    ["Santos Dumont", ["X_A_BRAZIL", "X_A_HISTORY", "X_W_TWO", "X_W_A", "X_W_7PLUS", "X_P_SCIENCE"]]
  ]
};
