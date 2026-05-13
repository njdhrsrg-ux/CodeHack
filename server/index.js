import fs from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator < 1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

// Only load local .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== "production") {
  loadLocalEnv();
}

import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import {
  addPlayer,
  autoTeams,
  chooseTeam,
  CONSTANTS,
  confirmDecision,
  confirmFinal,
  confirmResult,
  confirmTiebreaker,
  hostReturnLobby,
  kickPlayer,
  makeRoom,
  movePlayer,
  normalizeRoom,
  publicRoom,
  removePlayer,
  roomJoinPreview,
  sendChatMessage,
  startGame,
  submitHints,
  updateGuess,
  updatePlayerAvatar,
  updateSettings,
  updateTiebreaker
} from "./game.js";
import {
  authUserByToken,
  changeUserPassword,
  createActiveMatch,
  deleteWordImage,
  deleteRoom,
  discardActiveMatch,
  getProfile,
  getUserPreferences,
  listRooms,
  loadWordImage,
  loadRoom,
  loginUser,
  logoutUser,
  meFromToken,
  recordMatch,
  registerUser,
  saveRoom,
  saveWordImage,
  updateUserPreferences,
  updateUserProfile
} from "./auth.js";
import {
  RINGBOUND_CONSTANTS,
  normalizeRingboundRoom,
  resolveRingboundGuess,
  ringboundPublicRoom,
  setupRingboundRoom,
  startRingboundGame,
  submitRingboundGuess,
  updateRingboundSettings
} from "./ringboundGame.js";

const PLATFORM_CONSTANTS = {
  ...CONSTANTS,
  RINGBOUND: RINGBOUND_CONSTANTS
};

console.log("Starting server with environment:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  VITE_SOCKET_URL: !!process.env.VITE_SOCKET_URL
});

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 5e6
});

const rooms = new Map();
const sessions = new Map();
const pendingDisconnects = new Map();
const imageCache = new Map();
const imageBinaryCache = new Map();
const imageResolveJobs = new Set();
const brokenImageUrls = new Set();
const imageFailureCounts = new Map();
const serperImageWarnings = new Set();
const serperConfigWarnings = new Set();
const TEAMS = ["red", "blue"];
const MAX_IMAGE_CACHE_ENTRIES = 160;
const MAX_IMAGE_CACHE_BYTES = 5 * 1024 * 1024;
const IMAGE_LOOKUP_CONCURRENCY = 4;
const ROOM_INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
const ROOM_INACTIVITY_WARNING_MS = 5 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 30 * 1000;
const SERVER_WORD_ORIGINS = {
  Anime: {
    Happy: "Fairy Tail",
    "Natsu Dragneel": "Fairy Tail",
    "Lucy Heartfilia": "Fairy Tail",
    "Erza Scarlet": "Fairy Tail",
    "Gray Fullbuster": "Fairy Tail",
    "Jaden Yuki": "Yu-Gi-Oh!",
    "Yusei Fudo": "Yu-Gi-Oh!",
    "Elizabeth Liones": "The Seven Deadly Sins",
    King: "The Seven Deadly Sins",
    Hyakkimaru: "Dororo",
    Dororo: "Dororo",
    "Taiju Oki": "Dr. Stone",
    "Yuzuriha Ogawa": "Dr. Stone",
    "Kei Tsukishima": "Haikyuu!!",
    "Tetsuro Kuroo": "Haikyuu!!",
    "Kenma Kozume": "Haikyuu!!",
    "Kuroko Tetsuya": "Kuroko's Basketball",
    "Taiga Kagami": "Kuroko's Basketball",
    "Seijuro Akashi": "Kuroko's Basketball",
    "Rintaro Okabe": "Steins;Gate",
    "Kurisu Makise": "Steins;Gate",
    "Mayuri Shiina": "Steins;Gate",
    Holo: "Spice and Wolf",
    "Kraft Lawrence": "Spice and Wolf",
    "Kousei Arima": "Your Lie in April",
    "Kaori Miyazono": "Your Lie in April",
    "Tohru Honda": "Fruits Basket",
    "Kyo Soma": "Fruits Basket",
    "Yuki Soma": "Fruits Basket",
    "Nana Osaki": "Nana",
    "Nana Komatsu": "Nana",
    "Seras Victoria": "Hellsing",
    "Integra Hellsing": "Hellsing",
    Batou: "Ghost in the Shell",
    Nausicaa: "Nausicaa",
    San: "Princess Mononoke",
    "Chihiro Ogino": "Spirited Away",
    Haku: "Spirited Away",
    Kiki: "Kiki's Delivery Service",
    "Sophie Hatter": "Howl's Moving Castle",
    "Howl Jenkins": "Howl's Moving Castle",
    Ponyo: "Ponyo",
    "Ran Mouri": "Detective Conan",
    "Kogoro Mouri": "Detective Conan",
    "Kaito Kid": "Detective Conan",
    "Toru Amuro": "Detective Conan",
    "Shinji Matou": "Fate/stay night",
    Archer: "Fate/stay night",
    Lancer: "Fate/stay night",
    "Mikoto Misaka": "A Certain Scientific Railgun",
    "Toma Kamijo": "A Certain Magical Index",
    Kenshiro: "Fist of the North Star",
    Raoh: "Fist of the North Star",
    "Joe Yabuki": "Ashita no Joe",
    "Daisuke Jigen": "Lupin III",
    "Fujiko Mine": "Lupin III",
    "Goemon Ishikawa": "Lupin III",
    "Inspector Zenigata": "Lupin III",
    "Kaoru Kamiya": "Rurouni Kenshin",
    "Sanosuke Sagara": "Rurouni Kenshin",
    "Shishio Makoto": "Rurouni Kenshin",
    "Yusuke Urameshi": "Yu Yu Hakusho",
    "Kazuma Kuwabara": "Yu Yu Hakusho",
    Kurama: "Yu Yu Hakusho",
    Hiei: "Yu Yu Hakusho",
    Toguro: "Yu Yu Hakusho",
    Inuyasha: "Inuyasha",
    "Kagome Higurashi": "Inuyasha",
    Sesshomaru: "Inuyasha",
    Kikyo: "Inuyasha",
    Sango: "Inuyasha",
    Miroku: "Inuyasha",
    "Shinpachi Shimura": "Gintama",
    "Takasugi Shinsuke": "Gintama",
    Fuu: "Samurai Champloo",
    "Spike Spiegel": "Cowboy Bebop",
    "Jet Black": "Cowboy Bebop",
    "Faye Valentine": "Cowboy Bebop",
    Ed: "Cowboy Bebop",
    Vicious: "Cowboy Bebop",
    "Renton Thurston": "Eureka Seven",
    Eureka: "Eureka Seven",
    "Yoko Littner": "Gurren Lagann",
    "Nia Teppelin": "Gurren Lagann",
    "Mako Mankanshoku": "Kill la Kill",
    "Akko Kagari": "Little Witch Academia",
    "Lotte Jansson": "Little Witch Academia",
    "Sucy Manbavaran": "Little Witch Academia",
    Mob: "Mob Psycho 100",
    "Reigen Arataka": "Mob Psycho 100",
    "Ritsu Kageyama": "Mob Psycho 100",
    Dimple: "Mob Psycho 100",
    "Chika Fujiwara": "Kaguya-sama",
    "Ai Hayasaka": "Kaguya-sama",
    "Wakana Gojo": "My Dress-Up Darling",
    "Hitori Gotoh": "Bocchi the Rock!",
    "Nijika Ijichi": "Bocchi the Rock!",
    "Ryo Yamada": "Bocchi the Rock!",
    "Ikuyo Kita": "Bocchi the Rock!",
    "Eikichi Onizuka": "Great Teacher Onizuka",
    Onizuka: "Great Teacher Onizuka",
    "Saiki Kusuo": "The Disastrous Life of Saiki K.",
    "Riki Nendo": "The Disastrous Life of Saiki K.",
    "Kaidou Shun": "The Disastrous Life of Saiki K.",
    Korosensei: "Assassination Classroom",
    "Nagisa Shiota": "Assassination Classroom",
    "Karma Akabane": "Assassination Classroom",
    "Kiyotaka Ayanokoji": "Classroom of the Elite",
    "Suzune Horikita": "Classroom of the Elite",
    "Hachiman Hikigaya": "My Teen Romantic Comedy SNAFU",
    "Yukino Yukinoshita": "My Teen Romantic Comedy SNAFU",
    "Mai Sakurajima": "Rascal Does Not Dream of Bunny Girl Senpai",
    "Sakuta Azusagawa": "Rascal Does Not Dream of Bunny Girl Senpai",
    "Tomoya Okazaki": "Clannad",
    "Nagisa Furukawa": "Clannad",
    "Rikka Takanashi": "Love, Chunibyo & Other Delusions",
    "Yuuta Togashi": "Love, Chunibyo & Other Delusions"
  },
  Jogos: {
    "Melina": "Elden Ring",
    "Tarnished": "Elden Ring",
    "Artorias": "Dark Souls",
    "Ornstein": "Dark Souls",
    "Siegward": "Dark Souls",
    "Lady Maria": "Bloodborne",
    "Gehrman": "Bloodborne",
    "Hunter": "Bloodborne",
    "Isshin Ashina": "Sekiro",
    "Kuro": "Sekiro",
    "Genichiro Ashina": "Sekiro",
    "The Penitent One": "Blasphemous",
    "Isabelle": "Animal Crossing",
    "Tommy Angelo": "Mafia",
    "Vito Scaletta": "Mafia",
    "Clementine": "The Walking Dead",
    "Lee Everett": "The Walking Dead",
    "Bigby Wolf": "The Wolf Among Us",
    "Faith": "Mirror's Edge",
    "Faith Connors": "Mirror's Edge",
    "Commander Keen": "Commander Keen",
    "Duke Nukem": "Duke Nukem",
    "Cal Kestis": "Star Wars Jedi",
    "Merrin": "Star Wars Jedi",
    "BD-1": "Star Wars Jedi",
    "Kyle Katarn": "Star Wars Jedi Knight",
    "Revan": "Star Wars Knights of the Old Republic",
    "Bastila Shan": "Star Wars Knights of the Old Republic",
    "HK-47": "Star Wars Knights of the Old Republic",
    "Guybrush Threepwood": "Monkey Island",
    "LeChuck": "Monkey Island",
    "Elaine Marley": "Monkey Island",
    "Manny Calavera": "Grim Fandango",
    "Razputin Aquato": "Psychonauts",
    "Conker": "Conker's Bad Fur Day",
    "Joanna Dark": "Perfect Dark",
    "Eddie Riggs": "Brutal Legend",
    "Juliet Starling": "Lollipop Chainsaw",
    "Travis Touchdown": "No More Heroes",
    "Henry Stickmin": "Henry Stickmin",
    "Hat Kid": "A Hat in Time",
    "Madeline": "Celeste",
    "Theo": "Celeste",
    "Peppino Spaghetti": "Pizza Tower",
    "Commander Video": "Bit.Trip",
    "Nicole Brennan": "Dead Space",
    "Ellis": "Left 4 Dead",
    "Coach": "Left 4 Dead",
    "Nick Left 4 Dead": "Left 4 Dead",
    "Zoey": "Left 4 Dead",
    "Francis": "Left 4 Dead",
    "Bill Overbeck": "Left 4 Dead",
    "Heather Mason": "Silent Hill",
    "James Sunderland": "Silent Hill",
    "Alessa Gillespie": "Silent Hill",
    "Aya Brea": "Parasite Eve",
    "Alex Mercer": "Prototype",
    "Cole Phelps": "L.A. Noire",
    "Emily Kaldwin": "Dishonored",
    "Daud": "Dishonored",
    "Garrett": "Thief",
    "Faith Seed": "Far Cry 5",
    "Joseph Seed": "Far Cry 5",
    "Vaas Montenegro": "Far Cry 3",
    "Pagan Min": "Far Cry 4",
    "Handsome Jack": "Borderlands",
    "Tiny Tina": "Borderlands",
    "Claptrap": "Borderlands",
    "Moxxi": "Borderlands",
    "Lilith Borderlands": "Borderlands",
    "Rhys Strongfork": "Borderlands"
  },
  Geek: {
    Batman: "DC Comics",
    Superman: "DC Comics",
    "Wonder Woman": "DC Comics",
    Flash: "DC Comics",
    Aquaman: "DC Comics",
    Cyborg: "DC Comics",
    "Green Lantern": "DC Comics",
    Joker: "DC Comics",
    "Harley Quinn": "DC Comics",
    Catwoman: "DC Comics",
    Robin: "DC Comics",
    Batgirl: "DC Comics",
    Nightwing: "DC Comics",
    "Red Hood": "DC Comics",
    Deathstroke: "DC Comics",
    Riddler: "DC Comics",
    "Spider-Man": "Marvel Comics",
    "Iron Man": "Marvel Comics",
    "Captain America": "Marvel Comics",
    Thor: "Marvel Comics",
    Hulk: "Marvel Comics",
    "Black Widow": "Marvel Comics",
    "Doctor Strange": "Marvel Comics",
    "Black Panther": "Marvel Comics",
    Wolverine: "Marvel Comics",
    Deadpool: "Marvel Comics",
    Thanos: "Marvel Comics",
    Loki: "Marvel Comics",
    "Wanda Maximoff": "Marvel Comics",
    "Moon Knight": "Marvel Comics",
    Daredevil: "Marvel Comics",
    Punisher: "Marvel Comics",
    Venom: "Marvel Comics",
    Carnage: "Marvel Comics",
    "Miles Morales": "Marvel Comics",
    Homelander: "The Boys",
    "Billy Butcher": "The Boys",
    Eleven: "Stranger Things",
    "Mike Wheeler": "Stranger Things",
    "Dustin Henderson": "Stranger Things",
    "Wednesday Addams": "The Addams Family",
    "Darth Vader": "Star Wars",
    "Luke Skywalker": "Star Wars",
    "Leia Organa": "Star Wars",
    "Han Solo": "Star Wars",
    Chewbacca: "Star Wars",
    Yoda: "Star Wars",
    "Obi-Wan Kenobi": "Star Wars",
    "Ahsoka Tano": "Star Wars",
    Grogu: "Star Wars",
    "The Mandalorian": "Star Wars",
    "Din Djarin": "Star Wars",
    "Boba Fett": "Star Wars",
    "Anakin Skywalker": "Star Wars",
    "R2-D2": "Star Wars",
    Spock: "Star Trek",
    "Captain Kirk": "Star Trek",
    "Jean-Luc Picard": "Star Trek",
    Data: "Star Trek",
    Worf: "Star Trek",
    "Seven of Nine": "Star Trek",
    Frodo: "The Lord of the Rings",
    "Samwise Gamgee": "The Lord of the Rings",
    Gandalf: "The Lord of the Rings",
    Aragorn: "The Lord of the Rings",
    Legolas: "The Lord of the Rings",
    Gollum: "The Lord of the Rings",
    "Harry Potter": "Harry Potter",
    "Hermione Granger": "Harry Potter",
    "Ron Weasley": "Harry Potter",
    Dumbledore: "Harry Potter",
    Voldemort: "Harry Potter",
    "Severus Snape": "Harry Potter",
    "Rick Sanchez": "Rick and Morty",
    "Morty Smith": "Rick and Morty",
    "Homer Simpson": "The Simpsons",
    "Bart Simpson": "The Simpsons",
    "Lisa Simpson": "The Simpsons",
    "Marge Simpson": "The Simpsons",
    "SpongeBob SquarePants": "SpongeBob SquarePants",
    Finn: "Adventure Time",
    Jake: "Adventure Time",
    "Princess Bubblegum": "Adventure Time",
    Marceline: "Adventure Time",
    "Steven Universe": "Steven Universe",
    Garnet: "Steven Universe",
    Ametista: "Steven Universe",
    Pearl: "Steven Universe",
    Dexter: "Dexter's Laboratory",
    "Johnny Bravo": "Johnny Bravo",
    "Ben 10": "Ben 10",
    "Beast Boy": "Teen Titans",
    Raven: "Teen Titans",
    Starfire: "Teen Titans",
    "Kim Possible": "Kim Possible",
    Shego: "Kim Possible",
    Aang: "Avatar The Last Airbender",
    Katara: "Avatar The Last Airbender",
    Zuko: "Avatar The Last Airbender",
    Korra: "The Legend of Korra",
    Invincible: "Invincible",
    "Omni-Man": "Invincible",
    "Atom Eve": "Invincible",
    Bender: "Futurama",
    Fry: "Futurama",
    Leela: "Futurama",
    "Peter Griffin": "Family Guy",
    "Stewie Griffin": "Family Guy",
    "Rick Grimes": "The Walking Dead",
    "Daryl Dixon": "The Walking Dead",
    "Walter White": "Breaking Bad",
    "Jesse Pinkman": "Breaking Bad",
    "Saul Goodman": "Better Call Saul",
    "Daenerys Targaryen": "Game of Thrones",
    "Jon Snow": "Game of Thrones",
    "Tyrion Lannister": "Game of Thrones",
    "Arya Stark": "Game of Thrones",
    "Paul Atreides": "Dune",
    Chani: "Dune",
    "Buffy Summers": "Buffy the Vampire Slayer",
    "Sarah Connor": "Terminator",
    "T-800": "Terminator",
    "Ellen Ripley": "Alien",
    Neo: "The Matrix",
    Trinity: "The Matrix",
    Morpheus: "The Matrix",
    "Agent Smith": "The Matrix"
  }
};

