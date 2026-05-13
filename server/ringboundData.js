export const RINGBOUND_RULE_GROUPS = {
  material: "Material",
  function: "Funcao",
  place: "Lugar",
  shape: "Forma",
  property: "Propriedade",
  language: "Linguagem",
  fiction: "Universo"
};

export const RINGBOUND_RULES = {
  Geral: [
    { code: "G_EDIBLE", group: "function", label: "e comestivel" },
    { code: "G_METAL", group: "material", label: "tem metal" },
    { code: "G_KITCHEN", group: "place", label: "fica na cozinha" },
    { code: "G_ROUND", group: "shape", label: "e redondo" },
    { code: "G_ELECTRIC", group: "property", label: "usa eletricidade" },
    { code: "G_OUTDOOR", group: "place", label: "e usado ao ar livre" }
  ],
  Pokemon: [
    { code: "P_FIRE", group: "property", label: "tem relacao com fogo" },
    { code: "P_WATER", group: "property", label: "tem relacao com agua" },
    { code: "P_FLY", group: "property", label: "voa ou levita" },
    { code: "P_ROUND", group: "shape", label: "tem corpo arredondado" },
    { code: "P_FAMOUS", group: "fiction", label: "e muito reconhecivel" }
  ],
  Filmes: [
    { code: "F_ANIMATED", group: "property", label: "e animado" },
    { code: "F_SPACE", group: "place", label: "envolve espaco ou ficcao cientifica" },
    { code: "F_HERO", group: "fiction", label: "tem herois marcantes" },
    { code: "F_OSCAR", group: "property", label: "tem prestigio/premios" },
    { code: "F_ONEWORD", group: "language", label: "tem titulo de uma palavra" }
  ],
  Jogos: [
    { code: "J_NINTENDO", group: "fiction", label: "vem de franquia Nintendo" },
    { code: "J_WEAPON", group: "property", label: "usa armas ou combate" },
    { code: "J_PLATFORM", group: "function", label: "vem de jogo de plataforma" },
    { code: "J_MAGIC", group: "fiction", label: "tem fantasia ou magia" },
    { code: "J_ICON", group: "property", label: "e mascote/iconico" }
  ],
  Anime: [
    { code: "A_SHONEN", group: "fiction", label: "vem de shonen famoso" },
    { code: "A_POWER", group: "property", label: "tem poderes sobrenaturais" },
    { code: "A_TEAM", group: "function", label: "faz parte de grupo/equipe" },
    { code: "A_FOOD", group: "function", label: "tem associacao com comida" },
    { code: "A_SHORT", group: "language", label: "nome curto" }
  ],
  Geek: [
    { code: "K_MARVEL", group: "fiction", label: "vem da Marvel" },
    { code: "K_DC", group: "fiction", label: "vem da DC" },
    { code: "K_SPACE", group: "place", label: "vem de universo espacial" },
    { code: "K_MAGIC", group: "fiction", label: "tem magia ou sobrenatural" },
    { code: "K_MASK", group: "property", label: "usa mascara ou identidade secreta" }
  ],
  Famosos: [
    { code: "X_BRAZIL", group: "place", label: "e brasileiro" },
    { code: "X_MUSIC", group: "function", label: "e ligado a musica" },
    { code: "X_SPORT", group: "function", label: "e ligado a esporte" },
    { code: "X_HISTORY", group: "property", label: "e figura historica" },
    { code: "X_SCIENCE", group: "function", label: "e ligado a ciencia" }
  ]
};