const SERVER_ORIGIN_PATCH = {
  Anime: {
    "Son Goku": "Dragon Ball", Goku: "Dragon Ball", Vegeta: "Dragon Ball", "Son Gohan": "Dragon Ball", Gohan: "Dragon Ball", Piccolo: "Dragon Ball", "Bulma Brief": "Dragon Ball", Bulma: "Dragon Ball", Freeza: "Dragon Ball", Cell: "Dragon Ball", "Majin Boo": "Dragon Ball", Kuririn: "Dragon Ball", "Trunks Brief": "Dragon Ball", Trunks: "Dragon Ball",
    "Naruto Uzumaki": "Naruto", "Sasuke Uchiha": "Naruto", "Sakura Haruno": "Naruto", "Kakashi Hatake": "Naruto", "Hinata Hyuga": "Naruto", "Itachi Uchiha": "Naruto", "Madara Uchiha": "Naruto", Jiraiya: "Naruto", Gaara: "Naruto",
    "Monkey D. Luffy": "One Piece", "Roronoa Zoro": "One Piece", Nami: "One Piece", "Vinsmoke Sanji": "One Piece", Usopp: "One Piece", "Tony Tony Chopper": "One Piece", "Nico Robin": "One Piece", Franky: "One Piece", Brook: "One Piece", Shanks: "One Piece",
    "Ichigo Kurosaki": "Bleach", "Rukia Kuchiki": "Bleach", "Orihime Inoue": "Bleach", "Uryu Ishida": "Bleach", "Renji Abarai": "Bleach", "Byakuya Kuchiki": "Bleach", "Sosuke Aizen": "Bleach", "Kenpachi Zaraki": "Bleach", "Toshiro Hitsugaya": "Bleach", "Yoruichi Shihoin": "Bleach",
    Saitama: "One Punch Man", Genos: "One Punch Man", Tatsumaki: "One Punch Man", "Mumen Rider": "One Punch Man", Garou: "One Punch Man",
    "Izuku Midoriya": "My Hero Academia", "Katsuki Bakugo": "My Hero Academia", "Ochaco Uraraka": "My Hero Academia", "Shoto Todoroki": "My Hero Academia", "Toshinori Yagi": "My Hero Academia", "All Might": "My Hero Academia", "Tomura Shigaraki": "My Hero Academia",
    "Tanjiro Kamado": "Demon Slayer", "Nezuko Kamado": "Demon Slayer", "Zenitsu Agatsuma": "Demon Slayer", "Inosuke Hashibira": "Demon Slayer", "Giyu Tomioka": "Demon Slayer", "Kyojuro Rengoku": "Demon Slayer", "Muzan Kibutsuji": "Demon Slayer", "Shinobu Kocho": "Demon Slayer",
    "Eren Yeager": "Attack on Titan", "Mikasa Ackerman": "Attack on Titan", "Armin Arlert": "Attack on Titan", "Levi Ackerman": "Attack on Titan", "Erwin Smith": "Attack on Titan", "Reiner Braun": "Attack on Titan", "Annie Leonhart": "Attack on Titan",
    "Light Yagami": "Death Note", "L Lawliet": "Death Note", "Misa Amane": "Death Note", Ryuk: "Death Note",
    "Edward Elric": "Fullmetal Alchemist", "Alphonse Elric": "Fullmetal Alchemist", "Winry Rockbell": "Fullmetal Alchemist", "Roy Mustang": "Fullmetal Alchemist", "Alex Louis Armstrong": "Fullmetal Alchemist",
    "Gon Freecss": "Hunter x Hunter", Gon: "Hunter x Hunter", "Killua Zoldyck": "Hunter x Hunter", Killua: "Hunter x Hunter", Kurapika: "Hunter x Hunter", "Leorio Paradinight": "Hunter x Hunter", "Hisoka Morow": "Hunter x Hunter", Hisoka: "Hunter x Hunter", Meruem: "Hunter x Hunter", Netero: "Hunter x Hunter",
    "Yusuke Urameshi": "Yu Yu Hakusho", "Kazuma Kuwabara": "Yu Yu Hakusho", Kuwabara: "Yu Yu Hakusho", Kurama: "Yu Yu Hakusho", Hiei: "Yu Yu Hakusho", Toguro: "Yu Yu Hakusho",
    "Usagi Tsukino": "Sailor Moon", "Ami Mizuno": "Sailor Moon", "Rei Hino": "Sailor Moon", "Makoto Kino": "Sailor Moon", "Minako Aino": "Sailor Moon", "Mamoru Chiba": "Sailor Moon",
    "Shinji Ikari": "Neon Genesis Evangelion", "Asuka Langley Soryu": "Neon Genesis Evangelion", "Rei Ayanami": "Neon Genesis Evangelion", "Misato Katsuragi": "Neon Genesis Evangelion", "Kaworu Nagisa": "Neon Genesis Evangelion",
    "Shotaro Kaneda": "Akira", Kaneda: "Akira", "Tetsuo Shima": "Akira", Tetsuo: "Akira",
    "Kenshin Himura": "Rurouni Kenshin", Kenshin: "Rurouni Kenshin", "Senku Ishigami": "Dr. Stone", Senku: "Dr. Stone", "Tsukasa Shishio": "Dr. Stone", Rimuru: "That Time I Got Reincarnated as a Slime", "Rimuru Tempest": "That Time I Got Reincarnated as a Slime", "Subaru Natsuki": "Re:Zero", Subaru: "Re:Zero", "Kazuto Kirigaya": "Sword Art Online", Kirito: "Sword Art Online", "Asuna Yuuki": "Sword Art Online", Asuna: "Sword Art Online",
    "Megumi Fushiguro": "Jujutsu Kaisen", "Nobara Kugisaki": "Jujutsu Kaisen", "Satoru Gojo": "Jujutsu Kaisen", Gojo: "Jujutsu Kaisen", "Yuta Okkotsu": "Jujutsu Kaisen", "Aki Hayakawa": "Chainsaw Man", "Vash the Stampede": "Trigun", Vash: "Trigun", "Lelouch Lamperouge": "Code Geass", Lelouch: "Code Geass", "Suzaku Kururugi": "Code Geass", "Gintoki Sakata": "Gintama", Gintoki: "Gintama", Kagura: "Gintama", "Shigeo Kageyama": "Mob Psycho 100"
  },
  Jogos: {
    Mario: "Super Mario", Luigi: "Super Mario", Peach: "Super Mario", Bowser: "Super Mario", Yoshi: "Super Mario", Toad: "Super Mario", Wario: "Super Mario", Waluigi: "Super Mario",
    Link: "The Legend of Zelda", Zelda: "The Legend of Zelda", Ganondorf: "The Legend of Zelda", "Princess Zelda": "The Legend of Zelda", Impa: "The Legend of Zelda", Midna: "The Legend of Zelda",
    "Donkey Kong": "Donkey Kong", "Diddy Kong": "Donkey Kong", Kirby: "Kirby", "Meta Knight": "Kirby", "King Dedede": "Kirby",
    Samus: "Metroid", "Samus Aran": "Metroid", Ridley: "Metroid", "Master Chief": "Halo", Cortana: "Halo", "Marcus Fenix": "Gears of War",
    "Solid Snake": "Metal Gear", Snake: "Metal Gear", "Big Boss": "Metal Gear", Raiden: "Metal Gear", "Revolver Ocelot": "Metal Gear", Quiet: "Metal Gear",
    "Kazuma Kiryu": "Yakuza", "Goro Majima": "Yakuza", "Ichiban Kasuga": "Yakuza",
    "Ryu Hayabusa": "Ninja Gaiden", Kasumi: "Dead or Alive",
    Kazuya: "Tekken", "Kazuya Mishima": "Tekken", Heihachi: "Tekken", "Heihachi Mishima": "Tekken", "Jin Kazama": "Tekken", King: "Tekken", "Nina Williams": "Tekken", Lili: "Tekken", "Emilie De Rochefort": "Tekken", "Lars Alexandersson": "Tekken",
    "Jill Valentine": "Resident Evil", "Claire Redfield": "Resident Evil", "Ada Wong": "Resident Evil", "Chris Redfield": "Resident Evil", "Albert Wesker": "Resident Evil", Nemesis: "Resident Evil", "Lady Dimitrescu": "Resident Evil", "Ethan Winters": "Resident Evil", "Leon Kennedy": "Resident Evil", "Rebecca Chambers": "Resident Evil", "Barry Burton": "Resident Evil",
    Dante: "Devil May Cry", Vergil: "Devil May Cry", Nero: "Devil May Cry", Lady: "Devil May Cry", Trish: "Devil May Cry",
    Bayonetta: "Bayonetta", Jeanne: "Bayonetta", Kratos: "God of War", Atreus: "God of War", Freya: "God of War", Baldur: "God of War", Mimir: "God of War",
    Aloy: "Horizon Zero Dawn", Sylens: "Horizon Zero Dawn", Rost: "Horizon Zero Dawn", Senua: "Hellblade",
    "2B": "NieR Automata", "9S": "NieR Automata", A2: "NieR Automata", Emil: "NieR",
    Jinx: "League of Legends", Vi: "League of Legends", Caitlyn: "League of Legends", Ahri: "League of Legends", Yasuo: "League of Legends", Lux: "League of Legends", Garen: "League of Legends", Teemo: "League of Legends", Ekko: "League of Legends", Thresh: "League of Legends",
    Jett: "Valorant", Phoenix: "Valorant", Sage: "Valorant", Raze: "Valorant", Viper: "Valorant", Killjoy: "Valorant", Reyna: "Valorant",
    Tracer: "Overwatch", Widowmaker: "Overwatch", Mercy: "Overwatch", Reaper: "Overwatch", Genji: "Overwatch", Hanzo: "Overwatch", "D.Va": "Overwatch", Winston: "Overwatch",
    "Fox McCloud": "Star Fox", "Falco Lombardi": "Star Fox", Ness: "EarthBound", Lucas: "Mother 3", "Captain Falcon": "F-Zero", Marth: "Fire Emblem", Ike: "Fire Emblem", Lucina: "Fire Emblem", Robin: "Fire Emblem", Shulk: "Xenoblade Chronicles", Pyra: "Xenoblade Chronicles", Mythra: "Xenoblade Chronicles",
    Inkling: "Splatoon", Villager: "Animal Crossing", Isabelle: "Animal Crossing", "Tom Nook": "Animal Crossing", "K K Slider": "Animal Crossing",
    Steve: "Minecraft", Alex: "Minecraft", Creeper: "Minecraft", Enderman: "Minecraft", Herobrine: "Minecraft",
    Sans: "Undertale", Papyrus: "Undertale", Frisk: "Undertale", Undyne: "Undertale",
    Cuphead: "Cuphead", Mugman: "Cuphead", "Ms Chalice": "Cuphead", "Hollow Knight": "Hollow Knight", Hornet: "Hollow Knight", "Shovel Knight": "Shovel Knight", Ori: "Ori and the Blind Forest", Shantae: "Shantae", Rayman: "Rayman", Rabbid: "Rayman Raving Rabbids",
    "Crash Bandicoot": "Crash Bandicoot", "Coco Bandicoot": "Crash Bandicoot", "Dr Neo Cortex": "Crash Bandicoot", Spyro: "Spyro the Dragon", "Sly Cooper": "Sly Cooper", Ratchet: "Ratchet and Clank", Clank: "Ratchet and Clank", Jak: "Jak and Daxter", Daxter: "Jak and Daxter", "Cole MacGrath": "Infamous", Sackboy: "LittleBigPlanet"
  },
  Geek: {
    Batman: "DC Comics", Superman: "DC Comics", "Wonder Woman": "DC Comics", Flash: "DC Comics", Aquaman: "DC Comics", Cyborg: "DC Comics", Batgirl: "DC Comics", Nightwing: "DC Comics", "Red Hood": "DC Comics", Raven: "DC Comics", Starfire: "DC Comics", "Beast Boy": "DC Comics", Deathstroke: "DC Comics", Riddler: "DC Comics", Penguin: "DC Comics", "Two-Face": "DC Comics", "Poison Ivy": "DC Comics", Scarecrow: "DC Comics", Bane: "DC Comics", "Green Arrow": "DC Comics", "Black Canary": "DC Comics", "Martian Manhunter": "DC Comics", Shazam: "DC Comics", "Lex Luthor": "DC Comics", Darkseid: "DC Comics", "Doctor Fate": "DC Comics", Zatanna: "DC Comics", Constantine: "DC Comics", "Swamp Thing": "DC Comics", "Blue Beetle": "DC Comics", "Static Shock": "DC Comics",
    "Homem Aranha": "Marvel Comics", "Homem de Ferro": "Marvel Comics", "Capitao America": "Marvel Comics", Thor: "Marvel Comics", Hulk: "Marvel Comics", "Viuva Negra": "Marvel Comics", "Doutor Estranho": "Marvel Comics", "Pantera Negra": "Marvel Comics", Wolverine: "Marvel Comics", Deadpool: "Marvel Comics", Thanos: "Marvel Comics", Loki: "Marvel Comics", "Wanda Maximoff": "Marvel Comics", "Gaviao Arqueiro": "Marvel Comics", "Professor Xavier": "Marvel Comics", Magneto: "Marvel Comics", Tempestade: "Marvel Comics", Ciclope: "Marvel Comics", "Jean Grey": "Marvel Comics", Vampira: "Marvel Comics", Gambit: "Marvel Comics", Visao: "Marvel Comics", "Nick Fury": "Marvel Comics", Blade: "Marvel Comics", "Motoqueiro Fantasma": "Marvel Comics", "Senhor das Estrelas": "Marvel Comics", Gamora: "Marvel Comics", Groot: "Marvel Comics", "Rocket Raccoon": "Marvel Comics", Drax: "Marvel Comics", "Jessica Jones": "Marvel Comics", "Luke Cage": "Marvel Comics", "Iron Fist": "Marvel Comics", "Ms Marvel": "Marvel Comics", "She-Hulk": "Marvel Comics", Hawkeye: "Marvel Comics", "Kate Bishop": "Marvel Comics", Vision: "Marvel Comics", "Ant-Man": "Marvel Comics", Wasp: "Marvel Comics", Falcon: "Marvel Comics", "Winter Soldier": "Marvel Comics", "Professor X": "Marvel Comics", Cyclops: "Marvel Comics", Storm: "Marvel Comics", Rogue: "Marvel Comics", Beast: "Marvel Comics", Mystique: "Marvel Comics", Venom: "Marvel Comics", Carnage: "Marvel Comics", "Green Goblin": "Marvel Comics", "Doctor Octopus": "Marvel Comics", Mysterio: "Marvel Comics", "Miles Morales": "Marvel Comics", "Gwen Stacy": "Marvel Comics", "Star-Lord": "Marvel Comics", Nebula: "Marvel Comics",
    "Luke Skywalker": "Star Wars", "Darth Vader": "Star Wars", "Leia Organa": "Star Wars", "Han Solo": "Star Wars", Chewbacca: "Star Wars", Yoda: "Star Wars", "Obi-Wan Kenobi": "Star Wars", "Anakin Skywalker": "Star Wars", "Ahsoka Tano": "Star Wars", "Din Djarin": "Star Wars", Grogu: "Star Wars", "Boba Fett": "Star Wars", "Kylo Ren": "Star Wars", Rey: "Star Wars", Finn: "Star Wars", "Poe Dameron": "Star Wars", "Palpatine": "Star Wars",
    Spock: "Star Trek", "Jean-Luc Picard": "Star Trek", "James Kirk": "Star Trek", "Data": "Star Trek", "Worf": "Star Trek",
    Neo: "The Matrix", Trinity: "The Matrix", Morpheus: "The Matrix", "Agent Smith": "The Matrix",
    "Rick Sanchez": "Rick and Morty", "Morty Smith": "Rick and Morty", "Homer Simpson": "The Simpsons", "Bart Simpson": "The Simpsons", "Lisa Simpson": "The Simpsons", "Marge Simpson": "The Simpsons", "Peter Griffin": "Family Guy", "Stewie Griffin": "Family Guy", Bender: "Futurama", Fry: "Futurama", Leela: "Futurama",
    "Rick Grimes": "The Walking Dead", "Daryl Dixon": "The Walking Dead", Negan: "The Walking Dead", "Walter White": "Breaking Bad", "Jesse Pinkman": "Breaking Bad", "Gus Fring": "Breaking Bad", "Saul Goodman": "Better Call Saul", "Dexter Morgan": "Dexter", "Tony Soprano": "The Sopranos", "Don Draper": "Mad Men",
    "Daenerys Targaryen": "Game of Thrones", "Jon Snow": "Game of Thrones", "Tyrion Lannister": "Game of Thrones", "Arya Stark": "Game of Thrones", "Paul Atreides": "Dune", Chani: "Dune", "Buffy Summers": "Buffy the Vampire Slayer", "Sarah Connor": "Terminator", "T-800": "Terminator", "Ellen Ripley": "Alien", "Ice King": "Adventure Time", Ametista: "Steven Universe", Amethyst: "Steven Universe"
  }
};

const SERVER_SEARCH_NAME_PATCH = {
  Anime: {
    "Toshinori Yagi": "All Might",
    "Izuku Midoriya": "Deku",
    "Tomura Shigaraki": "Shigaraki",
    "Shigeo Kageyama": "Mob",
    "Kazuto Kirigaya": "Kirito",
    "Satoru Gojo": "Gojo",
    "Monkey D. Luffy": "Luffy",
    "Roronoa Zoro": "Zoro",
    "Tony Tony Chopper": "Chopper",
    "Sosuke Aizen": "Aizen",
    "Hisoka Morow": "Hisoka",
    "Kenshin Himura": "Kenshin",
    "Senku Ishigami": "Senku",
    "Rimuru Tempest": "Rimuru",
    "Subaru Natsuki": "Subaru",
    "Vash the Stampede": "Vash",
    "Lelouch Lamperouge": "Lelouch",
    "Gintoki Sakata": "Gintoki"
  },
  Jogos: {
    "Carl Johnson": "CJ",
    "Hanzo Hasashi": "Scorpion",
    "Lena Oxton": "Tracer",
    "Gabriel Reyes": "Reaper",
    "Hana Song": "D.Va",
    "Octavio Silva": "Octane",
    "Renee Blasey": "Wraith",
    "Luxanna Crownguard": "Lux",
    "Emilie De Rochefort": "Lili",
    "Miles Tails Prower": "Tails",
    "Princess Peach": "Peach",
    "Princess Zelda": "Zelda",
    "Cloud Strife": "Cloud",
    "Sephiroth": "Sephiroth",
    "Geralt of Rivia": "Geralt",
    "Cirilla Fiona Elen Riannon": "Ciri",
    "Victor Sullivan": "Sully",
    "Bayek of Siwa": "Bayek"
  },
  Geek: {
    "Homem Aranha": "Spider-Man",
    "Homem de Ferro": "Iron Man",
    "Capitao America": "Captain America",
    "Viuva Negra": "Black Widow",
    "Viúva Negra": "Black Widow",
    "Doutor Estranho": "Doctor Strange",
    "Pantera Negra": "Black Panther",
    "Gaviao Arqueiro": "Hawkeye",
    Tempestade: "Storm",
    Ciclope: "Cyclops",
    Vampira: "Rogue",
    Visao: "Vision",
    "Motoqueiro Fantasma": "Ghost Rider",
    "Senhor das Estrelas": "Star-Lord",
    "Mulher Maravilha": "Wonder Woman",
    "Mulher Gato": "Catwoman",
    "Lanterna Verde": "Green Lantern",
    Coringa: "Joker",
    Arlequina: "Harley Quinn",
    Demolidor: "Daredevil",
    Justiceiro: "Punisher",
    Charada: "Riddler",
    Pinguim: "Penguin",
    "Asa Noturna": "Nightwing",
    "Bob Esponja": "SpongeBob SquarePants",
    "Princesa Jujuba": "Princess Bubblegum",
    Perola: "Pearl",
    Ravena: "Raven",
    Mutano: "Beast Boy",
    Estelar: "Starfire",
    Wandinha: "Wednesday Addams",
    "Mandaloriano": "The Mandalorian"
  }
};

const SERVER_GENERAL_IMAGE_ALIAS = {
  Casa: "house", Rua: "street", Porta: "door", Mesa: "table", Cadeira: "chair", Cama: "bed", Sofa: "sofa", Janela: "window", Parede: "wall", Chao: "floor",
  Teto: "ceiling", Tapete: "rug", Prato: "plate", Copo: "drinking glass", Garrafa: "bottle", Colher: "spoon", Faca: "knife", Garfo: "fork", Panela: "cooking pot", Fogao: "stove",
  Geladeira: "refrigerator", Pia: "sink", Banho: "bath", Sabao: "soap", Toalha: "towel", Escova: "brush", Pente: "comb", Camisa: "shirt", Calca: "pants", Vestido: "dress",
  Sapato: "shoe", Meia: "sock", Chapeu: "hat", Bolsa: "bag", Mochila: "backpack", Carteira: "wallet", Chave: "key", Moeda: "coin", Nota: "banknote", Livro: "book",
  Caderno: "notebook", Caneta: "pen", Lapis: "pencil", Borracha: "eraser", Papel: "paper", Carta: "letter envelope", Caixa: "box", Sacola: "shopping bag", Presente: "gift", Relogio: "clock",
  Telefone: "telephone", Radio: "radio", Camera: "camera", Tela: "screen", Teclado: "keyboard", Mouse: "computer mouse", Cabo: "cable", Lampada: "lamp", Vela: "candle", Fogo: "fire",
  Agua: "water", Gelo: "ice", Chuva: "rain", Nuvem: "cloud", Sol: "sun", Lua: "moon", Estrela: "star", Ceu: "sky", Mar: "sea", Rio: "river",
  Lago: "lake", Praia: "beach", Areia: "sand", Pedra: "stone", Terra: "soil", Barro: "mud", Grama: "grass", Folha: "leaf", Flor: "flower", Arvore: "tree",
  Galho: "tree branch", Raiz: "root", Fruta: "fruit", Banana: "banana", Maca: "apple", Pera: "pear", Uva: "grape", Laranja: "orange fruit", Limao: "lemon", Manga: "mango fruit",
  Melancia: "watermelon", Abacaxi: "pineapple", Morango: "strawberry", Coco: "coconut", Tomate: "tomato", Batata: "potato", Cenoura: "carrot", Milho: "corn", Arroz: "rice", Feijao: "beans",
  Macarrao: "pasta", Pao: "bread", Queijo: "cheese", Leite: "milk", Cafe: "coffee", Cha: "tea", Suco: "juice", Bolo: "cake", Doce: "candy", Mel: "honey",
  Sal: "salt", Acucar: "sugar", Ovo: "egg", Carne: "meat", Peixe: "fish", Frango: "chicken food", Sopa: "soup", Pizza: "pizza", Sorvete: "ice cream", Biscoito: "cookie",
  Cachorro: "dog", Gato: "cat", Passaro: "bird", Cavalo: "horse", Vaca: "cow", Porco: "pig", Ovelha: "sheep", Cabra: "goat", Pato: "duck", Galinha: "chicken animal",
  Coelho: "rabbit", Rato: "mouse animal", Sapo: "frog", Cobra: "snake", Tartaruga: "turtle", Leao: "lion", Tigre: "tiger", Urso: "bear", Macaco: "monkey",
  Elefante: "elephant", Girafa: "giraffe", Zebra: "zebra", Lobo: "wolf", Raposa: "fox", Baleia: "whale", Golfinho: "dolphin", Tubarao: "shark", Formiga: "ant", Abelha: "bee",
  Mosca: "fly insect", Borboleta: "butterfly", Aranha: "spider", Carro: "car", Onibus: "bus", Trem: "train", Aviao: "airplane", Barco: "boat", Navio: "ship",
  Bicicleta: "bicycle", Moto: "motorcycle", Roda: "wheel", Pneu: "tire", Volante: "steering wheel", Freio: "brake", Motor: "engine", Posto: "gas station", Ponte: "bridge", Tunel: "tunnel", Estrada: "road",
  Escola: "school", Hospital: "hospital", Mercado: "market", Banco: "bench", Padaria: "bakery", Farmacia: "pharmacy", Igreja: "church", Praca: "town square", Parque: "park", Cinema: "movie theater",
  Teatro: "theater", Museu: "museum", Loja: "store", Hotel: "hotel", Restaurante: "restaurant", Cozinha: "kitchen", Quarto: "bedroom", Sala: "living room", Banheiro: "bathroom", Garagem: "garage",
  Jardim: "garden", Piscina: "swimming pool", Portao: "gate", Elevador: "elevator", Escada: "stairs", Bola: "ball", Boneca: "doll", Carrinho: "toy car", Jogo: "board game", Dado: "dice",
  Pipa: "kite", Tambor: "drum", Violao: "acoustic guitar", Piano: "piano", Flauta: "flute", Apito: "whistle", Musica: "musical notes", Danca: "dance", Festa: "party", Time: "sports team",
  Gol: "soccer goal", Rede: "net", Campo: "field", Quadra: "sports court", Onda: "wave", Vento: "wind", Neve: "snow", Montanha: "mountain", Vale: "valley", Ilha: "island",
  Floresta: "forest", Deserto: "desert", Caverna: "cave", Vulcao: "volcano", Mapa: "map", Bussola: "compass", Mala: "suitcase", Viagem: "travel", Cidade: "city", Aldeia: "village",
  Fazenda: "farm", Mae: "mother", Pai: "father", Irmao: "brother", Avo: "grandparent", Doutor: "doctor", Professor: "teacher", Aluno: "student", Motorista: "driver", Cozinheiro: "cook",
  Pintor: "painter", Cantor: "singer", Juiz: "judge", Policia: "police officer", Bombeiro: "firefighter", Rei: "king", Rainha: "queen", Principe: "prince", Princesa: "princess",
  Coroa: "crown", Espada: "sword", Escudo: "shield", Martelo: "hammer", Prego: "nail", Serra: "saw tool", Tesoura: "scissors", Cola: "glue", Tinta: "paint", Pincel: "paint brush",
  Linha: "thread", Agulha: "needle", Botao: "button", Espelho: "mirror", Penteado: "hairstyle", Olho: "eye", Nariz: "nose", Boca: "mouth", Dente: "tooth", Orelha: "ear",
  Mao: "hand", Dedo: "finger", Braco: "arm", Perna: "leg", Pe: "foot", Cabeca: "head", Cabelo: "hair", Corpo: "body", Vermelho: "red color", Azul: "blue color",
  Verde: "green color", Amarelo: "yellow color", Preto: "black color", Branco: "white color", Rosa: "pink color", Roxo: "purple color", Cinza: "gray color", Ouro: "gold", Prata: "silver",
  Vidro: "glass material", Madeira: "wood", Ferro: "iron metal", Plastico: "plastic", Pano: "cloth", Couro: "leather", Corda: "rope", Balde: "bucket", Vassoura: "broom", Esponja: "sponge",
  Lixo: "trash", Cesto: "basket", Remedio: "medicine", Curativo: "bandage", Planta: "plant", Semente: "seed", Horta: "vegetable garden",
  "Guarda chuva": "umbrella", Travesseiro: "pillow", Cobertor: "blanket", Cortina: "curtain", Almofada: "cushion", Estante: "bookcase", Prateleira: "shelf",
  Armario: "wardrobe", Gaveta: "drawer", Cabide: "clothes hanger", "Porta retrato": "picture frame", Quadro: "picture frame", Calendario: "calendar", Agenda: "planner notebook", Jornal: "newspaper", Revista: "magazine", Envelope: "envelope",
  Carimbo: "rubber stamp", Tesouro: "treasure chest", Cofre: "safe box", Cadeado: "padlock", Corrente: "chain", Varal: "clothesline", Pregador: "clothespin", Mangueira: "garden hose", Torneira: "faucet", Ralo: "drain",
  Balanca: "weighing scale", Termometro: "thermometer", Ventilador: "fan", "Ar condicionado": "air conditioner", Aquecedor: "heater", Telhado: "roof", Tijolo: "brick", Cimento: "cement", "Areia movel": "quicksand", Brita: "gravel",
  "Porta malas": "car trunk", "Para brisa": "windshield", Farol: "car headlight", Retrovisor: "rearview mirror", Semaforo: "traffic light", Faixa: "crosswalk", Esquina: "street corner", Rotatoria: "roundabout", Viaduto: "overpass",
  Beco: "alley", Alameda: "avenue", Trilha: "trail", Acampamento: "campsite", Barraca: "tent", Lanterna: "flashlight", Fogueira: "campfire", Isqueiro: "lighter", Fosforo: "matchstick", Mergulho: "scuba diving",
  Mascara: "diving mask", Nadadeira: "swim fins", Boia: "life buoy", Ancora: "anchor", Remo: "oar", Veleiro: "sailboat", Canoa: "canoe", Prancha: "surfboard", Patins: "roller skates", Skate: "skateboard",
  Raquete: "racket", Peteca: "shuttlecock", Trofeu: "trophy", Medalha: "medal", Uniforme: "uniform", Chuteira: "soccer cleats", Capacete: "helmet", Luva: "glove", "Rede de pesca": "fishing net", Aquario: "aquarium"
};