export const RINGBOUND_ITEMS = {
  Geral: [
    ["banana", ["G_EDIBLE", "G_KITCHEN"]], ["colher", ["G_METAL", "G_KITCHEN"]], ["panela", ["G_METAL", "G_KITCHEN"]], ["pizza", ["G_EDIBLE", "G_ROUND", "G_KITCHEN"]],
    ["relogio", ["G_ROUND", "G_METAL"]], ["ventilador", ["G_ELECTRIC"]], ["bicicleta", ["G_METAL", "G_ROUND", "G_OUTDOOR"]], ["bola", ["G_ROUND", "G_OUTDOOR"]],
    ["faca", ["G_METAL", "G_KITCHEN"]], ["fogao", ["G_METAL", "G_KITCHEN"]], ["abacaxi", ["G_EDIBLE", "G_KITCHEN"]], ["lanterna", ["G_ELECTRIC", "G_OUTDOOR"]]
  ],
  Pokemon: [
    ["Pikachu", ["P_FAMOUS", "P_ROUND"]], ["Charizard", ["P_FIRE", "P_FLY", "P_FAMOUS"]], ["Squirtle", ["P_WATER", "P_FAMOUS"]], ["Jigglypuff", ["P_ROUND", "P_FAMOUS"]],
    ["Gyarados", ["P_WATER", "P_FLY", "P_FAMOUS"]], ["Magikarp", ["P_WATER"]], ["Moltres", ["P_FIRE", "P_FLY"]], ["Lapras", ["P_WATER", "P_FAMOUS"]],
    ["Gengar", ["P_ROUND", "P_FAMOUS"]], ["Blastoise", ["P_WATER", "P_FAMOUS"]], ["Charmander", ["P_FIRE", "P_FAMOUS"]], ["Butterfree", ["P_FLY"]]
  ],
  Filmes: [
    ["Toy Story", ["F_ANIMATED", "F_OSCAR"]], ["Avatar", ["F_SPACE", "F_ONEWORD"]], ["Star Wars", ["F_SPACE", "F_HERO"]], ["Matrix", ["F_SPACE", "F_ONEWORD"]],
    ["Frozen", ["F_ANIMATED", "F_ONEWORD"]], ["Shrek", ["F_ANIMATED", "F_ONEWORD"]], ["Oppenheimer", ["F_OSCAR", "F_ONEWORD"]], ["Batman", ["F_HERO", "F_ONEWORD"]],
    ["Wall-E", ["F_ANIMATED", "F_SPACE"]], ["Gladiador", ["F_OSCAR", "F_ONEWORD"]], ["Vingadores", ["F_HERO"]], ["Alien", ["F_SPACE", "F_ONEWORD"]]
  ],
  Jogos: [
    ["Mario", ["J_NINTENDO", "J_PLATFORM", "J_ICON"]], ["Link", ["J_NINTENDO", "J_MAGIC", "J_ICON"]], ["Sonic", ["J_PLATFORM", "J_ICON"]], ["Kratos", ["J_WEAPON", "J_ICON"]],
    ["Kirby", ["J_NINTENDO", "J_PLATFORM", "J_ICON"]], ["Samus", ["J_NINTENDO", "J_WEAPON", "J_ICON"]], ["Cloud", ["J_WEAPON", "J_MAGIC"]], ["Scorpion", ["J_WEAPON", "J_ICON"]],
    ["Zelda", ["J_NINTENDO", "J_MAGIC"]], ["Doom Slayer", ["J_WEAPON"]], ["Pac-Man", ["J_ICON"]], ["Donkey Kong", ["J_NINTENDO", "J_PLATFORM", "J_ICON"]]
  ],
  Anime: [
    ["Goku", ["A_SHONEN", "A_POWER", "A_TEAM", "A_SHORT"]], ["Naruto", ["A_SHONEN", "A_POWER", "A_TEAM"]], ["Luffy", ["A_SHONEN", "A_POWER", "A_TEAM"]], ["Saitama", ["A_POWER"]],
    ["Anya Forger", ["A_TEAM"]], ["Soma Yukihira", ["A_FOOD", "A_SHONEN"]], ["Pikachu", ["A_TEAM", "A_SHORT"]], ["Gojo", ["A_SHONEN", "A_POWER", "A_SHORT"]],
    ["Nezuko Kamado", ["A_SHONEN", "A_POWER", "A_TEAM"]], ["Light Yagami", ["A_POWER"]], ["Edward Elric", ["A_SHONEN", "A_POWER", "A_TEAM"]], ["Totoro", ["A_SHORT"]]
  ],
  Geek: [
    ["Batman", ["K_DC", "K_MASK"]], ["Homem Aranha", ["K_MARVEL", "K_MASK"]], ["Superman", ["K_DC"]], ["Darth Vader", ["K_SPACE", "K_MASK"]],
    ["Iron Man", ["K_MARVEL", "K_MASK"]], ["Harry Potter", ["K_MAGIC"]], ["Doctor Strange", ["K_MARVEL", "K_MAGIC"]], ["Flash", ["K_DC", "K_MASK"]],
    ["Yoda", ["K_SPACE", "K_MAGIC"]], ["Wolverine", ["K_MARVEL"]], ["Mandolariano", ["K_SPACE", "K_MASK"]], ["Mulher Maravilha", ["K_DC"]]
  ],
  Famosos: [
    ["Pelé", ["X_BRAZIL", "X_SPORT"]], ["Ayrton Senna", ["X_BRAZIL", "X_SPORT"]], ["Einstein", ["X_HISTORY", "X_SCIENCE"]], ["Zeca Pagodinho", ["X_BRAZIL", "X_MUSIC"]],
    ["Machado de Assis", ["X_BRAZIL", "X_HISTORY"]], ["Marta", ["X_BRAZIL", "X_SPORT"]], ["Galileu", ["X_HISTORY", "X_SCIENCE"]], ["Anitta", ["X_BRAZIL", "X_MUSIC"]],
    ["Marie Curie", ["X_HISTORY", "X_SCIENCE"]], ["Neymar", ["X_BRAZIL", "X_SPORT"]], ["Elis Regina", ["X_BRAZIL", "X_MUSIC"]], ["Santos Dumont", ["X_BRAZIL", "X_HISTORY", "X_SCIENCE"]]
  ]
};