const SERVER_GENERAL_IMAGE_ALIAS_EXTRA = {
  Cobertura: "rooftop terrace", "Calçada": "sidewalk", Calcada: "sidewalk", Gaiola: "bird cage", Coleira: "pet collar", Racao: "pet food", Osso: "bone", Ninho: "bird nest", Pena: "feather", Bico: "bird beak",
  Asa: "wing", Casco: "shell", Chifre: "horn", Cauda: "tail", Bigode: "mustache", Abobora: "pumpkin", Pepino: "cucumber", Alface: "lettuce", Repolho: "cabbage", Cebola: "onion",
  Alho: "garlic", Pimenta: "pepper", Canela: "cinnamon", Chocolate: "chocolate", Pipoca: "popcorn", Amendoim: "peanut", Castanha: "chestnut", Iogurte: "yogurt", Manteiga: "butter", Geleia: "jam",
  Farinha: "flour", Fermento: "baking powder", Hamburguer: "hamburger", Pastel: "fried pastry", Coxinha: "coxinha snack", Esfiha: "sfiha", Tapioca: "tapioca pancake", Crepe: "crepe", Panqueca: "pancake", Lasanha: "lasagna",
  Churrasco: "barbecue", Tempero: "seasoning", Guardanapo: "napkin", Bandeja: "serving tray", Xicara: "teacup", Caneca: "mug", Jarra: "pitcher", Liquidificador: "blender", Batedeira: "stand mixer", Forno: "oven",
  Microondas: "microwave oven", Chaleira: "kettle", Escorredor: "dish rack", Peneira: "sieve", Ralador: "grater", Abridor: "bottle opener", Rolha: "cork stopper", "Saca rolha": "corkscrew", Fronha: "pillowcase", "Lençol": "bedsheet",
  Lencol: "bedsheet", Colchao: "mattress", "Berço": "crib", Berco: "crib", Comoda: "dresser", "Criado mudo": "nightstand", Abajur: "table lamp", Interruptor: "light switch", Tomada: "electrical outlet", Extensao: "extension cord",
  "Controle remoto": "remote control", Campainha: "doorbell", Alarme: "alarm", Fechadura: "door lock", "Dobradiça": "hinge", Dobradica: "hinge", "Maçaneta": "doorknob", Macaneta: "doorknob", Cortador: "cutter tool", "Fita adesiva": "adhesive tape",
  Grampeador: "stapler", Clipe: "paper clip", Regua: "ruler", Compasso: "drawing compass", Transferidor: "protractor", Calculadora: "calculator", "Mochila escolar": "school backpack", Estojo: "pencil case", Apontador: "pencil sharpener", Giz: "chalk",
  Lousa: "blackboard", "Carteira escolar": "school desk", Biblioteca: "library", Laboratorio: "laboratory", "Quadro negro": "blackboard", Globo: "globe", Planeta: "planet", Cometa: "comet", Foguete: "rocket", Astronauta: "astronaut",
  "Satélite": "satellite", Satelite: "satellite", Telescopio: "telescope", Microscopio: "microscope", "Imã": "magnet", Ima: "magnet", Bateria: "battery", Pilhas: "batteries", Controle: "game controller", Joystick: "joystick",
  Fone: "headphones", Microfone: "microphone", "Caixa de som": "speaker", Impressora: "printer", Scanner: "scanner", Roteador: "router", Antena: "antenna", Relampago: "lightning", Trovao: "thunder", Tempestade: "storm",
  Garoa: "drizzle", Orvalho: "dew", Geada: "frost", "Arco iris": "rainbow", Cachoeira: "waterfall", Corredeira: "rapids", "Pântano": "swamp", Pantano: "swamp", Mangue: "mangrove", Penhasco: "cliff",
  Planalto: "plateau", Bosque: "woodland", Jiboia: "boa constrictor", Jacare: "alligator", Coruja: "owl", Pinguim: "penguin", Camelo: "camel", Canguru: "kangaroo", Hipopotamo: "hippopotamus", Rinoceronte: "rhinoceros",
  Panda: "panda", Koala: "koala", Esquilo: "squirrel", Lontra: "otter", Foca: "seal animal", Pelicano: "pelican", Gaivota: "seagull", Pavao: "peacock", Peru: "turkey bird", Ganso: "goose",
  Marreco: "duck", Caranguejo: "crab", Lagosta: "lobster", Polvo: "octopus", Lula: "squid", Ostra: "oyster", Concha: "seashell", "Estrela do mar": "starfish", Coral: "coral reef", Ourico: "sea urchin",
  Besouro: "beetle", Grilo: "cricket insect", Joaninha: "ladybug", Cupim: "termite", Mariposa: "moth", Escorpiao: "scorpion", Libelula: "dragonfly", "Centopéia": "centipede", Centopeia: "centipede", Pijama: "pajamas",
  Casaco: "coat", Jaqueta: "jacket", Blusa: "blouse", Saia: "skirt", Bermuda: "shorts", Shorts: "shorts clothing", Cinto: "belt", Gravata: "tie", Cachecol: "scarf", "Luva de frio": "winter gloves",
  "Óculos": "eyeglasses", Oculos: "eyeglasses", "Relogio de pulso": "wristwatch", Brinco: "earring", Colar: "necklace", Pulseira: "bracelet", Anel: "ring jewelry", Perfume: "perfume bottle", Shampoo: "shampoo bottle", Condicionador: "conditioner bottle",
  Desodorante: "deodorant", Creme: "cream jar", Esparadrapo: "medical tape", Seringa: "syringe", "Raio x": "x-ray", Receita: "medical prescription", Vacina: "vaccine", Dentista: "dentist", Ambulancia: "ambulance", Sirene: "siren",
  Delegacia: "police station", Tribunal: "courtroom", Cartorio: "notary office", Prefeitura: "city hall", Correio: "post office", Estadio: "stadium", Rodoviaria: "bus station", Aeroporto: "airport", Porto: "harbor", Shopping: "shopping mall",
  Feira: "street market", Quitanda: "produce market", "Açougue": "butcher shop", Acougue: "butcher shop", Barbearia: "barbershop", "Salão": "beauty salon", Salao: "beauty salon", Academia: "gym", Clube: "clubhouse", Circo: "circus",
  Zoologico: "zoo", Aqueduto: "aqueduct", Castelo: "castle", Cabana: "cabin", Apartamento: "apartment building", Condominio: "condominium", "Chácara": "country house", Chacara: "country house", "Sítio": "farmhouse", Sitio: "farmhouse",
  Celeiro: "barn", Curral: "corral", Pomar: "orchard", Girassol: "sunflower", Margarida: "daisy flower", Orquidea: "orchid", Cacto: "cactus", Bambu: "bamboo", Pinheiro: "pine tree", Coqueiro: "coconut tree",
  Palmeira: "palm tree", Samambaia: "fern", Musgo: "moss", Cogumelo: "mushroom", Carvao: "charcoal", Argila: "clay", Ceramica: "ceramic pottery", Porcelana: "porcelain", Algodao: "cotton", "Lã": "wool",
  La: "wool", Seda: "silk fabric", Veludo: "velvet fabric", Jeans: "denim jeans", "Zíper": "zipper", Ziper: "zipper", Botina: "work boots", Sandalia: "sandals", Chinelo: "flip flops", "Tênis": "sneakers",
  Tenis: "sneakers", "Guarda roupa": "wardrobe closet", Maleta: "briefcase", "Carrinho de feira": "shopping trolley", "Carrinho de bebê": "baby stroller", "Carrinho de bebe": "baby stroller", Berimbau: "berimbau", "Bateria musical": "drum kit", Sanfona: "accordion", Trompete: "trumpet",
  Violino: "violin", Saxofone: "saxophone", Harpa: "harp", Pandeiro: "tambourine", Partitura: "sheet music", Palco: "stage", Camarim: "dressing room", Plateia: "audience", Ingresso: "ticket", Bilheteria: "ticket booth",
  Fantasia: "costume", "Máscara": "mask", Mascara: "mask", "Balão": "balloon", Balao: "balloon", Confete: "confetti", Serpentina: "party streamer", Fogos: "fireworks", Convite: "invitation card", "Presépio": "nativity scene",
  Presepio: "nativity scene", Guirlanda: "wreath", Panetone: "panettone", "Chocolate quente": "hot chocolate", Limonada: "lemonade", Vitamina: "fruit smoothie", Sanduiche: "sandwich", Torrada: "toast", Omelete: "omelet", Salada: "salad",
  Molho: "sauce", Sushi: "sushi", Yakissoba: "yakisoba", Risoto: "risotto", Torta: "pie", Pudim: "pudding", Gelatina: "jelly dessert", Brigadeiro: "brigadeiro candy", Beijinho: "coconut candy", "Paçoca": "paçoca candy",
  Pacoca: "paçoca candy", Rapadura: "rapadura candy", Sorveteiro: "ice cream vendor", Pipoqueiro: "popcorn vendor", Carteiro: "mail carrier", Pedreiro: "bricklayer", Encanador: "plumber", Eletricista: "electrician", Jardineiro: "gardener", Costureira: "seamstress",
  Fotografo: "photographer", "Garçom": "waiter", Garcom: "waiter", Bibliotecario: "librarian", Porteiro: "doorman", Vendedor: "salesperson", Agricultor: "farmer", Pescador: "fisherman", Marinheiro: "sailor", Piloto: "pilot",
  Comissario: "flight attendant", "Mecânico": "mechanic", Mecanico: "mechanic", Ferreiro: "blacksmith", Carpinteiro: "carpenter", Sapateiro: "shoemaker", Veterinario: "veterinarian", Enfermeiro: "nurse", Atleta: "athlete", Treinador: "coach",
  Arbitro: "referee", Nadador: "swimmer", Ciclista: "cyclist", Ginasta: "gymnast", Lutador: "fighter athlete", Corredor: "runner", Goleiro: "goalkeeper", Zagueiro: "soccer defender", Atacante: "soccer striker", Torcida: "sports fans",
  Arquibancada: "bleachers", Placar: "scoreboard", Tabuleiro: "game board", "Peão": "game pawn", Peao: "game pawn", "Dominó": "dominoes", Domino: "dominoes", Xadrez: "chess", Damas: "checkers", "Quebra cabeça": "jigsaw puzzle",
  "Ioiô": "yo-yo", Ioio: "yo-yo", Boliche: "bowling", Bilhar: "billiards", Pescaria: "fishing game", Alvo: "target", Flecha: "arrow", Arco: "bow weapon", Estilingue: "slingshot", Bumerangue: "boomerang",
  "Pião": "spinning top", Piao: "spinning top", Carruagem: "carriage", Trator: "tractor", Caminhao: "truck", Escavadeira: "excavator", Guindaste: "crane machine", Helicoptero: "helicopter", "Balão de ar": "hot air balloon", "Balao de ar": "hot air balloon",
  Submarino: "submarine", Jipe: "jeep", Van: "van vehicle", "Carroça": "horse cart", Carroca: "horse cart", Patinete: "kick scooter", "Teleférico": "cable car", Teleferico: "cable car", "Metrô": "subway train", Metro: "subway train",
  "Boné": "baseball cap", Bone: "baseball cap", Viseira: "visor cap", Capuz: "hood", "Uniforme escolar": "school uniform", "Escova de dentes": "toothbrush", "Pasta de dente": "toothpaste", "Fio dental": "dental floss", Barbeador: "razor", Toalheiro: "towel rack",
  Saboneteira: "soap dish", Banheira: "bathtub", Vaso: "vase", Descarga: "toilet flush", "Espelho d'agua": "reflecting pool", Filtro: "water filter", Bebedouro: "drinking fountain", "Caixa d'agua": "water tank", "Poço": "well", Poco: "well",
  Represa: "dam reservoir", Canal: "canal", Dique: "dike", Moinho: "windmill", Catavento: "pinwheel", Biruta: "windsock", Paraquedas: "parachute", Escorregador: "playground slide", "Balanço": "swing set", Balanco: "swing set",
  Gangorra: "seesaw", Carrossel: "carousel", "Roda gigante": "ferris wheel", "Montanha russa": "roller coaster", Labirinto: "maze", Estatua: "statue", Fonte: "fountain", Coreto: "bandstand", "Banco de praça": "park bench", "Banco de praca": "park bench",
  Lixeira: "trash bin", Poste: "street light pole", Placa: "signboard", Outdoor: "billboard", Toldo: "awning", Vitrine: "shop window display", Provador: "fitting room", Etiqueta: "price tag", Cabine: "booth", Senha: "queue ticket",
  Fila: "queue line", Cesta: "basket", "Sacola retornavel": "reusable shopping bag", Moedor: "grinder", "Filtro de cafe": "coffee filter", "Porta copos": "cup holder", "Para choque": "car bumper", Estepe: "spare tire", Pedal: "pedal", "Corrente de bicicleta": "bicycle chain",
  "Guidão": "bicycle handlebar", Guidao: "bicycle handlebar", Selim: "bicycle saddle", "Campainha de bike": "bicycle bell", "Pneu reserva": "spare tire", "Óleo": "motor oil", Oleo: "motor oil", Graxa: "grease", Ferradura: "horseshoe", Sela: "saddle",
  "Rédea": "reins", Redea: "reins", Estabulo: "stable", Ferramenta: "tool", Parafuso: "screw", Porca: "nut hardware", Alicate: "pliers", "Chave inglesa": "wrench", Furadeira: "power drill", Lixa: "sandpaper",
  Capacho: "doormat", Varanda: "porch", Sacada: "balcony", Quintal: "backyard", Calha: "gutter", Rampa: "ramp", Piso: "floor tiles", Azulejo: "wall tile", "Rodapé": "baseboard", Rodape: "baseboard",
  Persiana: "window blinds", "Porta de correr": "sliding door", Grade: "metal gate", "Tela mosquiteira": "mosquito screen", "Chaminé": "chimney", Chamine: "chimney", Lareira: "fireplace", Lenha: "firewood", "Vaso sanitario": "toilet", "Escova sanitaria": "toilet brush",
  "Pá": "shovel", Pa: "shovel", Enxada: "hoe tool", Regador: "watering can", "Tesourão": "hedge shears", Tesourao: "hedge shears", "Carrinho de mão": "wheelbarrow", "Carrinho de mao": "wheelbarrow", Adubo: "fertilizer", Espantalho: "scarecrow",
  Irrigador: "sprinkler", Colheita: "harvest", Silo: "silo", Arado: "plow"
};

const SERVER_COMPLETE_ORIGIN_PATCH = {
  Anime: {
    "Rock Lee": "Naruto", Hange: "Attack on Titan", Near: "Death Note", Mello: "Death Note", Scar: "Fullmetal Alchemist",
    Totoro: "My Neighbor Totoro", Ashitaka: "Princess Mononoke", Howl: "Howl's Moving Castle", Sophie: "Howl's Moving Castle",
    "Makoto Shishio": "Rurouni Kenshin", "Soma Yukihira": "Food Wars", "Erina Nakiri": "Food Wars",
    Rem: "Re:Zero", Emilia: "Re:Zero", Ram: "Re:Zero", "Yuji Itadori": "Jujutsu Kaisen", Sukuna: "Jujutsu Kaisen", "Ryomen Sukuna": "Jujutsu Kaisen", "Maki Zenin": "Jujutsu Kaisen", "Toge Inumaki": "Jujutsu Kaisen", Panda: "Jujutsu Kaisen",
    Denji: "Chainsaw Man", Power: "Chainsaw Man", Makima: "Chainsaw Man", "Kobeni Higashiyama": "Chainsaw Man", Pochita: "Chainsaw Man",
    "Anya Forger": "Spy x Family", "Loid Forger": "Spy x Family", "Yor Forger": "Spy x Family", "Bond Forger": "Spy x Family",
    "Motoko Kusanagi": "Ghost in the Shell", "Arataka Reigen": "Mob Psycho 100", Thorfinn: "Vinland Saga", Askeladd: "Vinland Saga", Canute: "Vinland Saga",
    Boji: "Ranking of Kings", Kage: "Ranking of Kings", "Ash Ketchum": "Pokemon", Misty: "Pokemon", Brock: "Pokemon", Serena: "Pokemon",
    "Yugi Muto": "Yu-Gi-Oh!", "Seto Kaiba": "Yu-Gi-Oh!", "Joey Wheeler": "Yu-Gi-Oh!", "Yami Yugi": "Yu-Gi-Oh!",
    Meliodas: "The Seven Deadly Sins", Ban: "The Seven Deadly Sins", Diane: "The Seven Deadly Sins", Escanor: "The Seven Deadly Sins",
    Raphtalia: "The Rising of the Shield Hero", "Naofumi Iwatani": "The Rising of the Shield Hero",
    "Kazuma Sato": "Konosuba", Aqua: "Konosuba", Megumin: "Konosuba", Darkness: "Konosuba",
    Sinon: "Sword Art Online", Eugeo: "Sword Art Online", Frieren: "Frieren: Beyond Journey's End", Fern: "Frieren: Beyond Journey's End", Stark: "Frieren: Beyond Journey's End", Himmel: "Frieren: Beyond Journey's End",
    Maomao: "The Apothecary Diaries", Jinshi: "The Apothecary Diaries", Kohaku: "Dr. Stone",
    "Shoyo Hinata": "Haikyuu!!", "Tobio Kageyama": "Haikyuu!!", "Violet Evergarden": "Violet Evergarden",
    Guts: "Berserk", Griffith: "Berserk", Casca: "Berserk", Alucard: "Hellsing", "Conan Edogawa": "Detective Conan",
    Saber: "Fate/stay night", "Rin Tohsaka": "Fate/stay night", "Shirou Emiya": "Fate/stay night",
    "Lupin III": "Lupin III", Shoyo: "Gintama", "Kagura Gintama": "Gintama", Mugen: "Samurai Champloo", Jin: "Samurai Champloo",
    Simon: "Gurren Lagann", Kamina: "Gurren Lagann", "Ryuko Matoi": "Kill la Kill", "Satsuki Kiryuin": "Kill la Kill",
    "Kaguya Shinomiya": "Kaguya-sama", "Miyuki Shirogane": "Kaguya-sama", "Marin Kitagawa": "My Dress-Up Darling"
  },
  Jogos: {
    Sonic: "Sonic the Hedgehog", Tails: "Sonic the Hedgehog", "Miles Tails Prower": "Sonic the Hedgehog", "Knuckles the Echidna": "Sonic the Hedgehog", "Amy Rose": "Sonic the Hedgehog", "Dr Eggman": "Sonic the Hedgehog", "Shadow the Hedgehog": "Sonic the Hedgehog",
    "Pac-Man": "Pac-Man", "Mega Man": "Mega Man", "Dr Wily": "Mega Man", Zero: "Mega Man",
    Ryu: "Street Fighter", Ken: "Street Fighter", "Chun-Li": "Street Fighter", Guile: "Street Fighter", Cammy: "Street Fighter", "Cammy White": "Street Fighter", "M Bison": "Street Fighter", Akuma: "Street Fighter", Zangief: "Street Fighter", Sagat: "Street Fighter",
    "Sub-Zero": "Mortal Kombat", Scorpion: "Mortal Kombat", "Liu Kang": "Mortal Kombat", Kitana: "Mortal Kombat", "Johnny Cage": "Mortal Kombat", "Sonya Blade": "Mortal Kombat", Mileena: "Mortal Kombat", "Shao Kahn": "Mortal Kombat", "Jax Briggs": "Mortal Kombat",
    "Cloud Strife": "Final Fantasy VII", Sephiroth: "Final Fantasy VII", "Tifa Lockhart": "Final Fantasy VII", "Aerith Gainsborough": "Final Fantasy VII", "Barret Wallace": "Final Fantasy VII", "Yuffie Kisaragi": "Final Fantasy VII",
    "Squall Leonhart": "Final Fantasy VIII", "Rinoa Heartilly": "Final Fantasy VIII", "Lightning Farron": "Final Fantasy XIII", "Noctis Lucis Caelum": "Final Fantasy XV", Tidus: "Final Fantasy X", Yuna: "Final Fantasy X", "Terra Branford": "Final Fantasy VI", "Cecil Harvey": "Final Fantasy IV", "Kain Highwind": "Final Fantasy IV", "Vivi Ornitier": "Final Fantasy IX",
    Sora: "Kingdom Hearts", Riku: "Kingdom Hearts", Kairi: "Kingdom Hearts", Roxas: "Kingdom Hearts", "Donald Duck": "Kingdom Hearts", Goofy: "Kingdom Hearts", Terra: "Kingdom Hearts", Aqua: "Kingdom Hearts", Ventus: "Kingdom Hearts",
    "Neo Cortex": "Crash Bandicoot", Arbiter: "Halo", Doomguy: "Doom", "Doom Slayer": "Doom", "Gordon Freeman": "Half-Life", "GLaDOS": "Portal", Chell: "Portal", "Alyx Vance": "Half-Life",
    "Nathan Drake": "Uncharted", "Elena Fisher": "Uncharted", "Victor Sullivan": "Uncharted", Sully: "Uncharted", "Chloe Frazer": "Uncharted", "Nadine Ross": "Uncharted", "Lara Croft": "Tomb Raider", "Pyramid Head": "Silent Hill",
    "Geralt of Rivia": "The Witcher", Geralt: "The Witcher", "Cirilla Fiona Elen Riannon": "The Witcher", Ciri: "The Witcher", Yennefer: "The Witcher", "Triss Merigold": "The Witcher", Dandelion: "The Witcher", Vesemir: "The Witcher",
    "Arthur Morgan": "Red Dead Redemption", "John Marston": "Red Dead Redemption", "Dutch van der Linde": "Red Dead Redemption", "Sadie Adler": "Red Dead Redemption", "Micah Bell": "Red Dead Redemption",
    "Trevor Philips": "Grand Theft Auto", CJ: "Grand Theft Auto", "Tommy Vercetti": "Grand Theft Auto", "Niko Bellic": "Grand Theft Auto", "Franklin Clinton": "Grand Theft Auto", "Michael De Santa": "Grand Theft Auto",
    "Ezio Auditore": "Assassin's Creed", "Altair Ibn-La'Ahad": "Assassin's Creed", "Bayek of Siwa": "Assassin's Creed", Kassandra: "Assassin's Creed", Eivor: "Assassin's Creed", "Edward Kenway": "Assassin's Creed",
    "Agent 47": "Hitman", "Max Payne": "Max Payne", "Alan Wake": "Alan Wake", "Jesse Faden": "Control", "Sam Fisher": "Splinter Cell",
    "Cole Train": "Gears of War", "Dominic Santiago": "Gears of War", Joel: "The Last of Us", Ellie: "The Last of Us", Abby: "The Last of Us", "Abby Anderson": "The Last of Us", "Tommy Miller": "The Last of Us", "Sarah Miller": "The Last of Us",
    Banjo: "Banjo-Kazooie", Kazooie: "Banjo-Kazooie", Pit: "Kid Icarus", Palutena: "Kid Icarus", "Freddy Fazbear": "Five Nights at Freddy's",
    Tracer: "Overwatch", Reaper: "Overwatch", "Genji Shimada": "Overwatch", Genji: "Overwatch", "Hanzo Shimada": "Overwatch", Hanzo: "Overwatch", "D.Va": "Overwatch", Ashe: "Overwatch", Winston: "Overwatch",
    Octane: "Apex Legends", "Octavio Silva": "Apex Legends", Wraith: "Apex Legends", "Renee Blasey": "Apex Legends", Bloodhound: "Apex Legends", Pathfinder: "Apex Legends",
    "Corvo Attano": "Dishonored", "Booker DeWitt": "BioShock Infinite", Elizabeth: "BioShock Infinite", "Big Daddy": "BioShock", "Isaac Clarke": "Dead Space", "Commander Shepard": "Mass Effect", "Liara T'Soni": "Mass Effect", "Garrus Vakarian": "Mass Effect", "Tali'Zorah": "Mass Effect",
    Morrigan: "Dragon Age", "Varric Tethras": "Dragon Age", Solas: "Dragon Age", Alistair: "Dragon Age", "Cassandra Pentaghast": "Dragon Age", Hawke: "Dragon Age",
    Rosalina: "Super Mario", Zant: "The Legend of Zelda", Tingle: "The Legend of Zelda", Mipha: "The Legend of Zelda", Revali: "The Legend of Zelda", Urbosa: "The Legend of Zelda", Daruk: "The Legend of Zelda",
    "Malenia": "Elden Ring", Radahn: "Elden Ring", Ranni: "Elden Ring", Solaire: "Dark Souls", Sekiro: "Sekiro", "Nico Robin": "One Piece", Celeste: "Celeste"
  },
  Geek: {
    "Viúva Negra": "Marvel Comics", Demolidor: "Marvel Comics", Justiceiro: "Marvel Comics",
    Starlight: "The Boys", "Lucas Sinclair": "Stranger Things", "Will Byers": "Stranger Things", "Max Mayfield": "Stranger Things", Hopper: "Stranger Things",
    "Morticia Addams": "The Addams Family", "Gomez Addams": "The Addams Family", "Tio Chico": "The Addams Family",
    "Sherlock Holmes": "Sherlock Holmes", "John Watson": "Sherlock Holmes", "Doctor Who": "Doctor Who", Dalek: "Doctor Who", "The Doctor": "Doctor Who", "Amy Pond": "Doctor Who", "Clara Oswald": "Doctor Who", "Donna Noble": "Doctor Who",
    "Capitao Kirk": "Star Trek", Gimli: "The Lord of the Rings", Bilbo: "The Hobbit", Hagrid: "Harry Potter", "Draco Malfoy": "Harry Potter",
    "Geralt de Rivia": "The Witcher", "Geralt of Rivia": "The Witcher", Ciri: "The Witcher", Yennefer: "The Witcher", Jaskier: "The Witcher",
    "Patrick Estrela": "SpongeBob SquarePants", "Lula Molusco": "SpongeBob SquarePants", "Sandy Bochechas": "SpongeBob SquarePants", "Steven Universo": "Steven Universe",
    Phineas: "Phineas and Ferb", Ferb: "Phineas and Ferb", Perry: "Phineas and Ferb", "Mabel Pines": "Gravity Falls", "Dipper Pines": "Gravity Falls", "Bill Cipher": "Gravity Falls",
    Sokka: "Avatar The Last Airbender", Toph: "Avatar The Last Airbender", Spawn: "Spawn", Hellboy: "Hellboy",
    "Summer Smith": "Rick and Morty", "Beth Smith": "Rick and Morty", "Jerry Smith": "Rick and Morty", "Professor Farnsworth": "Futurama", "Maggie Simpson": "The Simpsons",
    "Brian Griffin": "Family Guy", "Lois Griffin": "Family Guy", "Stan Smith": "American Dad", "Roger Smith": "American Dad", "Bob Belcher": "Bob's Burgers", "Tina Belcher": "Bob's Burgers", "Louise Belcher": "Bob's Burgers",
    "Cersei Lannister": "Game of Thrones", "Sansa Stark": "Game of Thrones", "Mace Windu": "Star Wars", "Qui-Gon Jinn": "Star Wars", "Finn Star Wars": "Star Wars", "Lando Calrissian": "Star Wars", "Padme Amidala": "Star Wars", "C-3PO": "Star Wars", "BB-8": "Star Wars",
    "Geordi La Forge": "Star Trek", "William Riker": "Star Trek", "Kathryn Janeway": "Star Trek", "Benjamin Sisko": "Star Trek",
    "James Holden": "The Expanse", "Naomi Nagata": "The Expanse", "Amos Burton": "The Expanse", "Chrisjen Avasarala": "The Expanse",
    "Lady Jessica": "Dune", "Baron Harkonnen": "Dune", Dracula: "Dracula", Frankenstein: "Frankenstein", Wolfman: "Universal Monsters", Spike: "Buffy the Vampire Slayer", Angel: "Buffy the Vampire Slayer",
    Xena: "Xena: Warrior Princess", Hercules: "Hercules: The Legendary Journeys", Newt: "Fantastic Beasts", Predator: "Predator", Robocop: "RoboCop"
  }
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));
app.get("/api/constants", (_req, res) => res.json(CONSTANTS));
app.get("/api/image", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  if (!query || query === "CRIPTOGRAFADA") return res.status(400).json({ error: "query required" });
  return res.json(await findImagePayload(query, category));
});
app.get("/api/image-proxy", async (req, res) => {
  const rawUrl = String(req.query.u || "");
  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.sendStatus(400);
  }
  if (!["http:", "https:"].includes(target.protocol)) return res.sendStatus(400);
  try {
    const image = await fetchImageResource(target, 15000);
    if (!image) {
      console.warn(`Image proxy rejected ${target.href}`);
      return res.sendStatus(415);
    }
    const { bytes, contentType } = image;
    res.setHeader("Content-Type", contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.end(bytes);
  } catch {
    return res.sendStatus(504);
  }
});
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

io.on("connection", (socket) => {
  socket.emit("constants", PLATFORM_CONSTANTS);
  publicRoomList()
    .then((roomList) => socket.emit("rooms:update", roomList))
    .catch((error) => console.error("publicRoomList failed", error));

  socket.on("rooms:list", ({ gameId } = {}, reply) => safe(reply, async () => ({ rooms: await publicRoomList(gameId) })));

  socket.on("auth:me", ({ token }, reply) => safe(reply, async () => ({ user: await meFromToken(token) })));
  socket.on("auth:register", (payload, reply) => safe(reply, () => registerUser(payload)));
  socket.on("auth:login", (payload, reply) => safe(reply, () => loginUser(payload)));
  socket.on("auth:logout", ({ token }, reply) => safe(reply, async () => {
    await logoutUser(token);
    return { ok: true };
  }));
  socket.on("auth:profile", ({ userId, username }, reply) => safe(reply, async () => ({ profile: await getProfile(userId || username) })));
  socket.on("auth:updateProfile", ({ token, displayName, avatar }, reply) => safe(reply, () => updateUserProfile(token, { displayName, avatar })));
  socket.on("auth:getPreferences", ({ token }, reply) => safe(reply, async () => await getUserPreferences(token)));
  socket.on("auth:updatePreferences", ({ token, preferences }, reply) => safe(reply, async () => await updateUserPreferences(token, preferences)));
  socket.on("auth:changePassword", ({ token, currentPassword, newPassword }, reply) => safe(reply, async () => {
    await changeUserPassword(token, { currentPassword, newPassword });
    return { ok: true };
  }));

  socket.on("room:create", ({ name, avatar, clientId, roomName, password, publicRoom: isPublicRoom, authToken, gameId }, reply) => safe(reply, async () => {
    clearPendingDisconnect(clientId);
    const user = await authUserByToken(authToken);
    const room = await uniqueRoom(socket.id, user?.displayName || name, user?.avatar || avatar, clientId, { roomName, password: isPublicRoom === false ? "" : password, publicRoom: isPublicRoom, gameId });
    attachUser(room.players[socket.id], user);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    return { room: publicRoomForPlayer(room, socket.id), playerId: socket.id };
  }));

  socket.on("room:join", ({ code, name, avatar, clientId, role, password, authToken, gameId }, reply) => safe(reply, async () => {
    const room = await getRoom(code);
    validateRoomGame(room, gameId);
    const user = await authUserByToken(authToken);
    validateRoomPassword(room, password);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoomForPlayer(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:resume", ({ code, name, avatar, clientId, role, authToken, gameId }, reply) => safe(reply, async () => {
    const room = await getRoom(code);
    validateRoomGame(room, gameId);
    const user = await authUserByToken(authToken);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoomForPlayer(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:leave", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    const code = room.code;
    const removed = removePlayer(room, socket.id);
    sessions.delete(socket.id);
    socket.leave(code);
    if (onlyTestBots(room)) {
      await discardActiveMatch(room);
      await closeRoomForNoPlayers(room);
    }
    else if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
    }
    else {
      await emitRoom(room);
      if (removed) emitRoomEvent(room, socket.id, "leave", removed);
    }
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("room:activity", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("room:settings", (settings, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    if (roomGameId(room) === "ringbound") updateRingboundSettings(room, socket.id, settings);
    else updateSettings(room, socket.id, settings);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:move", ({ playerId, team }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    movePlayer(room, socket.id, playerId, team);
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:team", ({ team }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    chooseTeam(room, socket.id, team);
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:avatar", ({ avatar, authToken }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    const user = await authUserByToken(authToken);
    const updatedAvatar = user ? (await updateUserProfile(authToken, { avatar })).user.avatar : updatePlayerAvatar(room, socket.id, avatar);
    if (room.players[socket.id]) room.players[socket.id].avatar = updatedAvatar;
    io.to(room.code).emit("player:avatarUpdate", { playerId: socket.id, avatar: updatedAvatar });
    await emitRoom(room);
    return { room: publicRoomForPlayer(room, socket.id) };
  }));

  socket.on("host:kick", ({ playerId }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    kickPlayer(room, socket.id, playerId);
    io.to(playerId).emit("room:kicked");
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:returnLobby", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    await discardActiveMatch(room);
    hostReturnLobby(room, socket.id);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:autoTeams", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    autoTeams(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("chat:send", ({ scope, text }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    sendChatMessage(room, socket.id, scope, text);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("image:broken", ({ word, category, url }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    const invalidated = await invalidateRoomImage(room, word, category, url);
    if (invalidated) {
      await emitRoom(room);
      startRoomImageResolver(room.code);
    }
    return { invalidated };
  }));

  socket.on("image:refresh", ({ word, category }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    // Reativar esta regra depois dos testes para restringir a nova busca ao usuario Biscoito.
    // const player = room.players?.[socket.id];
    // if (String(player?.username || "").toLowerCase() !== "biscoito") throw new Error("Apenas Biscoito pode refazer a busca da imagem.");
    await refreshRoomImage(room, word, category);
    await emitRoom(room);
    startRoomImageResolver(room.code);
    return { ok: true };
  }));

  socket.on("game:start", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    if (roomGameId(room) === "ringbound") {
      startRingboundGame(room, socket.id);
      await emitRoom(room);
      await emitRoomList();
      return { ok: true };
    }
    startGame(structuredClone(room), socket.id);
    const liveRoom = await getRoom(room.code);
    if (liveRoom.phase !== "lobby") return { cancelled: true };
    startGame(liveRoom, socket.id);
    liveRoom.imageMap = {};
    await createActiveMatch(liveRoom);
    await emitRoom(liveRoom);
    await emitRoomList();
    startRoomImageResolver(liveRoom.code);
    return { ok: true };
  }));

  socket.on("ringbound:guess", ({ ringIds }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    submitRingboundGuess(room, socket.id, ringIds);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("ringbound:resolve", ({ ringIds }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    resolveRingboundGuess(room, socket.id, ringIds);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("game:hints", ({ hints }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    submitHints(room, socket.id, hints);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateGuess", ({ kind, guess, targetTeam }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    updateGuess(room, socket.id, kind, guess, targetTeam);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmDecision", ({ kind, targetTeam }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmDecision(room, socket.id, kind, targetTeam);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmResult", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmResult(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateTiebreaker", ({ words }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    updateTiebreaker(room, socket.id, words);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmTiebreaker", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmTiebreaker(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmFinal", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmFinal(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("disconnect", () => {
    const code = sessions.get(socket.id);
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    const player = room.players[socket.id];
    const clientId = player?.clientId || socket.id;
    sessions.delete(socket.id);
    const timer = setTimeout(async () => {
      pendingDisconnects.delete(clientId);
      const liveRoom = await getRoom(code).catch(() => null);
      if (!liveRoom) return;
      const removed = removePlayer(liveRoom, socket.id);
      if (!removed) return;
      if (onlyTestBots(liveRoom)) {
        await discardActiveMatch(liveRoom).catch((error) => console.error("discardMatch failed", error));
        await closeRoomForNoPlayers(liveRoom).catch((error) => console.error("closeRoom failed", error));
      }
      else if (shouldReturnSpectatorsToLobby(liveRoom)) {
        await returnSpectatorsToLobby(liveRoom).catch((error) => console.error("returnSpectators failed", error));
      }
      else {
        await emitRoom(liveRoom);
        emitRoomEvent(liveRoom, socket.id, "leave", removed);
      }
      await emitRoomList();
    }, 1500);
    pendingDisconnects.set(clientId, timer);
  });
});

async function uniqueRoom(playerId, name, avatar, clientId, roomOptions) {
  let room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  while (rooms.has(room.code) || await loadRoom(room.code)) room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  if (cleanGameId(roomOptions?.gameId) === "ringbound") setupRingboundRoom(room, roomOptions);
  rooms.set(room.code, room);
  return room;
}

async function currentRoom(socket) {
  const code = sessions.get(socket.id);
  return getRoom(code);
}

async function getRoom(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const localRoom = normalizeAnyRoom(rooms.get(normalizedCode));
  const databaseRoom = normalizeAnyRoom(await loadRoom(normalizedCode));
  const room = newestRoom(localRoom, databaseRoom);
  if (!room) throw new Error("Sala nao encontrada.");
  rooms.set(normalizedCode, room);
  return room;
}

async function emitRoom(room) {
  const hadInactivityWarning = Boolean(room.inactivityWarningAt);
  if (hadInactivityWarning) {
    room.inactivityWarningAt = null;
    room.inactivityClosesAt = null;
  }
  room.updatedAt = Date.now(); // Update timestamp for cleanup tracking
  await recordMatch(room).catch((error) => console.error("recordMatch failed", error));
  await saveRoom(room);
  rooms.set(room.code, room);
  if (hadInactivityWarning) io.to(room.code).emit("room:inactivityClear");
  Object.keys(room.players).forEach((playerId) => {
    io.to(playerId).emit("room:update", publicRoomForPlayer(room, playerId));
  });
}

function attachUser(player, user) {
  if (!player || !user) return;
  player.userId = user.id;
  player.username = user.username;
  player.name = user.displayName;
  player.avatar = user.avatar || player.avatar || "";
}

async function emitRoomList() {
  io.emit("rooms:update", await publicRoomList());
}

async function publicRoomList(gameId = "") {
  const wantedGame = cleanGameId(gameId);
  const databaseRooms = await listRooms();
  databaseRooms.forEach((room) => {
    room = normalizeAnyRoom(room);
    if (!room?.code) return;
    const normalizedCode = String(room.code).trim().toUpperCase();
    rooms.set(normalizedCode, newestRoom(normalizeAnyRoom(rooms.get(normalizedCode)), room));
  });
  return Array.from(rooms.values())
    .filter((room) => room.publicRoom !== false)
    .filter((room) => !wantedGame || roomGameId(room) === wantedGame)
    .map(roomSummary);
}

function newestRoom(localRoom, databaseRoom) {
  if (!localRoom) return databaseRoom;
  if (!databaseRoom) return localRoom;
  const localUpdated = Number(localRoom.updatedAt || localRoom.createdAt || 0);
  const databaseUpdated = Number(databaseRoom.updatedAt || databaseRoom.createdAt || 0);
  return databaseUpdated >= localUpdated ? databaseRoom : localRoom;
}

function roomSummary(room) {
  const players = Object.values(room.players || {});
  const host = room.players?.[room.hostId] || players.find((player) => player.isHost);
  return {
    code: room.code,
    gameId: roomGameId(room),
    name: room.name || room.code,
    hostName: host?.name || "Host",
    playerCount: players.length,
    phase: room.phase,
    inGame: room.phase !== "lobby",
    hasPassword: Boolean(room.password),
    category: roomGameId(room) === "ringbound" ? room.settings?.wordCategory || "Geral" : room.settings?.category || "Geral",
    updatedAt: room.updatedAt || room.createdAt || 0
  };
}

function normalizeAnyRoom(room) {
  const normalized = normalizeRoom(room);
  return roomGameId(normalized) === "ringbound" ? normalizeRingboundRoom(normalized) : normalized;
}

function publicRoomForPlayer(room, playerId) {
  return roomGameId(room) === "ringbound" ? ringboundPublicRoom(room, playerId) : publicRoom(room, playerId);
}

function validateRoomPassword(room, password) {
  if (!room.password) return;
  if (String(password || "") !== room.password) throw new Error("Senha incorreta.");
}

function validateRoomGame(room, gameId) {
  const expectedGame = cleanGameId(gameId);
  if (!expectedGame) return;
  if (roomGameId(room) !== expectedGame) throw new Error("Esta sala pertence a outro jogo.");
}

function cleanGameId(gameId) {
  const clean = String(gameId || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return clean;
}

function roomGameId(room) {
  return cleanGameId(room?.gameId) || "code-hack";
}

function emitRoomEvent(room, exceptPlayerId, type, player) {
  io.to(room.code).except(exceptPlayerId).emit("room:event", {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    playerName: player?.name || "Jogador",
    sessionTag: player?.sessionTag || "",
    avatar: player?.avatar || "",
    team: player?.team || null,
    at: Date.now()
  });
}

function clearPendingDisconnect(clientId) {
  const key = String(clientId || "");
  const timer = pendingDisconnects.get(key);
  if (!timer) return false;
  clearTimeout(timer);
  pendingDisconnects.delete(key);
  return true;
}

function onlyTestBots(room) {
  const players = Object.values(room.players || {});
  return players.length > 0 && players.every((player) => player.testBot);
}

function hasActiveRoomPlayers(room) {
  return Object.values(room.players || {}).some((player) => (
    !player.spectator && TEAMS.includes(player.team) && !player.testBot
  ));
}

function shouldReturnSpectatorsToLobby(room) {
  return room && room.phase !== "lobby" && !hasActiveRoomPlayers(room) && Object.keys(room.players || {}).length > 0;
}

async function returnSpectatorsToLobby(room) {
  await discardActiveMatch(room).catch((error) => console.error("discardMatch failed", error));
  room.phase = "lobby";
  room.round = 0;
  room.current = null;
  room.tiebreaker = null;
  room.final = null;
  room.settings.randomTeams = false;
  TEAMS.forEach((team) => {
    room.teams[team].words = [];
    room.teams[team].hintHistory = [];
    room.teams[team].score = { correct: 0, interceptions: 0, lives: room.settings?.startingLives || CONSTANTS.STARTING_LIVES };
  });
  room.imageMap = {};
  room.chat ||= {};
  room.chat.team = { red: [], blue: [] };
  room.chat.spectator = [];
  Object.values(room.players || {}).forEach((player) => {
    player.team = null;
    player.spectator = true;
  });
  io.to(room.code).emit("room:inactiveClosed", { reason: "noPlayers" });
  await emitRoom(room);
  await emitRoomList();
}

async function closeRoomForNoPlayers(room) {
  const code = room.code;
  io.to(code).emit("room:inactiveClosed", { reason: "noPlayers" });
  Object.keys(room.players || {}).forEach((playerId) => {
    sessions.delete(playerId);
    io.sockets.sockets.get(playerId)?.leave(code);
  });
  rooms.delete(code);
  await deleteRoom(code).catch((error) => console.error("deleteRoom failed", error));
  await emitRoomList();
}

function detachPreviousSocket(previousId, code) {
  if (!previousId) return;
  sessions.delete(previousId);
  io.sockets.sockets.get(previousId)?.leave(code);
}

function safe(reply, fn) {
  Promise.resolve()
    .then(fn)
    .then((result) => reply?.({ ok: true, ...result }))
    .catch((error) => reply?.({ ok: false, error: error.message || "Erro inesperado." }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheImage(key, payload) {
  const normalized = payload?.url ? { ...payload, url: proxiedImageUrl(payload.url) } : payload;
  imageCache.set(key, normalized);
  return normalized;
}

function emptyImagePayload() {
  return { url: null, source: "fallback" };
}

function proxiedImageUrl(url) {
  const value = String(url || "");
  if (!/^https?:\/\//i.test(value)) return value;
  return `/api/image-proxy?u=${encodeURIComponent(value)}`;
}

async function findImagePayload(query, category, options = {}) {
  const cacheKey = `${category}:${query}`.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey);
    if (!cached?.url || validStoredImageUrl(cached.url)) {
      if (!urlBlockedForLookup(cached?.url, options.excludeUrls)) return cached;
    }
    imageCache.delete(cacheKey);
  }
  const pokemon = await pokemonImage(query);
  if (!urlBlockedForLookup(pokemon, options.excludeUrls) && await imageAvailable(pokemon)) return cacheImage(cacheKey, { url: pokemon, source: "pokeapi" });
  if (category === "Geral") {
    const pexels = await pexelsImage(query, { limit: 20, randomizeFirstPage: true, excludeUrls: options.excludeUrls });
    if (pexels) return cacheImage(cacheKey, { url: pexels.url, source: "pexels", photographer: pexels.photographer, page: pexels.page });
    const wiki = await wikiImageForTerms(imageSearchTerms(query), { random: options.force, excludeUrls: options.excludeUrls });
    if (wiki) return cacheImage(cacheKey, { url: wiki, source: "wikimedia", searchQuery: query });
    return emptyImagePayload();
  }
  if (category === "Filmes") {
    const poster = await omdbImage(query);
    if (!urlBlockedForLookup(poster, options.excludeUrls) && await imageAvailable(poster)) return cacheImage(cacheKey, { url: poster, source: "omdb" });
  }
  const external = await externalImagePayload(query, category, options);
  if (external?.url) return cacheImage(cacheKey, external);
  return emptyImagePayload();
}

async function resolveRoomImages(room, onImageFound = null) {
  const category = room.settings?.category || "";
  room.imageMap ||= {};
  removeGeneratedImageEntries(room);
  const missing = missingRoomImages(room);
  await mapWithConcurrency(missing, IMAGE_LOOKUP_CONCURRENCY, async (word) => {
    const key = imageCacheKey(word, category);
    const url = await resolveImageUrlForWord(word, category);
    if (url) {
      room.imageMap[key] = url;
      if (onImageFound) onImageFound(key, url);
    }
  });
  return room.imageMap;
}

async function startRoomImageResolver(code) {
  const roomCode = String(code || "").trim().toUpperCase();
  if (!roomCode || imageResolveJobs.has(roomCode)) return;
  imageResolveJobs.add(roomCode);
  try {
    let attempt = 0;
    while (true) {
      const room = await getRoom(roomCode).catch(() => null);
      if (!room || room.phase === "lobby") break;
      const before = JSON.stringify(room.imageMap || {});
      await resolveRoomImages(room, () => {
        io.to(room.code).emit("room:imageMap", room.imageMap || {});
      });
      const after = JSON.stringify(room.imageMap || {});
      if (after !== before) await emitRoom(room);
      if (!missingRoomImages(room).length) break;
      attempt += 1;
      await sleep(Math.min(3000 + attempt * 1500, 15000));
    }
  } finally {
    imageResolveJobs.delete(roomCode);
  }
}

async function resolveImageUrlForWord(word, category, options = {}) {
  if (category === "Pokemon") {
    const url = proxiedImageUrl(pokemonSpriteUrl(word));
    return await imageAvailable(pokemonSpriteUrl(word)) ? url : "";
  }
  if (!["Geral", "Filmes"].includes(category)) {
    const cacheKey = `${category}:${word}`.toLocaleLowerCase();
    if (imageCache.has(cacheKey)) {
      const cached = imageCache.get(cacheKey);
      if (cached?.url && validStoredImageUrl(cached.url)) return cached.url;
      imageCache.delete(cacheKey);
    }
    const stored = await loadStoredWordImage(category, word);
    if (stored?.url) return cacheImage(cacheKey, { url: stored.url, source: stored.source || "word-db" }).url;
    const payload = await externalImagePayloadForWord(word, category, options);
    if (payload?.url) {
      await saveWordImage(category, word, payload.url, payload.source, payload.searchQuery || externalImageSearchTermsForWord(word, category)[0] || "");
      return cacheImage(cacheKey, payload).url;
    }
    return "";
  }
  const query = serverImageSearchQuery(word, category);
  const payload = await findImagePayload(query, category, options);
  return payload?.url || "";
}

async function loadStoredWordImage(category, word) {
  const stored = await loadWordImage(category, word);
  if (!stored?.url || !validStoredImageUrl(stored.url)) return null;
  const expectedQuery = externalImageSearchTermsForWord(word, category)[0] || "";
  if (expectedQuery && stored.searchQuery !== expectedQuery) {
    await deleteWordImage(category, word);
    return null;
  }
  if (await imageAvailable(stored.url)) return stored;
  markBrokenImageUrl(stored.url);
  await deleteWordImage(category, word);
  return null;
}

async function refreshRoomImage(room, word, category) {
  const cleanWord = String(word || "").trim();
  const imageCategory = String(category || room.settings?.category || "").trim();
  if (!cleanWord || !imageCategory) return;
  const key = imageCacheKey(cleanWord, imageCategory);
  const excludedUrls = imageLookupExclusions(room.imageMap?.[key]);
  delete room.imageMap?.[key];
  imageCache.delete(`${imageCategory}:${cleanWord}`.toLocaleLowerCase());
  imageFailureCounts.set(imageFailureKey(cleanWord, imageCategory), 10);
  await deleteWordImage(imageCategory, cleanWord);
  const url = await resolveImageUrlForWord(cleanWord, imageCategory, { force: true, excludeUrls: excludedUrls });
  if (url) room.imageMap[key] = url;
}

async function invalidateRoomImage(room, word, category, url) {
  const cleanWord = String(word || "").trim();
  const imageCategory = String(category || room.settings?.category || "").trim();
  if (!cleanWord || !imageCategory) return false;
  const key = imageCacheKey(cleanWord, imageCategory);
  if (!room.imageMap?.[key]) return false;
  if (url && room.imageMap[key] !== url) return false;
  if (await proxiedImageStillLoads(room.imageMap[key])) return false;
  markBrokenImageUrl(room.imageMap[key]);
  delete room.imageMap[key];
  await deleteWordImage(imageCategory, cleanWord);
  const query = serverImageSearchQuery(cleanWord, imageCategory);
  imageCache.delete(`${imageCategory}:${cleanWord}`.toLocaleLowerCase());
  imageCache.delete(`${imageCategory}:${query}`.toLocaleLowerCase());
  imageSearchTerms(query).forEach((term) => {
    imageCache.delete(`${imageCategory}:${term}`.toLocaleLowerCase());
  });
  return true;
}

function missingRoomImages(room) {
  const category = room.settings?.category || "";
  return TEAMS.flatMap((team) => room.teams?.[team]?.words || [])
    .filter((word) => !validStoredImageUrl(room.imageMap?.[imageCacheKey(word, category)]));
}

function validStoredImageUrl(url) {
  const value = String(url || "");
  return Boolean(value) && !value.startsWith("data:image");
}

function removeGeneratedImageEntries(room) {
  const imageMap = room.imageMap || {};
  Object.keys(imageMap).forEach((key) => {
    if (!validStoredImageUrl(imageMap[key])) delete imageMap[key];
  });
}

function imageCacheKey(word, category) {
  return `${category || ""}:${encodeURIComponent(String(word || "").trim().toLowerCase())}`;
}

function serverImageSearchQuery(word, category) {
  const cleanWord = String(word || "").trim();
  const searchWord = serverSearchName(cleanWord, category);
  if (category === "Geral") return generalImageSearchTerm(cleanWord);
  if (category === "Famosos") return searchWord;
  const origin = serverWordOrigin(cleanWord, category);
  if (isFictionalImageCategory(category)) return characterImageSearchTerm(searchWord, origin || fallbackFictionOrigin(category));
  const suffix = {
    Anime: "anime character",
    Filmes: "movie",
    Jogos: "video game character",
    Geek: "fictional character"
  }[category] || category || "";
  return `${searchWord} ${suffix}`.trim();
}

async function externalImagePayload(query, category, options = {}) {
  const terms = externalImageSearchTermsFromQuery(query);
  const serper = await serperImage(terms[0], { random: false, excludeUrls: options.excludeUrls });
  if (serper) return { url: serper, source: "serper", searchQuery: terms[0] };
  for (const term of terms) {
    const wiki = await wikiImageForTerms([term], { random: false, excludeUrls: options.excludeUrls });
    if (wiki) return { url: wiki, source: "wikimedia", searchQuery: term };
  }
  return emptyImagePayload();
}

async function externalImagePayloadForWord(word, category, options = {}) {
  const failureKey = imageFailureKey(word, category);
  const random = (imageFailureCounts.get(failureKey) || 0) >= 10;
  const terms = externalImageSearchTermsForWord(word, category);
  const serper = await serperImage(terms[0], { random, excludeUrls: options.excludeUrls });
  if (serper) {
    imageFailureCounts.delete(failureKey);
    return { url: serper, source: "serper", searchQuery: terms[0] };
  }
  for (const term of terms) {
    const wiki = await wikiImageForTerms([term], { random, excludeUrls: options.excludeUrls });
    if (wiki) {
      imageFailureCounts.delete(failureKey);
      return { url: wiki, source: "wikimedia", searchQuery: term };
    }
  }
  imageFailureCounts.set(failureKey, (imageFailureCounts.get(failureKey) || 0) + 1);
  return emptyImagePayload();
}

function imageFailureKey(word, category) {
  return `${category || ""}:${String(word || "").trim().toLocaleLowerCase()}`;
}

function externalImageSearchTermsForWord(word, category) {
  const cleanWord = String(word || "").trim();
  const searchWord = serverSearchName(cleanWord, category);
  const origin = serverWordOrigin(cleanWord, category);
  if (isFictionalImageCategory(category)) {
    const qualified = characterImageSearchTerm(searchWord, origin || fallbackFictionOrigin(category));
    return uniqueSearchTerms([qualified, searchWord, cleanWord]);
  }
  return uniqueSearchTerms(origin ? [`${searchWord} ${origin}`, searchWord, cleanWord] : [searchWord, cleanWord]);
}

function serverWordOrigin(word, category) {
  const cleanWord = String(word || "").trim();
  const searchWord = serverSearchName(cleanWord, category);
  return SERVER_WORD_ORIGINS[category]?.[cleanWord]
    || SERVER_ORIGIN_PATCH[category]?.[cleanWord]
    || SERVER_COMPLETE_ORIGIN_PATCH[category]?.[cleanWord]
    || SERVER_WORD_ORIGINS[category]?.[searchWord]
    || SERVER_ORIGIN_PATCH[category]?.[searchWord]
    || SERVER_COMPLETE_ORIGIN_PATCH[category]?.[searchWord]
    || "";
}

function serverSearchName(word, category) {
  const cleanWord = String(word || "").trim();
  return SERVER_SEARCH_NAME_PATCH[category]?.[cleanWord] || cleanWord;
}

function generalImageSearchTerm(word) {
  const cleanWord = String(word || "").trim();
  const normalized = stripAccents(cleanWord);
  return SERVER_GENERAL_IMAGE_ALIAS[cleanWord]
    || SERVER_GENERAL_IMAGE_ALIAS[normalized]
    || SERVER_GENERAL_IMAGE_ALIAS_EXTRA[cleanWord]
    || SERVER_GENERAL_IMAGE_ALIAS_EXTRA[normalized]
    || cleanWord;
}

function characterImageSearchTerm(word, origin) {
  const cleanWord = String(word || "").trim();
  const cleanOrigin = String(origin || "").trim();
  return cleanOrigin ? `${cleanWord} from ${cleanOrigin}` : cleanWord;
}

function stripAccents(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isFictionalImageCategory(category) {
  return ["Anime", "Jogos", "Geek"].includes(category);
}

function fallbackFictionOrigin(category) {
  return {
    Anime: "anime character",
    Jogos: "video game character",
    Geek: "fictional character"
  }[category] || "";
}

function externalImageSearchTermsFromQuery(query) {
  const trimmed = String(query || "").trim();
  const simplified = simplifyExternalSearchTerm(trimmed);
  return uniqueSearchTerms([trimmed, simplified]);
}

function simplifyExternalSearchTerm(term) {
  const cleaned = String(term || "")
    .replace(/\s+(anime character|video game character|fictional character|famous person|movie)$/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(/\s+/).slice(0, 2).join(" ") || cleaned;
}

function pokemonSpriteUrl(word) {
  const slug = String(word || "")
    .replace(/^Mr\.?\s+(Mime|Rime)$/i, "mr$1")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `https://projectpokemon.org/images/normal-sprite/${slug}.gif` : "";
}

async function serperImage(query, options = {}) {
  const links = await serperImageCandidates(query);
  const candidates = options.random ? shuffleValues(links) : links;
  return firstAvailableUrl(candidates, options);
}

async function serperImageCandidates(query) {
  const key = process.env.SERPER_API_KEY || process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY;
  if (!key) {
    logSerperConfigWarning("SERPER_API_KEY ausente; usando Wikimedia como fallback.");
    return [];
  }
  console.log(`Serper image query: ${query}`);
  try {
    const response = await fetchWithTimeout("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query })
    });
    if (!response.ok) {
      await logSerperImageError(response);
      return [];
    }
    const data = await response.json();
    return uniqueSearchTerms((data.images || []).flatMap((item) => [item?.imageUrl, item?.thumbnailUrl]).filter(Boolean));
  } catch {
    return [];
  }
}

function logSerperConfigWarning(message) {
  if (serperConfigWarnings.has(message)) return;
  serperConfigWarnings.add(message);
  console.warn(message);
}

async function logSerperImageError(response) {
  let message = `HTTP ${response.status}`;
  let reason = "";
  try {
    const data = await response.json();
    message = data.message || data.error || data.error_message || message;
    reason = data.statusCode || "";
  } catch {
    // Keep logging best-effort; image search can fall back to Wikimedia.
  }
  const key = `${response.status}:${reason}:${message}`;
  if (serperImageWarnings.has(key)) return;
  serperImageWarnings.add(key);
  console.warn(`Serper image search unavailable: ${message}${reason ? ` (${reason})` : ""}`);
}

async function pexelsImage(query, options = {}) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.warn(`Pexels image search skipped: missing PEXELS_API_KEY for "${query}"`);
    return null;
  }
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  const perPage = Math.max(1, Math.min(Number(options.limit || 1), 20));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", "1");
  url.searchParams.set("orientation", "square");
  url.searchParams.set("locale", "en-US");
  console.log(`Pexels image search: "${query}" page=1 per_page=${perPage} randomize_first_page=${Boolean(options.randomizeFirstPage)}`);
  try {
    const response = await fetchWithTimeout(url, { headers: { Authorization: key } });
    if (!response.ok) {
      console.warn(`Pexels image search failed: "${query}" HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    const photos = options.randomizeFirstPage ? shuffleValues(data.photos || []) : (data.photos || []);
    console.log(`Pexels image search results: "${query}" candidates=${photos.length}`);
    for (const photo of photos) {
      const imageUrl = photo?.src?.medium || photo?.src?.large || photo?.src?.original;
      if (urlBlockedForLookup(imageUrl, options.excludeUrls)) {
        console.log(`Pexels image candidate skipped: "${query}" repeated_url=${imageUrl}`);
        continue;
      }
      if (imageUrl && await imageAvailable(imageUrl)) {
        console.log(`Pexels image selected: "${query}" photo_id=${photo.id || ""} photographer="${photo.photographer || ""}" url=${imageUrl}`);
        return {
          url: imageUrl,
          photographer: photo.photographer || "",
          page: photo.url || ""
        };
      }
    }
    console.warn(`Pexels image search empty: "${query}" no valid candidate`);
    return null;
  } catch (error) {
    console.warn(`Pexels image search error: "${query}" ${error?.message || error}`);
    return null;
  }
}

async function omdbImage(query) {
  const key = process.env.OMDB_API_KEY || "34925b28";
  const title = String(query || "")
    .trim()
    .replace(/\s+movie$/i, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
  if (!title) return null;
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("t", title);
  url.searchParams.set("apikey", key);
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.Poster && data.Poster !== "N/A" ? data.Poster : null;
  } catch {
    return null;
  }
}

async function pokemonImage(query) {
  if (!/\bpokemon\b/i.test(query)) return null;
  const name = query
    .replace(/\bpokemon\b/ig, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!name) return null;
  const aliases = new Map([
    ["mr-mime", "mr-mime"],
    ["ho-oh", "ho-oh"],
    ["nidoran", "nidoran-f"]
  ]);
  try {
    const response = await fetchWithTimeout(`https://pokeapi.co/api/v2/pokemon/${aliases.get(name) || name}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function imageAvailable(url) {
  return Boolean(await probeImageResource(url, 3000));
}

async function fetchImageResource(url, timeoutMs = 8000) {
  if (!url) return null;
  const target = normalizeExternalImageUrl(url);
  if (!target) return null;
  if (brokenImageUrls.has(target.href)) return null;
  const cacheKey = target.href;
  const cached = imageBinaryCache.get(cacheKey);
  if (cached) return cached;
  try {
    const response = await fetchWithTimeout(target, {
      headers: {
        "User-Agent": "CodeHackImageProbe/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    }, timeoutMs);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!isLikelyImage(bytes, contentType)) return null;
    const image = { bytes, contentType: contentType || guessImageContentType(bytes) || "image/jpeg" };
    cacheImageBytes(cacheKey, image);
    return image;
  } catch {
    return null;
  }
}

async function probeImageResource(url, timeoutMs = 3000) {
  if (!url) return null;
  const target = normalizeExternalImageUrl(url);
  if (!target) return null;
  if (brokenImageUrls.has(target.href)) return null;
  const cached = imageBinaryCache.get(target.href);
  if (cached) return cached;
  try {
    const response = await fetchWithTimeout(target, {
      headers: {
        "User-Agent": "CodeHackImageProbe/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Range: "bytes=0-4095"
      }
    }, timeoutMs);
    if (!response.ok && response.status !== 206) return null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) return null;
    const bytes = await readFirstBytes(response, 4096);
    return isLikelyImage(bytes, contentType) ? { bytes, contentType } : null;
  } catch {
    return null;
  }
}

async function readFirstBytes(response, maxBytes = 4096) {
  const reader = response.body?.getReader?.();
  if (!reader) return Buffer.from(await response.arrayBuffer()).subarray(0, maxBytes);
  const chunks = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { value, done } = await reader.read();
      if (done || !value) break;
      const chunk = Buffer.from(value);
      chunks.push(chunk);
      total += chunk.length;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).subarray(0, maxBytes);
}

function isLikelyImage(bytes, contentType = "") {
  if (!bytes?.length) return false;
  const type = String(contentType || "").toLowerCase();
  if (type.includes("svg")) return bytes.toString("utf8", 0, Math.min(bytes.length, 512)).includes("<svg");
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 3) === "GIF") return true;
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return true;
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp" && /avif|heic|heif/.test(bytes.toString("ascii", 8, 16))) return true;
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return true;
  if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return true;
  if (type.startsWith("image/") && bytes.length > 0) return true;
  return false;
}

function proxiedImageStillLoads(url) {
  return imageAvailable(url);
}

function normalizeExternalImageUrl(url) {
  const value = String(url || "");
  try {
    if (value.startsWith("/api/image-proxy")) {
      const proxy = new URL(value, "http://codehack.local");
      const raw = proxy.searchParams.get("u");
      return raw ? new URL(raw) : null;
    }
    const target = new URL(value);
    return ["http:", "https:"].includes(target.protocol) ? target : null;
  } catch {
    return null;
  }
}

function markBrokenImageUrl(url) {
  const target = normalizeExternalImageUrl(url);
  if (target) brokenImageUrls.add(target.href);
}

function cacheImageBytes(key, image) {
  if (!image?.bytes?.length || image.bytes.length > MAX_IMAGE_CACHE_BYTES) return;
  if (imageBinaryCache.has(key)) imageBinaryCache.delete(key);
  imageBinaryCache.set(key, image);
  while (imageBinaryCache.size > MAX_IMAGE_CACHE_ENTRIES) {
    const oldest = imageBinaryCache.keys().next().value;
    imageBinaryCache.delete(oldest);
  }
}

function guessImageContentType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "";
}

async function firstAvailableUrl(urls, options = {}) {
  const queue = uniqueSearchTerms(urls);
  for (const url of queue) {
    if (urlBlockedForLookup(url, options.excludeUrls)) continue;
    if (await imageAvailable(url)) return url;
  }
  return null;
}

function imageLookupExclusions(url) {
  const blocked = new Set();
  addImageLookupExclusion(blocked, url);
  return blocked;
}

function addImageLookupExclusion(blocked, url) {
  const normalized = normalizeImageLookupUrl(url);
  if (normalized) blocked.add(normalized);
}

function urlBlockedForLookup(url, blocked) {
  if (!blocked?.size) return false;
  const normalized = normalizeImageLookupUrl(url);
  return Boolean(normalized && blocked.has(normalized));
}

function normalizeImageLookupUrl(url) {
  const target = normalizeExternalImageUrl(url);
  if (!target) return "";
  target.hash = "";
  return target.href;
}

async function mapWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(workers);
}

function shuffleValues(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

async function wikiImage(query, options = {}) {
  return wikiImageForTerms(imageSearchTerms(query), options);
}

async function wikiImageForTerms(terms, options = {}) {
  for (const term of uniqueSearchTerms(terms)) {
    if (!options.random) {
      const summaryImage = await wikiSummaryImage(term);
      if (await imageAvailable(summaryImage)) return summaryImage;
    }

    const commons = new URL("https://commons.wikimedia.org/w/api.php");
    commons.searchParams.set("action", "query");
    commons.searchParams.set("generator", "search");
    commons.searchParams.set("gsrsearch", term);
    commons.searchParams.set("gsrnamespace", "6");
    commons.searchParams.set("gsrlimit", options.random ? "10" : "5");
    commons.searchParams.set("prop", "imageinfo");
    commons.searchParams.set("iiprop", "url");
    commons.searchParams.set("format", "json");
    commons.searchParams.set("origin", "*");
    try {
      const response = await fetchWithTimeout(commons);
      if (response.ok) {
        const data = await response.json();
        const urls = Object.values(data.query?.pages || {}).map((page) => page?.imageinfo?.[0]?.url).filter(Boolean);
        const candidates = options.random ? shuffleValues(urls) : urls;
        const available = await firstAvailableUrl(candidates, options);
        if (available) return available;
      }
    } catch {
      // Keep the image lookup best-effort; gameplay should not depend on it.
    }
    if (!options.random) {
      const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(term));
      try {
        const response = await fetchWithTimeout(summary);
        if (!response.ok) continue;
        const data = await response.json();
        if (await imageAvailable(data.thumbnail?.source)) return data.thumbnail.source;
      } catch {
        // Try the next term.
      }
    } else {
      const search = await wikiSearchImages(term, 10);
      const available = await firstAvailableUrl(shuffleValues(search), options);
      if (available) return available;
    }
  }
  return null;
}

async function wikiSearchImages(term, limit = 10) {
  const search = new URL("https://en.wikipedia.org/w/api.php");
  search.searchParams.set("action", "query");
  search.searchParams.set("generator", "search");
  search.searchParams.set("gsrsearch", term);
  search.searchParams.set("gsrlimit", String(limit));
  search.searchParams.set("prop", "pageimages");
  search.searchParams.set("piprop", "thumbnail|original");
  search.searchParams.set("pithumbsize", "600");
  search.searchParams.set("format", "json");
  search.searchParams.set("origin", "*");
  try {
    const response = await fetchWithTimeout(search);
    if (!response.ok) return [];
    const data = await response.json();
    return Object.values(data.query?.pages || {}).flatMap((page) => [page?.original?.source, page?.thumbnail?.source]).filter(Boolean);
  } catch {
    return [];
  }
}

async function wikiSummaryImage(term) {
  const direct = await wikiSummaryThumbnail(term);
  if (direct) return direct;
  const search = new URL("https://en.wikipedia.org/w/api.php");
  search.searchParams.set("action", "query");
  search.searchParams.set("list", "search");
  search.searchParams.set("srsearch", term);
  search.searchParams.set("srlimit", "1");
  search.searchParams.set("format", "json");
  search.searchParams.set("origin", "*");
  try {
    const response = await fetchWithTimeout(search);
    if (!response.ok) return null;
    const data = await response.json();
    const title = data.query?.search?.[0]?.title;
    return title ? wikiSummaryThumbnail(title) : null;
  } catch {
    return null;
  }
}

async function wikiSummaryThumbnail(title) {
  const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title));
  try {
    const response = await fetchWithTimeout(summary);
    if (!response.ok) return null;
    const data = await response.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

function imageSearchTerms(query) {
  const trimmed = query.trim();
  const withoutCategory = trimmed.replace(/\s+(geral|anime|pokemon|filme|filmes|jogo|jogos|geek|famosos|movie|famous person|fictional character|video game character|anime character)$/i, "").trim();
  const withoutParentheses = trimmed.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const firstWords = withoutCategory.split(/\s+/).slice(0, 2).join(" ");
  const firstWord = withoutCategory.split(/\s+/)[0] || "";
  if (/\s+(famosos|famous person)$/i.test(trimmed)) return uniqueSearchTerms([withoutCategory, firstWords, firstWord]);
  if (/\s+geral$/i.test(trimmed)) return uniqueSearchTerms([withoutCategory, firstWords, firstWord, trimmed]);
  return uniqueSearchTerms([trimmed, withoutParentheses, withoutCategory, firstWords, firstWord]);
}

function uniqueSearchTerms(terms) {
  return [...new Set(terms.map((term) => String(term || "").trim()).filter(Boolean))];
}

async function loadRoomsFromDatabase() {
  try {
    const roomsFromDb = await listRooms();
    if (roomsFromDb && Array.isArray(roomsFromDb)) {
      roomsFromDb.forEach((room) => {
        room = normalizeRoom(room);
        if (room && room.code) {
          rooms.set(room.code, room);
          if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
        }
      });
      console.log(`Loaded ${roomsFromDb.length} rooms from the database`);
    }
  } catch (error) {
    console.error("Failed to load rooms from database:", error.message);
  }
}

// Periodic cleanup of abandoned and inactive rooms.
async function cleanupAbandonedRooms() {
  try {
    const now = Date.now();
    const oneHourAgo = now - ROOM_INACTIVITY_LIMIT_MS;

    const databaseRooms = await listRooms().catch(() => []);
    databaseRooms.forEach((room) => {
      room = normalizeRoom(room);
      if (room?.code) rooms.set(room.code, newestRoom(normalizeRoom(rooms.get(room.code)), room));
    });

    for (const [code, roomValue] of rooms.entries()) {
      const room = normalizeRoom(roomValue);
      if (!room) continue;
      const players = Object.keys(room.players || {});
      const emptyRoom = players.length === 0;
      const noActivePlayers = !hasActiveRoomPlayers(room);
      const staleRoom = !room?.updatedAt || room.updatedAt < oneHourAgo;
      if (emptyRoom && staleRoom) {
        console.log(`Cleaning up abandoned room: ${code}`);
        rooms.delete(code);
        await deleteRoom(code).catch(() => {});
        continue;
      }
      if (shouldReturnSpectatorsToLobby(room)) {
        console.log(`Returning spectator-only match to lobby: ${code}`);
        await returnSpectatorsToLobby(room);
        continue;
      }
      if (emptyRoom) continue;
      const closesAt = Number(room.updatedAt || room.createdAt || now) + ROOM_INACTIVITY_LIMIT_MS;
      const warnAt = closesAt - ROOM_INACTIVITY_WARNING_MS;
      if (now >= closesAt) {
        console.log(`Closing inactive room: ${code}`);
        await closeInactiveRoom(room);
        continue;
      }
      if (now >= warnAt && !room.inactivityWarningAt) {
        room.inactivityWarningAt = now;
        room.inactivityClosesAt = closesAt;
        rooms.set(code, room);
        await saveRoom(room).catch(() => {});
        io.to(code).emit("room:inactivityWarning", {
          id: `inactivity-${code}`,
          type: "inactivity",
          closesAt,
          at: now
        });
      }
    }
  } catch (error) {
    console.error("Failed to cleanup abandoned rooms:", error.message);
  }
}

async function closeInactiveRoom(room) {
  const code = room.code;
  await discardActiveMatch(room).catch((error) => console.error("discardMatch failed", error));
  io.to(code).emit("room:inactiveClosed", { reason: "inactivity" });
  Object.keys(room.players || {}).forEach((playerId) => {
    sessions.delete(playerId);
    io.sockets.sockets.get(playerId)?.leave(code);
  });
  rooms.delete(code);
  await deleteRoom(code).catch((error) => console.error("deleteRoom failed", error));
  await emitRoomList();
}

setInterval(cleanupAbandonedRooms, ROOM_CLEANUP_INTERVAL_MS);

httpServer.listen(PORT, async () => {
  console.log(`Code Hack server listening on http://localhost:${PORT}`);
  await loadRoomsFromDatabase();
});
