import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import "./firebase.js";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Minus,
  Pencil,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Settings,
  Shuffle,
  Sparkles,
  Trash2,
  Unplug,
  UserCircle,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const ICONS = {
  logo: "/icons/logo.png",
  life: "/icons/vida.png",
  decrypt: "/icons/descriptografia.png",
  confirmed: "/icons/confirmado.png",
  leader: "/icons/lider.png"
};

const SITE_ASSETS = {
  logo: "/meira-games/logo-meira-games-640x240.svg",
  codeHackCard: "/meira-games/game-card-code-hack-900x540.svg",
  ringboundCard: "/meira-games/game-card-ringbound-900x540.svg",
  comingSoonCard: "/meira-games/game-card-coming-soon-900x540.svg",
  codeHackSlide: "/meira-games/slideshow-code-hack-1600x560.svg",
  ringboundSlide: "/meira-games/slideshow-ringbound-1600x560.svg"
};

const GAME_CATALOG = [
  {
    id: "code-hack",
    name: "Code Hack",
    subtitle: "combate de hackers",
    description: "Deduza codigos, proteja suas palavras e intercepte a transmissao rival em tempo real.",
    cardImage: SITE_ASSETS.codeHackCard,
    heroImage: SITE_ASSETS.codeHackSlide,
    available: true
  },
  {
    id: "ringbound",
    name: "Ringbound",
    subtitle: "aneis de deducao",
    description: "Associe objetos a aneis secretos, leia intersecoes e descubra a logica escondida.",
    cardImage: SITE_ASSETS.ringboundCard,
    heroImage: SITE_ASSETS.ringboundSlide,
    available: true
  }
];
const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.port === "5173" ? "http://localhost:3001" : window.location.origin);
const socket = io(socketUrl, { autoConnect: true });
const TEAMS = ["red", "blue"];
const wordImageCache = new Map();
const apiBaseUrl = socketUrl.replace(/\/$/, "");
const DEFAULT_CONSTANTS = {
  WORD_BANKS: { Geral: [], Anime: [], Pokemon: [], Filmes: [], Jogos: [], Geek: [], Famosos: [] },
  TEAM_NAMES: { red: "Time Vermelho", blue: "Time Azul" },
  WIN_CORRECT: 3,
  WIN_INTERCEPTS: 2,
  STARTING_LIVES: 2,
  MAX_ROUNDS: 8,
  RINGBOUND: { categories: ["Geral", "Pokemon", "Filmes", "Jogos", "Anime", "Geek", "Famosos"], maxRounds: 10, ruleGroups: {} }
};

const IMAGE_ALIAS = {
  Casa: "house", Rua: "street", Porta: "door", Mesa: "table", Cadeira: "chair", Cama: "bed", Sofa: "sofa", Janela: "window", Parede: "wall", Chao: "floor",
  Teto: "ceiling", Tapete: "rug", Prato: "plate", Copo: "glass cup", Garrafa: "bottle", Colher: "spoon", Faca: "knife", Garfo: "fork", Panela: "cooking pot", Fogao: "stove",
  Geladeira: "refrigerator", Pia: "sink", Banho: "bath", Sabao: "soap", Toalha: "towel", Escova: "brush", Pente: "comb", Camisa: "shirt", Calca: "pants", Vestido: "dress",
  Sapato: "shoe", Meia: "sock", Chapeu: "hat", Bolsa: "bag", Mochila: "backpack", Carteira: "wallet", Chave: "key", Moeda: "coin", Nota: "banknote", Livro: "book",
  Caderno: "notebook", Caneta: "pen", Lapis: "pencil", Borracha: "eraser", Papel: "paper", Carta: "letter envelope", Caixa: "box", Sacola: "shopping bag", Presente: "gift", Relogio: "clock",
  Telefone: "telephone", Radio: "radio", Camera: "camera", Tela: "screen", Teclado: "keyboard", Mouse: "computer mouse", Cabo: "cable", Lampada: "lamp", Vela: "candle", Fogo: "fire",
  Agua: "water", Gelo: "ice", Chuva: "rain", Nuvem: "cloud", Sol: "sun", Lua: "moon", Estrela: "star", Ceu: "sky", Mar: "sea", Rio: "river",
  Lago: "lake", Praia: "beach", Areia: "sand", Pedra: "stone", Terra: "soil", Barro: "mud", Grama: "grass", Folha: "leaf", Flor: "flower", Arvore: "tree",
  Galho: "tree branch", Raiz: "root", Fruta: "fruit", Banana: "banana", Maca: "apple", Pera: "pear", Uva: "grape", Laranja: "orange fruit", Limao: "lemon", Manga: "mango",
  Melancia: "watermelon", Abacaxi: "pineapple", Morango: "strawberry", Coco: "coconut", Tomate: "tomato", Batata: "potato", Cenoura: "carrot", Milho: "corn", Arroz: "rice", Feijao: "beans",
  Macarrao: "pasta", Pao: "bread", Queijo: "cheese", Leite: "milk", Cafe: "coffee", Cha: "tea", Suco: "juice", Bolo: "cake", Mel: "honey", Sal: "salt", Acucar: "sugar",
  Ovo: "egg", Carne: "meat", Peixe: "fish", Frango: "chicken", Sopa: "soup", Pizza: "pizza", Sorvete: "ice cream", Biscoito: "cookie",
  Cachorro: "dog", Gato: "cat", Passaro: "bird", Cavalo: "horse", Vaca: "cow", Porco: "pig", Ovelha: "sheep", Cabra: "goat", Pato: "duck", Galinha: "chicken animal",
  Coelho: "rabbit", Rato: "mouse animal", Sapo: "frog", Cobra: "snake", Tartaruga: "turtle", Leao: "lion", Tigre: "tiger", Urso: "bear", Macaco: "monkey",
  Elefante: "elephant", Girafa: "giraffe", Zebra: "zebra", Lobo: "wolf", Raposa: "fox", Baleia: "whale", Golfinho: "dolphin", Tubarao: "shark", Formiga: "ant", Abelha: "bee",
  Mosca: "fly insect", Borboleta: "butterfly", Aranha: "spider",
  Carro: "car", Onibus: "bus", Trem: "train", Aviao: "airplane", Barco: "boat", Navio: "ship", Bicicleta: "bicycle", Moto: "motorcycle", Roda: "wheel", Pneu: "tire",
  Volante: "steering wheel", Freio: "brake", Motor: "engine", Posto: "gas station", Ponte: "bridge", Tunel: "tunnel", Estrada: "road",
  Escola: "school", Hospital: "hospital", Mercado: "market", Banco: "bench", Padaria: "bakery", Farmacia: "pharmacy", Igreja: "church", Praca: "town square", Parque: "park", Cinema: "movie theater",
  Teatro: "theater", Museu: "museum", Loja: "store", Hotel: "hotel", Restaurante: "restaurant", Cozinha: "kitchen", Quarto: "bedroom", Sala: "living room", Banheiro: "bathroom", Garagem: "garage",
  Jardim: "garden", Piscina: "swimming pool", Portao: "gate", Elevador: "elevator", Escada: "stairs",
  Bola: "ball", Boneca: "doll", Carrinho: "toy car", Jogo: "board game", Dado: "dice", Pipa: "kite", Tambor: "drum", Violao: "acoustic guitar", Piano: "piano", Flauta: "flute",
  Apito: "whistle", Musica: "musical notes", Danca: "dance", Festa: "party", Time: "sports team", Gol: "goal soccer", Rede: "net", Campo: "field", Quadra: "sports court", Onda: "wave",
  Vento: "wind", Neve: "snow", Montanha: "mountain", Vale: "valley", Ilha: "island", Floresta: "forest", Deserto: "desert", Caverna: "cave", Vulcao: "volcano", Mapa: "map",
  Bussola: "compass", Mala: "suitcase", Viagem: "travel", Cidade: "city", Aldeia: "village", Fazenda: "farm",
  Mae: "mother", Pai: "father", Irmao: "brother", Avo: "grandparent", Doutor: "doctor", Professor: "teacher", Aluno: "student", Motorista: "driver", Cozinheiro: "cook", Pintor: "painter",
  Cantor: "singer", Juiz: "judge", Policia: "police officer", Bombeiro: "firefighter", Rei: "king", Rainha: "queen", Principe: "prince", Princesa: "princess",
  Coroa: "crown", Espada: "sword", Escudo: "shield", Martelo: "hammer", Prego: "nail", Serra: "saw tool", Tesoura: "scissors", Cola: "glue", Tinta: "paint", Pincel: "paint brush",
  Linha: "thread", Agulha: "needle", Botao: "button", Espelho: "mirror", Penteado: "hairstyle", Olho: "eye", Nariz: "nose", Boca: "mouth", Dente: "tooth", Orelha: "ear",
  Mao: "hand", Dedo: "finger", Braco: "arm", Perna: "leg", Pe: "foot", Cabeca: "head", Cabelo: "hair", Corpo: "body",
  Vermelho: "red color", Azul: "blue color", Verde: "green color", Amarelo: "yellow color", Preto: "black color", Branco: "white color", Rosa: "pink color", Roxo: "purple color", Cinza: "gray color",
  Ouro: "gold", Prata: "silver", Vidro: "glass material", Madeira: "wood", Ferro: "iron metal", Plastico: "plastic", Pano: "cloth", Couro: "leather", Corda: "rope",
  Balde: "bucket", Vassoura: "broom", Esponja: "sponge", Lixo: "trash", Cesto: "basket", Remedio: "medicine", Curativo: "bandage", Planta: "plant", Semente: "seed", Horta: "vegetable garden",
  "Guarda chuva": "umbrella", Travesseiro: "pillow", Cobertor: "blanket", Cortina: "curtain", Almofada: "cushion", Estante: "bookcase", Prateleira: "shelf",
  "Homem Aranha": "Spider-Man",
  "Homem de Ferro": "Iron Man",
  "Capitao America": "Captain America",
  "Doutor Estranho": "Doctor Strange",
  "Pantera Negra": "Black Panther",
  "Viuva Negra": "Black Widow",
  "Gaviao Arqueiro": "Hawkeye",
  "Mulher Maravilha": "Wonder Woman",
  "Mulher Gato": "Catwoman",
  "Lanterna Verde": "Green Lantern",
  "Coringa": "Joker",
  "Arlequina": "Harley Quinn",
  "Charada": "Riddler",
  "Pinguim": "Penguin",
  "Asa Noturna": "Nightwing",
  "Demolidor": "Daredevil",
  "Justiceiro": "Punisher",
  "Visao": "Vision",
  "Senhor das Estrelas": "Star-Lord",
  "Capitao Kirk": "Captain Kirk",
  "Mandaloriano": "The Mandalorian",
  "Perola": "Pearl",
  "Bob Esponja": "SpongeBob SquarePants",
  "Patrick Estrela": "Patrick Star",
  "Lula Molusco": "Squidward Tentacles",
  "Sandy Bochechas": "Sandy Cheeks",
  "Princesa Jujuba": "Princess Bubblegum",
  "Steven Universo": "Steven Universe",
  "Mutano": "Beast Boy",
  "Ravena": "Raven",
  "Estelar": "Starfire",
  "Tio Chico": "Uncle Fester",
  "Wandinha": "Wednesday Addams",
  "Senhor dos Aneis": "The Lord of the Rings",
  "Vingadores": "The Avengers",
  "Poderoso Chefao": "The Godfather",
  "De Volta para o Futuro": "Back to the Future",
  "Procurando Nemo": "Finding Nemo",
  "Rei Leao": "The Lion King",
  "Exterminador": "The Terminator",
  "Missao Impossivel": "Mission Impossible",
  "O Iluminado": "The Shining",
  "A Bruxa": "The Witch",
  "O Exorcista": "The Exorcist",
  "Era do Gelo": "Ice Age",
  "Valente": "Brave",
  "Amelie": "Amelie",
  "Viagem de Chihiro": "Spirited Away",
  "Castelo Animado": "Howl's Moving Castle",
  "Tumulo dos Vagalumes": "Grave of the Fireflies",
  "Meu Amigo Totoro": "My Neighbor Totoro"
};

const MOVIE_TITLE_ALIAS = {
  Matrix: "The Matrix",
  Titanic: "Titanic",
  Avatar: "Avatar",
  Alien: "Alien",
  Rocky: "Rocky",
  Batman: "Batman",
  Joker: "Joker",
  Coringa: "Joker",
  Gladiador: "Gladiator",
  Inception: "Inception",
  Tubarao: "Jaws",
  "Jurassic Park": "Jurassic Park",
  "Star Wars": "Star Wars",
  "Indiana Jones": "Indiana Jones",
  "Harry Potter": "Harry Potter",
  "Senhor dos Aneis": "The Lord of the Rings",
  Vingadores: "The Avengers",
  "Homem Aranha": "Spider-Man",
  Superman: "Superman",
  Godzilla: "Godzilla",
  "King Kong": "King Kong",
  "Poderoso Chefao": "The Godfather",
  "Forrest Gump": "Forrest Gump",
  "E.T.": "E.T. the Extra-Terrestrial",
  "De Volta para o Futuro": "Back to the Future",
  "Toy Story": "Toy Story",
  Shrek: "Shrek",
  Frozen: "Frozen",
  "Procurando Nemo": "Finding Nemo",
  "Rei Leao": "The Lion King",
  "Pantera Negra": "Black Panther",
  Duna: "Dune",
  "Mad Max": "Mad Max",
  Exterminador: "The Terminator",
  Predador: "Predator",
  Rambo: "First Blood",
  "Karate Kid": "The Karate Kid",
  "Top Gun": "Top Gun",
  "Missao Impossivel": "Mission: Impossible",
  "007": "Dr. No",
  Psicose: "Psycho",
  "O Iluminado": "The Shining",
  It: "It",
  Ghostbusters: "Ghostbusters",
  MIB: "Men in Black",
  "Blade Runner": "Blade Runner",
  Tron: "Tron",
  "Wall-E": "WALL-E",
  Up: "Up",
  Ratatouille: "Ratatouille",
  Moana: "Moana",
  Aladdin: "Aladdin",
  Mulan: "Mulan",
  Cinderela: "Cinderella",
  Pinocchio: "Pinocchio",
  "Mary Poppins": "Mary Poppins",
  "La La Land": "La La Land",
  Whiplash: "Whiplash",
  Parasita: "Parasite",
  Interestelar: "Interstellar",
  Gravidade: "Gravity",
  "Perdido em Marte": "The Martian",
  Oppenheimer: "Oppenheimer",
  Barbie: "Barbie",
  "Clube da Luta": "Fight Club",
  "Pulp Fiction": "Pulp Fiction",
  "Kill Bill": "Kill Bill",
  "Django Livre": "Django Unchained",
  "Bastardos Inglorios": "Inglourious Basterds",
  "Os Bons Companheiros": "Goodfellas",
  Scarface: "Scarface",
  "Taxi Driver": "Taxi Driver",
  "Cidade de Deus": "City of God",
  "Tropa de Elite": "Elite Squad",
  "Central do Brasil": "Central Station",
  "Auto da Compadecida": "A Dog's Will",
  "Labirinto do Fauno": "Pan's Labyrinth",
  Amelie: "Amelie",
  "Cinema Paradiso": "Cinema Paradiso",
  "Como Treinar o seu Dragao": "How to Train Your Dragon",
  "Kung Fu Panda": "Kung Fu Panda",
  Madagascar: "Madagascar",
  "Era do Gelo": "Ice Age",
  "Monstros S.A.": "Monsters Inc.",
  "Os Incriveis": "The Incredibles",
  "Divertida Mente": "Inside Out",
  Viva: "Coco",
  Soul: "Soul",
  Luca: "Luca",
  Valente: "Brave",
  Carros: "Cars",
  Raya: "Raya and the Last Dragon",
  Encanto: "Encanto",
  Enrolados: "Tangled",
  "Detona Ralph": "Wreck-It Ralph",
  Zootopia: "Zootopia",
  "Lilo e Stitch": "Lilo & Stitch",
  Tarzan: "Tarzan",
  Hercules: "Hercules",
  "Bela e a Fera": "Beauty and the Beast",
  "Pequena Sereia": "The Little Mermaid",
  "Branca de Neve": "Snow White and the Seven Dwarfs",
  "Alice no Pais das Maravilhas": "Alice in Wonderland",
  "Peter Pan": "Peter Pan",
  Dumbo: "Dumbo",
  Bambi: "Bambi",
  Fantasia: "Fantasia",
  "Planeta dos Macacos": "Planet of the Apes",
  "Silencio dos Inocentes": "The Silence of the Lambs",
  Seven: "Se7en",
  "Garota Exemplar": "Gone Girl",
  "Sexto Sentido": "The Sixth Sense",
  Fragmentado: "Split",
  Corra: "Get Out",
  Nos: "Us",
  Hereditario: "Hereditary",
  Midsommar: "Midsommar",
  "Invocacao do Mal": "The Conjuring",
  Annabelle: "Annabelle",
  "Atividade Paranormal": "Paranormal Activity",
  Halloween: "Halloween",
  "Sexta Feira 13": "Friday the 13th",
  Pesadelo: "A Nightmare on Elm Street",
  Panico: "Scream",
  "Jogos Mortais": "Saw",
  "O Chamado": "The Ring",
  "A Bruxa": "The Witch",
  "O Exorcista": "The Exorcist",
  Dracula: "Dracula",
  Frankenstein: "Frankenstein",
  Casablanca: "Casablanca",
  "Cidadao Kane": "Citizen Kane",
  "Cantando na Chuva": "Singin' in the Rain",
  "Magico de Oz": "The Wizard of Oz",
  "E o Vento Levou": "Gone with the Wind",
  "Ben Hur": "Ben-Hur",
  "Lawrence da Arabia": "Lawrence of Arabia",
  "Apocalypse Now": "Apocalypse Now",
  Platoon: "Platoon",
  "Nascido para Matar": "Full Metal Jacket",
  "Resgate do Soldado Ryan": "Saving Private Ryan",
  "O Resgate do Soldado Ryan": "Saving Private Ryan",
  "O Resgate do Soldade Ryan": "Saving Private Ryan",
  "Coracao Valente": "Braveheart"
};

const IMAGE_ORIGIN = {
  Anime: {
    "Son Goku": "Dragon Ball", "Vegeta": "Dragon Ball", "Son Gohan": "Dragon Ball", "Piccolo": "Dragon Ball", "Bulma Brief": "Dragon Ball", "Freeza": "Dragon Ball",
    "Naruto Uzumaki": "Naruto", "Sasuke Uchiha": "Naruto", "Sakura Haruno": "Naruto", "Kakashi Hatake": "Naruto", "Hinata Hyuga": "Naruto", "Itachi Uchiha": "Naruto", "Madara Uchiha": "Naruto", "Jiraiya": "Naruto", "Gaara": "Naruto",
    "Monkey D. Luffy": "One Piece", "Roronoa Zoro": "One Piece", "Nami": "One Piece", "Vinsmoke Sanji": "One Piece", "Tony Tony Chopper": "One Piece", "Nico Robin": "One Piece", "Shanks": "One Piece",
    "Ichigo Kurosaki": "Bleach", "Rukia Kuchiki": "Bleach", "Orihime Inoue": "Bleach", "Sosuke Aizen": "Bleach", "Kenpachi Zaraki": "Bleach",
    "Saitama": "One Punch Man", "Genos": "One Punch Man", "Tatsumaki": "One Punch Man", "Garou": "One Punch Man",
    "Izuku Midoriya": "My Hero Academia", "Katsuki Bakugo": "My Hero Academia", "Ochaco Uraraka": "My Hero Academia", "Shoto Todoroki": "My Hero Academia",
    "Tanjiro Kamado": "Demon Slayer", "Nezuko Kamado": "Demon Slayer", "Zenitsu Agatsuma": "Demon Slayer", "Inosuke Hashibira": "Demon Slayer", "Kyojuro Rengoku": "Demon Slayer",
    "Eren Yeager": "Attack on Titan", "Mikasa Ackerman": "Attack on Titan", "Levi Ackerman": "Attack on Titan",
    "Light Yagami": "Death Note", "L Lawliet": "Death Note", "Misa Amane": "Death Note",
    "Edward Elric": "Fullmetal Alchemist", "Roy Mustang": "Fullmetal Alchemist",
    "Gon Freecss": "Hunter x Hunter", "Killua Zoldyck": "Hunter x Hunter", "Hisoka Morow": "Hunter x Hunter",
    "Usagi Tsukino": "Sailor Moon", "Shinji Ikari": "Neon Genesis Evangelion", "Asuka Langley Soryu": "Neon Genesis Evangelion",
    "Satoru Gojo": "Jujutsu Kaisen", "Megumi Fushiguro": "Jujutsu Kaisen", "Nobara Kugisaki": "Jujutsu Kaisen",
    "Aki Hayakawa": "Chainsaw Man", "Vash the Stampede": "Trigun", "Lelouch Lamperouge": "Code Geass", "Shigeo Kageyama": "Mob Psycho 100"
  },
  Jogos: {
    "Mario": "Super Mario", "Luigi": "Super Mario", "Princess Peach": "Super Mario", "Bowser": "Super Mario", "Yoshi": "Super Mario", "Donkey Kong": "Donkey Kong",
    "Link": "The Legend of Zelda", "Princess Zelda": "The Legend of Zelda", "Ganondorf": "The Legend of Zelda",
    "Sonic": "Sonic the Hedgehog", "Miles Tails Prower": "Sonic the Hedgehog", "Knuckles the Echidna": "Sonic the Hedgehog", "Shadow the Hedgehog": "Sonic the Hedgehog",
    "Samus Aran": "Metroid", "Mega Man": "Mega Man", "Ryu": "Street Fighter", "Chun-Li": "Street Fighter", "M Bison": "Street Fighter",
    "Scorpion": "Mortal Kombat", "Sub-Zero": "Mortal Kombat", "Liu Kang": "Mortal Kombat", "Johnny Cage": "Mortal Kombat",
    "Cloud Strife": "Final Fantasy VII", "Sephiroth": "Final Fantasy VII", "Tifa Lockhart": "Final Fantasy VII", "Aerith Gainsborough": "Final Fantasy VII",
    "Sora": "Kingdom Hearts", "Crash Bandicoot": "Crash Bandicoot", "Spyro": "Spyro the Dragon", "Master Chief": "Halo",
    "Gordon Freeman": "Half-Life", "Chell": "Portal", "Kratos": "God of War", "Atreus": "God of War", "Nathan Drake": "Uncharted", "Victor Sullivan": "Uncharted",
    "Lara Croft": "Tomb Raider", "Leon Kennedy": "Resident Evil", "Jill Valentine": "Resident Evil", "Albert Wesker": "Resident Evil", "Nemesis": "Resident Evil",
    "Solid Snake": "Metal Gear Solid", "Big Boss": "Metal Gear Solid", "Geralt of Rivia": "The Witcher", "Cirilla Fiona Elen Riannon": "The Witcher", "Yennefer": "The Witcher",
    "Arthur Morgan": "Red Dead Redemption", "John Marston": "Red Dead Redemption", "CJ": "Grand Theft Auto", "Carl Johnson": "Grand Theft Auto", "Trevor Philips": "Grand Theft Auto", "Franklin Clinton": "Grand Theft Auto",
    "Ezio Auditore": "Assassin's Creed", "Altair Ibn-La'Ahad": "Assassin's Creed", "Agent 47": "Hitman", "Max Payne": "Max Payne", "Alan Wake": "Alan Wake",
    "Joel": "The Last of Us", "Ellie": "The Last of Us", "Aloy": "Horizon Zero Dawn", "2B": "Nier Automata", "Lena Oxton": "Overwatch", "Jinx": "League of Legends", "Ahri": "League of Legends", "Jett": "Valorant"
  },
  Geek: {
    "Batman": "DC Comics", "Superman": "DC Comics", "Wonder Woman": "DC Comics", "Flash": "DC Comics", "Aquaman": "DC Comics", "Cyborg": "DC Comics", "Green Lantern": "DC Comics", "Joker": "DC Comics", "Harley Quinn": "DC Comics", "Catwoman": "DC Comics", "Robin": "DC Comics",
    "Spider-Man": "Marvel Comics", "Iron Man": "Marvel Comics", "Captain America": "Marvel Comics", "Thor": "Marvel Comics", "Hulk": "Marvel Comics", "Black Widow": "Marvel Comics", "Doctor Strange": "Marvel Comics", "Black Panther": "Marvel Comics", "Wolverine": "Marvel Comics", "Deadpool": "Marvel Comics", "Thanos": "Marvel Comics", "Loki": "Marvel Comics", "Wanda Maximoff": "Marvel Comics",
    "Homelander": "The Boys", "Billy Butcher": "The Boys", "Eleven": "Stranger Things", "Mike Wheeler": "Stranger Things", "Dustin Henderson": "Stranger Things", "Wednesday Addams": "The Addams Family",
    "Sherlock Holmes": "Sherlock Holmes", "Doctor Who": "Doctor Who", "Dalek": "Doctor Who",
    "Darth Vader": "Star Wars", "Luke Skywalker": "Star Wars", "Leia Organa": "Star Wars", "Han Solo": "Star Wars", "Chewbacca": "Star Wars", "Yoda": "Star Wars", "Obi-Wan Kenobi": "Star Wars", "Ahsoka Tano": "Star Wars", "Grogu": "Star Wars",
    "Spock": "Star Trek", "Captain Kirk": "Star Trek", "Jean-Luc Picard": "Star Trek", "Data": "Star Trek",
    "Frodo": "The Lord of the Rings", "Samwise Gamgee": "The Lord of the Rings", "Gandalf": "The Lord of the Rings", "Aragorn": "The Lord of the Rings", "Legolas": "The Lord of the Rings", "Gollum": "The Lord of the Rings",
    "Harry Potter": "Harry Potter", "Hermione Granger": "Harry Potter", "Ron Weasley": "Harry Potter", "Dumbledore": "Harry Potter", "Voldemort": "Harry Potter", "Severus Snape": "Harry Potter",
    "Geralt de Rivia": "The Witcher", "Ciri": "The Witcher", "Yennefer": "The Witcher", "Rick Sanchez": "Rick and Morty", "Morty Smith": "Rick and Morty",
    "Homer Simpson": "The Simpsons", "Bart Simpson": "The Simpsons", "Lisa Simpson": "The Simpsons", "Marge Simpson": "The Simpsons",
    "SpongeBob SquarePants": "SpongeBob SquarePants", "Finn": "Adventure Time", "Jake": "Adventure Time", "Princess Bubblegum": "Adventure Time", "Marceline": "Adventure Time",
    "Steven Universe": "Steven Universe", "Garnet": "Steven Universe", "Ametista": "Steven Universe", "Pearl": "Steven Universe",
    "Dexter": "Dexter's Laboratory", "Johnny Bravo": "Johnny Bravo", "Ben 10": "Ben 10", "Beast Boy": "Teen Titans", "Raven": "Teen Titans", "Starfire": "Teen Titans", "Kim Possible": "Kim Possible", "Shego": "Kim Possible", "Aang": "Avatar The Last Airbender", "Katara": "Avatar The Last Airbender", "Zuko": "Avatar The Last Airbender", "Korra": "The Legend of Korra"
  }
};

const ORIGIN_FALLBACK = {
  Anime: {
    "Ash Ketchum": "Pokemon", "Misty": "Pokemon", "Brock": "Pokemon", "Serena": "Pokemon",
    "Yugi Muto": "Yu-Gi-Oh!", "Seto Kaiba": "Yu-Gi-Oh!", "Joey Wheeler": "Yu-Gi-Oh!", "Yami Yugi": "Yu-Gi-Oh!",
    "Natsu Dragneel": "Fairy Tail", "Lucy Heartfilia": "Fairy Tail", "Erza Scarlet": "Fairy Tail", "Gray Fullbuster": "Fairy Tail",
    "Meliodas": "The Seven Deadly Sins", "Ban": "The Seven Deadly Sins", "Diane": "The Seven Deadly Sins", "Escanor": "The Seven Deadly Sins",
    "Rimuru Tempest": "That Time I Got Reincarnated as a Slime", "Raphtalia": "The Rising of the Shield Hero", "Naofumi Iwatani": "The Rising of the Shield Hero",
    "Subaru Natsuki": "Re:Zero", "Emilia": "Re:Zero", "Rem": "Re:Zero", "Ram": "Re:Zero",
    "Kazuma Sato": "KonoSuba", "Aqua": "KonoSuba", "Megumin": "KonoSuba", "Darkness": "KonoSuba",
    "Kirito": "Sword Art Online", "Asuna Yuuki": "Sword Art Online", "Sinon": "Sword Art Online", "Eugeo": "Sword Art Online",
    "Yuji Itadori": "Jujutsu Kaisen", "Ryomen Sukuna": "Jujutsu Kaisen", "Maki Zenin": "Jujutsu Kaisen", "Toge Inumaki": "Jujutsu Kaisen", "Panda": "Jujutsu Kaisen", "Yuta Okkotsu": "Jujutsu Kaisen",
    "Denji": "Chainsaw Man", "Power": "Chainsaw Man", "Makima": "Chainsaw Man", "Kobeni Higashiyama": "Chainsaw Man", "Pochita": "Chainsaw Man",
    "Anya Forger": "Spy x Family", "Loid Forger": "Spy x Family", "Yor Forger": "Spy x Family", "Bond Forger": "Spy x Family",
    "Frieren": "Frieren", "Fern": "Frieren", "Stark": "Frieren", "Himmel": "Frieren",
    "Maomao": "The Apothecary Diaries", "Jinshi": "The Apothecary Diaries",
    "Thorfinn": "Vinland Saga", "Askeladd": "Vinland Saga", "Canute": "Vinland Saga",
    "Senku Ishigami": "Dr. Stone", "Kohaku": "Dr. Stone", "Shoyo Hinata": "Haikyuu!!", "Tobio Kageyama": "Haikyuu!!",
    "Violet Evergarden": "Violet Evergarden", "Guts": "Berserk", "Griffith": "Berserk", "Casca": "Berserk",
    "Alucard": "Hellsing", "Motoko Kusanagi": "Ghost in the Shell", "Conan Edogawa": "Detective Conan",
    "Saber": "Fate/stay night", "Rin Tohsaka": "Fate/stay night", "Shirou Emiya": "Fate/stay night",
    "Lupin III": "Lupin III", "Gintoki Sakata": "Gintama", "Mugen": "Samurai Champloo", "Jin": "Samurai Champloo",
    "Simon": "Gurren Lagann", "Kamina": "Gurren Lagann", "Ryuko Matoi": "Kill la Kill", "Satsuki Kiryuin": "Kill la Kill",
    "Kaguya Shinomiya": "Kaguya-sama", "Miyuki Shirogane": "Kaguya-sama", "Marin Kitagawa": "My Dress-Up Darling"
  },
  Jogos: {
    "Wario": "Super Mario", "Waluigi": "Super Mario", "Rosalina": "Super Mario", "Midna": "The Legend of Zelda",
    "Amy Rose": "Sonic the Hedgehog", "Dr Eggman": "Sonic the Hedgehog", "Cammy White": "Street Fighter", "Akuma": "Street Fighter",
    "Kitana": "Mortal Kombat", "Mileena": "Mortal Kombat", "Raiden": "Mortal Kombat", "Shao Kahn": "Mortal Kombat",
    "Squall Leonhart": "Final Fantasy VIII", "Tidus": "Final Fantasy X", "Yuna": "Final Fantasy X", "Lightning": "Final Fantasy XIII",
    "Cortana": "Halo", "Marcus Fenix": "Gears of War", "Commander Shepard": "Mass Effect", "Morrigan": "Dragon Age",
    "Arthur Morgan": "Red Dead Redemption", "Dutch van der Linde": "Red Dead Redemption", "Tommy Vercetti": "Grand Theft Auto", "Niko Bellic": "Grand Theft Auto",
    "Dante": "Devil May Cry", "Vergil": "Devil May Cry", "Bayonetta": "Bayonetta", "Freya": "God of War",
    "Malenia": "Elden Ring", "Radahn": "Elden Ring", "Ranni": "Elden Ring", "Solaire": "Dark Souls",
    "Sekiro": "Sekiro", "Doom Slayer": "Doom", "Isaac Clarke": "Dead Space", "Pyramid Head": "Silent Hill",
    "Booker DeWitt": "BioShock Infinite", "Elizabeth": "BioShock Infinite", "Corvo Attano": "Dishonored",
    "Jesse Faden": "Control", "Sam Fisher": "Splinter Cell", "Kazuma Kiryu": "Yakuza", "Goro Majima": "Yakuza",
    "Sans": "Undertale", "Papyrus": "Undertale", "Cuphead": "Cuphead", "Hollow Knight": "Hollow Knight",
    "Banjo": "Banjo-Kazooie", "Kazooie": "Banjo-Kazooie", "Ratchet": "Ratchet & Clank", "Clank": "Ratchet & Clank"
  },
  Geek: {
    "Batgirl": "DC Comics", "Nightwing": "DC Comics", "Red Hood": "DC Comics", "Deathstroke": "DC Comics", "Riddler": "DC Comics",
    "Moon Knight": "Marvel Comics", "Daredevil": "Marvel Comics", "Punisher": "Marvel Comics", "Venom": "Marvel Comics", "Carnage": "Marvel Comics", "Miles Morales": "Marvel Comics",
    "Invincible": "Invincible", "Omni-Man": "Invincible", "Atom Eve": "Invincible",
    "Bender": "Futurama", "Fry": "Futurama", "Leela": "Futurama", "Peter Griffin": "Family Guy", "Stewie Griffin": "Family Guy",
    "Rick Grimes": "The Walking Dead", "Daryl Dixon": "The Walking Dead", "Walter White": "Breaking Bad", "Jesse Pinkman": "Breaking Bad", "Saul Goodman": "Better Call Saul",
    "Daenerys Targaryen": "Game of Thrones", "Jon Snow": "Game of Thrones", "Tyrion Lannister": "Game of Thrones", "Arya Stark": "Game of Thrones",
    "The Mandalorian": "Star Wars", "Din Djarin": "Star Wars", "Boba Fett": "Star Wars", "Anakin Skywalker": "Star Wars", "R2-D2": "Star Wars",
    "Worf": "Star Trek", "Seven of Nine": "Star Trek", "Paul Atreides": "Dune", "Chani": "Dune",
    "Buffy Summers": "Buffy the Vampire Slayer", "Sarah Connor": "Terminator", "T-800": "Terminator", "Ellen Ripley": "Alien",
    "Neo": "The Matrix", "Trinity": "The Matrix", "Morpheus": "The Matrix", "Agent Smith": "The Matrix"
  }
};

const WORD_SEARCH_ALIASES = {
  Scorpion: ["Hanzo Hasashi"],
  "Sub-Zero": ["Kuai Liang", "Bi-Han"],
  "Raiden": ["Lord Raiden"],
  "CJ": ["Carl Johnson"],
  "Miles Morales": ["Spider-Man"],
  "Lena Oxton": ["Tracer"],
  "Solid Snake": ["David"],
  "Big Boss": ["Naked Snake", "Venom Snake"],
  "Geralt of Rivia": ["Geralt de Rivia", "White Wolf"],
  "Princess Zelda": ["Zelda"],
  "Princess Peach": ["Peach"],
  "Sonic": ["Sonic the Hedgehog"],
  "Shadow the Hedgehog": ["Shadow"],
  "Miles Tails Prower": ["Tails"],
  "Dr Eggman": ["Robotnik"],
  "Jinx": ["Powder"],
  "Vi": ["Violet"],
  "D.Va": ["Hana Song"],
  "Master Chief": ["John-117"],
  "Doom Slayer": ["Doomguy"],
  "Agent 47": ["47"],
  "2B": ["YoRHa No.2 Type B"],
  "9S": ["YoRHa No.9 Type S"],
  "Saber": ["Artoria Pendragon"],
  "L Lawliet": ["L"],
  "Light Yagami": ["Kira"],
  "Monkey D. Luffy": ["Luffy"],
  "Roronoa Zoro": ["Zoro"],
  "Vinsmoke Sanji": ["Sanji"],
  "Tony Tony Chopper": ["Chopper"],
  "Edward Elric": ["Fullmetal Alchemist"],
  "Shigeo Kageyama": ["Mob"],
  "Gintoki Sakata": ["Gintoki"],
  "Kenshin Himura": ["Kenshin"],
  "Eren Yeager": ["Eren Jaeger"],
  "Levi Ackerman": ["Levi"],
  "Satoru Gojo": ["Gojo"],
  "Yuji Itadori": ["Itadori"],
  "Loid Forger": ["Twilight"],
  "Yor Forger": ["Thorn Princess"],
  "Anya Forger": ["Anya"]
};

const CHARACTER_ORIGIN_PATCH = {
  Anime: {
    "Happy": "Fairy Tail",
    "Jaden Yuki": "Yu-Gi-Oh!",
    "Yusei Fudo": "Yu-Gi-Oh!",
    "Elizabeth Liones": "The Seven Deadly Sins",
    "King": "The Seven Deadly Sins",
    "Hyakkimaru": "Dororo",
    "Dororo": "Dororo",
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
    "Holo": "Spice and Wolf",
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
    "Batou": "Ghost in the Shell",
    "Nausicaa": "Nausicaa",
    "San": "Princess Mononoke",
    "Chihiro Ogino": "Spirited Away",
    "Haku": "Spirited Away",
    "Kiki": "Kiki's Delivery Service",
    "Sophie Hatter": "Howl's Moving Castle",
    "Howl Jenkins": "Howl's Moving Castle",
    "Ponyo": "Ponyo",
    "Ran Mouri": "Detective Conan",
    "Kogoro Mouri": "Detective Conan",
    "Kaito Kid": "Detective Conan",
    "Toru Amuro": "Detective Conan",
    "Shinji Matou": "Fate/stay night",
    "Archer": "Fate/stay night",
    "Lancer": "Fate/stay night",
    "Mikoto Misaka": "A Certain Scientific Railgun",
    "Toma Kamijo": "A Certain Magical Index",
    "Kenshiro": "Fist of the North Star",
    "Raoh": "Fist of the North Star",
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
    "Kurama": "Yu Yu Hakusho",
    "Hiei": "Yu Yu Hakusho",
    "Toguro": "Yu Yu Hakusho",
    "Inuyasha": "Inuyasha",
    "Kagome Higurashi": "Inuyasha",
    "Sesshomaru": "Inuyasha",
    "Kikyo": "Inuyasha",
    "Sango": "Inuyasha",
    "Miroku": "Inuyasha",
    "Shinpachi Shimura": "Gintama",
    "Takasugi Shinsuke": "Gintama",
    "Fuu": "Samurai Champloo",
    "Spike Spiegel": "Cowboy Bebop",
    "Jet Black": "Cowboy Bebop",
    "Faye Valentine": "Cowboy Bebop",
    "Ed": "Cowboy Bebop",
    "Vicious": "Cowboy Bebop",
    "Renton Thurston": "Eureka Seven",
    "Eureka": "Eureka Seven",
    "Yoko Littner": "Gurren Lagann",
    "Nia Teppelin": "Gurren Lagann",
    "Mako Mankanshoku": "Kill la Kill",
    "Akko Kagari": "Little Witch Academia",
    "Lotte Jansson": "Little Witch Academia",
    "Sucy Manbavaran": "Little Witch Academia",
    "Mob": "Mob Psycho 100",
    "Reigen Arataka": "Mob Psycho 100",
    "Ritsu Kageyama": "Mob Psycho 100",
    "Dimple": "Mob Psycho 100",
    "Chika Fujiwara": "Kaguya-sama",
    "Ai Hayasaka": "Kaguya-sama",
    "Wakana Gojo": "My Dress-Up Darling",
    "Hitori Gotoh": "Bocchi the Rock!",
    "Nijika Ijichi": "Bocchi the Rock!",
    "Ryo Yamada": "Bocchi the Rock!",
    "Ikuyo Kita": "Bocchi the Rock!",
    "Eikichi Onizuka": "Great Teacher Onizuka",
    "Onizuka": "Great Teacher Onizuka",
    "Saiki Kusuo": "The Disastrous Life of Saiki K.",
    "Riki Nendo": "The Disastrous Life of Saiki K.",
    "Kaidou Shun": "The Disastrous Life of Saiki K.",
    "Korosensei": "Assassination Classroom",
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
  }
};

const COMPREHENSIVE_ORIGIN_PATCH = {
  Anime: {
    "Cell": "Dragon Ball", "Majin Boo": "Dragon Ball", "Kuririn": "Dragon Ball", "Trunks Brief": "Dragon Ball",
    "Rock Lee": "Naruto", "Usopp": "One Piece", "Franky": "One Piece", "Brook": "One Piece",
    "Uryu Ishida": "Bleach", "Renji Abarai": "Bleach", "Byakuya Kuchiki": "Bleach", "Toshiro Hitsugaya": "Bleach", "Yoruichi Shihoin": "Bleach",
    "Mumen Rider": "One Punch Man", "Toshinori Yagi": "My Hero Academia", "Tomura Shigaraki": "My Hero Academia",
    "Giyu Tomioka": "Demon Slayer", "Muzan Kibutsuji": "Demon Slayer", "Shinobu Kocho": "Demon Slayer",
    "Armin Arlert": "Attack on Titan", "Erwin Smith": "Attack on Titan", "Hange": "Attack on Titan", "Reiner Braun": "Attack on Titan", "Annie Leonhart": "Attack on Titan",
    "Ryuk": "Death Note", "Near": "Death Note", "Mello": "Death Note",
    "Alphonse Elric": "Fullmetal Alchemist", "Winry Rockbell": "Fullmetal Alchemist", "Scar": "Fullmetal Alchemist", "Alex Louis Armstrong": "Fullmetal Alchemist",
    "Kurapika": "Hunter x Hunter", "Leorio Paradinight": "Hunter x Hunter", "Meruem": "Hunter x Hunter", "Netero": "Hunter x Hunter",
    "Ami Mizuno": "Sailor Moon", "Rei Hino": "Sailor Moon", "Makoto Kino": "Sailor Moon", "Minako Aino": "Sailor Moon", "Mamoru Chiba": "Sailor Moon",
    "Rei Ayanami": "Neon Genesis Evangelion", "Misato Katsuragi": "Neon Genesis Evangelion", "Kaworu Nagisa": "Neon Genesis Evangelion",
    "Shotaro Kaneda": "Akira", "Tetsuo Shima": "Akira", "Totoro": "My Neighbor Totoro", "Ashitaka": "Princess Mononoke", "Howl": "Howl's Moving Castle", "Sophie": "Howl's Moving Castle",
    "Kenshin Himura": "Rurouni Kenshin", "Makoto Shishio": "Rurouni Kenshin", "Tsukasa Shishio": "Dr. Stone",
    "Soma Yukihira": "Food Wars", "Erina Nakiri": "Food Wars", "Kazuto Kirigaya": "Sword Art Online", "Sukuna": "Jujutsu Kaisen",
    "Suzaku Kururugi": "Code Geass", "Kagura": "Gintama", "Arataka Reigen": "Mob Psycho 100", "Boji": "Ranking of Kings", "Kage": "Ranking of Kings",
    "Shoyo": "Gintama", "Kagura Gintama": "Gintama"
  },
  Jogos: {
    "Toad": "Super Mario", "Diddy Kong": "Donkey Kong", "Impa": "The Legend of Zelda", "Pac-Man": "Pac-Man", "Kirby": "Kirby", "Meta Knight": "Kirby", "King Dedede": "Kirby", "Ridley": "Metroid",
    "Dr Wily": "Mega Man", "Zero": "Mega Man", "Ken": "Street Fighter", "Guile": "Street Fighter", "Cammy": "Street Fighter", "Zangief": "Street Fighter", "Sagat": "Street Fighter",
    "Sonya Blade": "Mortal Kombat", "Jax Briggs": "Mortal Kombat", "Barret Wallace": "Final Fantasy VII", "Yuffie Kisaragi": "Final Fantasy VII",
    "Lightning Farron": "Final Fantasy XIII", "Noctis Lucis Caelum": "Final Fantasy XV", "Squall Leonhart": "Final Fantasy VIII", "Rinoa Heartilly": "Final Fantasy VIII",
    "Terra Branford": "Final Fantasy VI", "Cecil Harvey": "Final Fantasy IV", "Kain Highwind": "Final Fantasy IV", "Vivi Ornitier": "Final Fantasy IX",
    "Riku": "Kingdom Hearts", "Kairi": "Kingdom Hearts", "Roxas": "Kingdom Hearts", "Donald Duck": "Kingdom Hearts", "Goofy": "Kingdom Hearts", "Terra": "Kingdom Hearts", "Aqua": "Kingdom Hearts", "Ventus": "Kingdom Hearts",
    "Coco Bandicoot": "Crash Bandicoot", "Neo Cortex": "Crash Bandicoot", "Dr Neo Cortex": "Crash Bandicoot", "Arbiter": "Halo", "Doomguy": "Doom", "GLaDOS": "Portal", "Alyx Vance": "Half-Life",
    "Elena Fisher": "Uncharted", "Chris Redfield": "Resident Evil", "Claire Redfield": "Resident Evil", "Ada Wong": "Resident Evil", "Rebecca Chambers": "Resident Evil", "Barry Burton": "Resident Evil",
    "Triss Merigold": "The Witcher", "Dandelion": "The Witcher", "Vesemir": "The Witcher", "Michael De Santa": "Grand Theft Auto", "Bayek of Siwa": "Assassin's Creed", "Kassandra": "Assassin's Creed", "Eivor": "Assassin's Creed",
    "Cole Train": "Gears of War", "Dominic Santiago": "Gears of War", "Abby": "The Last of Us", "Abby Anderson": "The Last of Us", "Tommy Miller": "The Last of Us", "Sarah Miller": "The Last of Us",
    "Sackboy": "LittleBigPlanet", "Jak": "Jak and Daxter", "Daxter": "Jak and Daxter", "Sly Cooper": "Sly Cooper", "Fox McCloud": "Star Fox", "Falco Lombardi": "Star Fox",
    "Captain Falcon": "F-Zero", "Ness": "EarthBound", "Lucas": "Mother 3", "Marth": "Fire Emblem", "Ike": "Fire Emblem", "Lucina": "Fire Emblem", "Pit": "Kid Icarus", "Palutena": "Kid Icarus",
    "Villager": "Animal Crossing", "Tom Nook": "Animal Crossing", "K K Slider": "Animal Crossing", "Inkling": "Splatoon", "Steve": "Minecraft", "Alex": "Minecraft", "Creeper": "Minecraft", "Enderman": "Minecraft", "Herobrine": "Minecraft",
    "Frisk": "Undertale", "Undyne": "Undertale", "Mugman": "Cuphead", "Ms Chalice": "Cuphead", "Freddy Fazbear": "Five Nights at Freddy's",
    "Mercy": "Overwatch", "Gabriel Reyes": "Overwatch", "Genji Shimada": "Overwatch", "Hanzo Shimada": "Overwatch", "Hana Song": "Overwatch", "Winston": "Overwatch", "Widowmaker": "Overwatch",
    "Vi": "League of Legends", "Yasuo": "League of Legends", "Luxanna Crownguard": "League of Legends", "Teemo": "League of Legends", "Ekko": "League of Legends", "Ashe": "League of Legends", "Caitlyn": "League of Legends", "Garen": "League of Legends", "Thresh": "League of Legends",
    "Raze": "Valorant", "Phoenix": "Valorant", "Sage": "Valorant", "Viper": "Valorant", "Reyna": "Valorant", "Killjoy": "Valorant",
    "Octavio Silva": "Apex Legends", "Renee Blasey": "Apex Legends", "Bloodhound": "Apex Legends", "Pathfinder": "Apex Legends",
    "Ryu Hayabusa": "Ninja Gaiden", "Kazuya Mishima": "Tekken", "Jin Kazama": "Tekken", "Heihachi Mishima": "Tekken", "Emilie De Rochefort": "Tekken", "Nina Williams": "Tekken", "Lars Alexandersson": "Tekken", "King": "Tekken",
    "Ichiban Kasuga": "Yakuza", "9S": "Nier Automata", "A2": "Nier Automata", "Emil": "Nier", "Senua": "Hellblade", "Big Daddy": "BioShock",
    "Liara T'Soni": "Mass Effect", "Garrus Vakarian": "Mass Effect", "Tali'Zorah": "Mass Effect",
    "Varric Tethras": "Dragon Age", "Solas": "Dragon Age", "Alistair": "Dragon Age", "Cassandra Pentaghast": "Dragon Age", "Hawke": "Dragon Age", "Morrigan": "Dragon Age",
    "Zant": "The Legend of Zelda", "Tingle": "The Legend of Zelda", "Mipha": "The Legend of Zelda", "Revali": "The Legend of Zelda", "Urbosa": "The Legend of Zelda", "Daruk": "The Legend of Zelda",
    "Chloe Frazer": "Uncharted", "Nadine Ross": "Uncharted", "Sadie Adler": "Red Dead Redemption", "Micah Bell": "Red Dead Redemption", "Edward Kenway": "Assassin's Creed",
    "Revolver Ocelot": "Metal Gear Solid", "Quiet": "Metal Gear Solid", "Kasumi": "Dead or Alive", "Lady Dimitrescu": "Resident Evil", "Ethan Winters": "Resident Evil",
    "Nero": "Devil May Cry", "Lady": "Devil May Cry", "Trish": "Devil May Cry", "Jeanne": "Bayonetta", "Baldur": "Bayonetta", "Mimir": "God of War", "Sylens": "Horizon Zero Dawn", "Rost": "Horizon Zero Dawn",
    "Nico Robin": "One Piece", "Shulk": "Xenoblade Chronicles", "Pyra": "Xenoblade Chronicles", "Mythra": "Xenoblade Chronicles", "Hornet": "Hollow Knight", "Shovel Knight": "Shovel Knight", "Ori": "Ori and the Blind Forest", "Shantae": "Shantae", "Rayman": "Rayman", "Rabbid": "Rayman Raving Rabbids", "Cole MacGrath": "Infamous", "Celeste": "Celeste"
  },
  Geek: {
    "Pinguim": "DC Comics", "Penguin": "DC Comics", "Two-Face": "DC Comics", "Poison Ivy": "DC Comics", "Scarecrow": "DC Comics", "Bane": "DC Comics", "Green Arrow": "DC Comics", "Black Canary": "DC Comics", "Martian Manhunter": "DC Comics", "Shazam": "DC Comics", "Lex Luthor": "DC Comics", "Darkseid": "DC Comics", "Doctor Fate": "DC Comics", "Zatanna": "DC Comics", "Constantine": "DC Comics", "Swamp Thing": "DC Comics", "Blue Beetle": "DC Comics", "Static Shock": "DC Comics",
    "Gaviao Arqueiro": "Marvel Comics", "Professor Xavier": "Marvel Comics", "Magneto": "Marvel Comics", "Tempestade": "Marvel Comics", "Ciclope": "Marvel Comics", "Jean Grey": "Marvel Comics", "Vampira": "Marvel Comics", "Gambit": "Marvel Comics", "Visao": "Marvel Comics", "Nick Fury": "Marvel Comics", "Blade": "Marvel Comics", "Motoqueiro Fantasma": "Marvel Comics", "Senhor das Estrelas": "Marvel Comics", "Gamora": "Marvel Comics", "Groot": "Marvel Comics", "Rocket Raccoon": "Marvel Comics", "Drax": "Marvel Comics",
    "Jessica Jones": "Marvel Comics", "Luke Cage": "Marvel Comics", "Iron Fist": "Marvel Comics", "Ms Marvel": "Marvel Comics", "She-Hulk": "Marvel Comics", "Hawkeye": "Marvel Comics", "Kate Bishop": "Marvel Comics", "Vision": "Marvel Comics", "Ant-Man": "Marvel Comics", "Wasp": "Marvel Comics", "Falcon": "Marvel Comics", "Winter Soldier": "Marvel Comics", "Professor X": "Marvel Comics", "Cyclops": "Marvel Comics", "Storm": "Marvel Comics", "Rogue": "Marvel Comics", "Beast": "Marvel Comics", "Mystique": "Marvel Comics", "Green Goblin": "Marvel Comics", "Doctor Octopus": "Marvel Comics", "Mysterio": "Marvel Comics", "Gwen Stacy": "Marvel Comics", "Star-Lord": "Marvel Comics", "Nebula": "Marvel Comics",
    "Starlight": "The Boys", "Lucas Sinclair": "Stranger Things", "Will Byers": "Stranger Things", "Max Mayfield": "Stranger Things", "Hopper": "Stranger Things",
    "Morticia Addams": "The Addams Family", "Gomez Addams": "The Addams Family", "Tio Chico": "The Addams Family", "John Watson": "Sherlock Holmes",
    "Gimli": "The Lord of the Rings", "Bilbo": "The Hobbit", "Hagrid": "Harry Potter", "Draco Malfoy": "Harry Potter",
    "Patrick Estrela": "SpongeBob SquarePants", "Lula Molusco": "SpongeBob SquarePants", "Sandy Bochechas": "SpongeBob SquarePants",
    "Phineas": "Phineas and Ferb", "Ferb": "Phineas and Ferb", "Perry": "Phineas and Ferb", "Mabel Pines": "Gravity Falls", "Dipper Pines": "Gravity Falls", "Bill Cipher": "Gravity Falls",
    "Sokka": "Avatar The Last Airbender", "Toph": "Avatar The Last Airbender", "Spawn": "Spawn", "Hellboy": "Hellboy",
    "Summer Smith": "Rick and Morty", "Beth Smith": "Rick and Morty", "Jerry Smith": "Rick and Morty", "Professor Farnsworth": "Futurama", "Maggie Simpson": "The Simpsons",
    "Brian Griffin": "Family Guy", "Lois Griffin": "Family Guy", "Stan Smith": "American Dad", "Roger Smith": "American Dad", "Bob Belcher": "Bob's Burgers", "Tina Belcher": "Bob's Burgers", "Louise Belcher": "Bob's Burgers",
    "Ice King": "Adventure Time", "Amethyst": "Steven Universe", "Negan": "The Walking Dead", "Gus Fring": "Breaking Bad", "Dexter Morgan": "Dexter", "Tony Soprano": "The Sopranos", "Don Draper": "Mad Men",
    "Cersei Lannister": "Game of Thrones", "Sansa Stark": "Game of Thrones", "Mace Windu": "Star Wars", "Qui-Gon Jinn": "Star Wars", "Kylo Ren": "Star Wars", "Rey": "Star Wars", "Finn Star Wars": "Star Wars", "Poe Dameron": "Star Wars", "Lando Calrissian": "Star Wars", "Padme Amidala": "Star Wars", "C-3PO": "Star Wars", "BB-8": "Star Wars",
    "Geordi La Forge": "Star Trek", "William Riker": "Star Trek", "Kathryn Janeway": "Star Trek", "Benjamin Sisko": "Star Trek",
    "James Holden": "The Expanse", "Naomi Nagata": "The Expanse", "Amos Burton": "The Expanse", "Chrisjen Avasarala": "The Expanse",
    "Lady Jessica": "Dune", "Baron Harkonnen": "Dune", "Dracula": "Dracula", "Frankenstein": "Frankenstein", "Wolfman": "Universal Monsters",
    "Spike": "Buffy the Vampire Slayer", "Angel": "Buffy the Vampire Slayer", "Xena": "Xena: Warrior Princess", "Hercules": "Hercules: The Legendary Journeys",
    "Geralt of Rivia": "The Witcher", "Jaskier": "The Witcher", "The Doctor": "Doctor Who", "Amy Pond": "Doctor Who", "Clara Oswald": "Doctor Who", "Donna Noble": "Doctor Who",
    "Newt": "Fantastic Beasts", "Predator": "Predator", "Robocop": "RoboCop"
  }
};

function hydrateRoom(nextRoom) {
  if (!nextRoom) return nextRoom;
  const avatars = nextRoom.avatars || {};
  return {
    ...nextRoom,
    players: (nextRoom.players || []).map((player) => ({
      ...player,
      avatar: player.avatar || avatars[player.id] || ""
    }))
  };
}

function App() {
  const clientIdRef = useRef(getGhostClientId());
  const [constants, setConstants] = useState(DEFAULT_CONSTANTS);
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [toast, setToast] = useState("");
  const [roomEvents, setRoomEvents] = useState([]);
  const [inactiveClosed, setInactiveClosed] = useState(null);
  const [joinChoice, setJoinChoice] = useState(null);
  const [passwordJoin, setPasswordJoin] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [siteView, setSiteView] = useState("home");
  const [homeView, setHomeView] = useState("home");
  const [roomDirectory, setRoomDirectory] = useState([]);
  const [authToken, setAuthToken] = useLocalState("codehack:authToken", "");
  const [authUser, setAuthUser] = useLocalState("codehack:authUser", null);
  const [authSavedAt, setAuthSavedAt] = useLocalState("codehack:authSavedAt", 0);
  const [authModal, setAuthModal] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [soundMuted, setSoundMuted] = useLocalState("codehack:soundMuted", false);
  const [matrixEnabled, setMatrixEnabled] = useLocalState("codehack:matrixEnabled", true);
  const [customCategories, setCustomCategories] = useLocalState("decrypto:customCategories", []);
  const [playerAvatar, setPlayerAvatar] = useLocalState("codehack:avatar", "");
  const [playerSettingsOpen, setPlayerSettingsOpen] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState("");
  const [draggedPlayerSnapshot, setDraggedPlayerSnapshot] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const me = room?.players.find((p) => p.id === playerId);
  const selectedGame = GAME_CATALOG.find((game) => game.id === selectedGameId) || null;
  const activeGameId = selectedGameId || room?.gameId || "code-hack";
  useGameSounds(room, playerId);

  const action = (event, payload = {}) => new Promise((resolve) => {
    const enrichedPayload = { ...payload, gameId: payload.gameId || activeGameId, clientId: payload.clientId || clientIdRef.current, authToken };
    socket.emit(event, enrichedPayload, (reply) => {
      if (!reply?.ok) setToast(reply?.error || "Falha de transmissao.");
      else setToast("");
      if (reply?.needsRoleChoice) {
        setJoinChoice({ ...reply, payload: enrichedPayload });
        resolve(reply);
        return;
      }
      if (reply?.playerId || reply?.room?.viewerId) setPlayerId(reply.playerId || reply.room.viewerId);
      if (reply?.room) {
        rememberSession(reply.room, enrichedPayload, enrichedPayload.clientId);
        setSelectedGameId(reply.room.gameId || enrichedPayload.gameId || "code-hack");
        setRoom(hydrateRoom(reply.room));
      }
      resolve(reply);
    });
  });

  const authAction = (event, payload = {}) => new Promise((resolve) => {
    socket.emit(event, payload, (reply) => {
      if (reply?.token) setAuthToken(reply.token);
      if (reply?.user?.id) {
        setAuthUser(reply.user);
        setProfileUser((current) => current?.id === reply.user.id ? reply.user : current);
        setAuthSavedAt(Date.now());
        setPlayerAvatar(reply.user.avatar || "");
      }
      resolve(reply);
    });
  });

  function loadProfile(userId) {
    if (!userId) return;
    socket.emit("auth:profile", { userId }, (reply) => {
      if (reply?.ok && reply.profile) {
        setProfileUser(reply.profile);
        if (authUser?.id === reply.profile.id) {
          setAuthUser((current) => current ? { ...current, ...reply.profile } : reply.profile);
        }
      }
    });
  }

  useEffect(() => {
    socket.on("constants", setConstants);
    socket.on("rooms:update", (rooms = []) => {
      setRoomDirectory(filterRoomsByGame(rooms, activeGameId));
    });
    socket.emit("rooms:list", { gameId: activeGameId }, (reply) => {
      if (reply?.ok && Array.isArray(reply.rooms)) setRoomDirectory(filterRoomsByGame(reply.rooms, activeGameId));
    });
    socket.on("room:update", (nextRoom) => {
      if (nextRoom?.viewerId) setPlayerId(nextRoom.viewerId);
      setRoom(hydrateRoom(nextRoom));
      if (nextRoom?.inactivityClosesAt) {
        setRoomEvents((events) => [
          ...events.filter((item) => item.type !== "inactivity"),
          { id: `inactivity-${nextRoom.code}`, type: "inactivity", closesAt: nextRoom.inactivityClosesAt, at: Date.now() }
        ].slice(-5));
      } else {
        setRoomEvents((events) => events.filter((item) => item.type !== "inactivity"));
      }
    });
    socket.on("room:imageMap", (imageMap = {}) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;
        return {
          ...currentRoom,
          imageMap: {
            ...(currentRoom.imageMap || {}),
            ...imageMap
          }
        };
      });
    });
    socket.on("player:avatarUpdate", ({ playerId: updatedPlayerId, avatar }) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;
        return {
          ...currentRoom,
          players: currentRoom.players.map((player) => (
            player.id === updatedPlayerId ? { ...player, avatar } : player
          ))
        };
      });
    });
    socket.on("room:kicked", () => {
      setRoom(null);
      clearActiveRoomSession();
      setToast("Voce foi removido da sala.");
    });
    socket.on("room:event", (event) => {
      setRoomEvents((events) => [...events, event].slice(-5));
      setTimeout(() => {
        setRoomEvents((events) => events.filter((item) => item.id !== event.id));
      }, 3300);
    });
    socket.on("room:inactivityWarning", (event) => {
      setRoomEvents((events) => [...events.filter((item) => item.type !== "inactivity"), event].slice(-5));
    });
    socket.on("room:inactivityClear", () => {
      setRoomEvents((events) => events.filter((item) => item.type !== "inactivity"));
    });
    socket.on("room:inactiveClosed", (payload = {}) => {
      setRoomEvents([]);
      if (payload.reason !== "noPlayers") {
        setRoom(null);
        setPlayerId("");
        clearActiveRoomSession();
      }
      setInactiveClosed(payload);
    });
    return () => {
      socket.off("constants");
      socket.off("rooms:update");
      socket.off("room:update");
      socket.off("room:imageMap");
      socket.off("player:avatarUpdate");
      socket.off("room:kicked");
      socket.off("room:event");
      socket.off("room:inactivityWarning");
      socket.off("room:inactivityClear");
      socket.off("room:inactiveClosed");
    };
  }, [activeGameId]);

  useEffect(() => {
    socket.emit("rooms:list", { gameId: activeGameId }, (reply) => {
      if (reply?.ok && Array.isArray(reply.rooms)) setRoomDirectory(filterRoomsByGame(reply.rooms, activeGameId));
    });
  }, [activeGameId]);

  useEffect(() => {
    function openProfile(event) {
      const userId = event.detail?.userId;
      loadProfile(userId);
    }
    window.addEventListener("profile:open", openProfile);
    return () => window.removeEventListener("profile:open", openProfile);
  }, [authUser?.id]);

  useEffect(() => {
    if (!profileUser?.id) return undefined;
    const timer = window.setInterval(() => loadProfile(profileUser.id), 2000);
    return () => window.clearInterval(timer);
  }, [profileUser?.id, authUser?.id]);

  useEffect(() => {
    if (!room?.inactivityClosesAt) return undefined;
    let sent = false;
    function signalActivity() {
      if (sent) return;
      sent = true;
      socket.emit("room:activity", {}, () => {});
    }
    window.addEventListener("pointerdown", signalActivity);
    window.addEventListener("keydown", signalActivity);
    return () => {
      window.removeEventListener("pointerdown", signalActivity);
      window.removeEventListener("keydown", signalActivity);
    };
  }, [room?.inactivityClosesAt]);

  useEffect(() => {
    if (!authToken) {
      setAuthUser(null);
      setAuthSavedAt(0);
      setPlayerAvatar("");
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    if (Date.now() - Number(authSavedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
      setAuthToken("");
      setAuthUser(null);
      setAuthSavedAt(0);
      setPlayerAvatar("");
      return;
    }
    socket.emit("auth:me", { token: authToken }, (reply) => {
      if (reply?.ok && reply.user?.id) {
        setAuthUser(reply.user);
        setAuthSavedAt(Date.now());
        setPlayerAvatar(reply.user.avatar || "");
        if (reply.user.preferences) {
          setSoundMuted(reply.user.preferences.soundMuted ?? false);
          setMatrixEnabled(reply.user.preferences.matrixEnabled ?? true);
          if (Array.isArray(reply.user.preferences.customCategories)) {
            setCustomCategories(reply.user.preferences.customCategories);
          }
        }
      } else {
        setAuthToken("");
        setAuthUser(null);
        setAuthSavedAt(0);
        setPlayerAvatar("");
      }
    });
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !authUser?.id) return;
    const prefs = { soundMuted, matrixEnabled, customCategories };
    const timer = setTimeout(() => {
      socket.emit("auth:updatePreferences", { token: authToken, preferences: prefs }, (reply) => {
        if (!reply?.ok) {
          console.warn("Failed to sync preferences to Supabase");
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [soundMuted, matrixEnabled, customCategories, authToken, authUser]);

  useEffect(() => {
    let restored = false;
    function restoreActiveRoom() {
      if (restored) return;
      const active = readActiveRoomSession();
      if (!active?.code || !active?.name || !active.clientId) return;
      if (active.gameId) setSelectedGameId(active.gameId);
      restored = true;
      socket.emit("room:resume", { ...active, avatar: authUser?.avatar || "" }, (reply) => {
        if (!reply?.ok) {
          clearActiveRoomSession();
          setToast(reply?.error || "");
          return;
        }
        setToast("");
        if (reply?.playerId || reply?.room?.viewerId) setPlayerId(reply.playerId || reply.room.viewerId);
        if (reply?.room) {
          setSelectedGameId(reply.room.gameId || active.gameId || "code-hack");
          setRoom(hydrateRoom(reply.room));
        }
      });
    }
    if (socket.connected) restoreActiveRoom();
    socket.on("connect", restoreActiveRoom);
    return () => socket.off("connect", restoreActiveRoom);
  }, [authUser?.avatar]);

  function askConfirm(config) {
    setConfirmDialog(config);
  }

  async function confirmLeaveRoom() {
    const reply = await action("room:leave");
    if (reply?.ok) {
      clearActiveRoomSession();
      setRoom(null);
      setPlayerId("");
    }
  }

  return (
    <div className={`app-shell ${!room && !selectedGameId ? "meira-site-shell" : ""} ${!room && selectedGameId && homeView === "home" ? "home-screen" : ""} ${room?.phase === "lobby" ? "neutral" : me?.team || "neutral"}`}>
      {matrixEnabled && selectedGameId && <MatrixRain />}
      {!room ? (
        !selectedGameId ? (
          <MeiraGamesSite
            view={siteView}
            setView={setSiteView}
            games={GAME_CATALOG}
            authUser={authUser}
            onOpenAuth={() => setAuthModal("login")}
            onOpenProfile={() => loadProfile(authUser?.id)}
            onSelectGame={(gameId) => {
              setSelectedGameId(gameId);
              setHomeView("home");
            }}
          />
        ) : homeView === "rooms" ? (
          <RoomDirectory
            rooms={roomDirectory}
            constants={constants}
            game={selectedGame}
            action={action}
            toast={toast}
            playerAvatar={playerAvatar}
            authUser={authUser}
            onBack={() => setHomeView("home")}
            onBackToPortal={() => {
              setSelectedGameId("");
              setHomeView("home");
            }}
            onOpenSettings={() => setPlayerSettingsOpen(true)}
            onOpenAuth={() => setAuthModal("login")}
            onOpenProfile={() => loadProfile(authUser?.id)}
            onPasswordJoin={setPasswordJoin}
          />
        ) : (
          <main className="home-layout">
            <div className="home-logo-frame">
              <div className="home-logo" aria-label="Logo do jogo">
                <IconImg src={selectedGame?.id === "ringbound" ? SITE_ASSETS.ringboundCard : ICONS.logo} alt="Logo do jogo" className="home-logo-img" />
              </div>
            </div>
            <Home
              action={action}
              constants={constants}
              toast={toast}
              game={selectedGame}
              playerAvatar={playerAvatar}
              authUser={authUser}
              roomDirectory={roomDirectory}
              onOpenRooms={() => setHomeView("rooms")}
              onBackToPortal={() => setSelectedGameId("")}
              onOpenAuth={() => setAuthModal("login")}
              onOpenProfile={() => loadProfile(authUser?.id)}
              onOpenSettings={() => setPlayerSettingsOpen(true)}
              onPasswordJoin={setPasswordJoin}
            />
          </main>
        )
      ) : (
        <>
          <header className="topbar">
          <div className="brand">
            <div className="logo-mark"><IconImg src={ICONS.logo} alt="Logo do jogo" className="logo-img" /></div>
          </div>
          <button
            className={`room-code-copy ${roomCodeCopied ? "copied" : ""}`}
            title="Copiar codigo da sala"
            onClick={() => {
              navigator.clipboard?.writeText(room.code);
              setRoomCodeCopied(true);
              setTimeout(() => setRoomCodeCopied(false), 2000);
            }}
          >
            <span>{room.code}</span>
            <Copy size={18} />
            <em>Copiado</em>
          </button>
          <div className="topbar-game-info">
            <div className="topbar-actions">
              <button onClick={() => askConfirm({
                title: "Voltar para a tela inicial?",
                text: "Voce sairá desta sala. Se a partida estiver em andamento, podera voltar usando o mesmo nome.",
                confirmLabel: "Voltar",
                onConfirm: confirmLeaveRoom
              })}><LogOut size={17} /> Menu principal</button>
              {room.hostId === playerId && room.phase !== "lobby" && (
                <button onClick={() => askConfirm({
                  title: "Voltar todos para o lobby?",
                  text: "A partida atual sera encerrada e todos os jogadores retornarão ao lobby da sala.",
                  confirmLabel: "Voltar ao lobby",
                  onConfirm: () => action("host:returnLobby")
                })}><RotateCcw size={17} /> Voltar ao lobby</button>
              )}
              <div className="home-user-strip topbar-profile-strip">
                <SettingsAvatarButton avatar={authUser?.avatar} onClick={() => setPlayerSettingsOpen(true)} />
                <strong>{authUser?.displayName || me?.name || "Jogador"}</strong>
              </div>
            </div>
          </div>
          </header>

          <main
            onDrag={(event) => {
              if (draggedPlayerId && event.clientX && event.clientY) setDragPosition({ x: event.clientX, y: event.clientY });
            }}
            onDragOver={(event) => draggedPlayerId && event.preventDefault()}
            onDrop={(event) => {
              if (!draggedPlayerId || room?.phase !== "lobby" || room.hostId !== playerId) return;
              event.preventDefault();
              action("host:move", { playerId: draggedPlayerId, team: null });
              setDraggedPlayerId("");
              setDraggedPlayerSnapshot(null);
            }}
          >
            {room.phase === "lobby" ? (
              room.gameId === "ringbound" ? (
                <RingboundLobby room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />
              ) : (
                <Lobby room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} customCategories={customCategories} setCustomCategories={setCustomCategories} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
              )
            ) : (
              room.gameId === "ringbound" ? (
                <RingboundGame room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />
              ) : (
                <Game room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />
              )
            )}
          </main>
        </>
      )}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={async () => {
            await confirmDialog.onConfirm?.();
            setConfirmDialog(null);
          }}
        />
      )}
      <RoomEventStack events={roomEvents} />
      {inactiveClosed && <InactivityClosedModal reason={inactiveClosed.reason} onClose={() => setInactiveClosed(null)} />}
      {joinChoice && (
        <JoinChoiceModal
          joinChoice={joinChoice}
          onCancel={() => setJoinChoice(null)}
          onPick={async (role) => {
            const reply = await action("room:join", { ...joinChoice.payload, role });
            if (reply?.ok && !reply.needsRoleChoice) setJoinChoice(null);
          }}
        />
      )}
      {passwordJoin && (
        <PasswordJoinModal
          room={passwordJoin.room}
          toast={toast}
          onCancel={() => setPasswordJoin(null)}
          onJoin={async (password) => {
            const reply = await action("room:join", {
              code: passwordJoin.room.code,
              name: passwordJoin.name,
              avatar: authUser?.avatar || "",
              password,
              clientId: passwordJoin.clientId || getRoomClientId(passwordJoin.room.code)
            });
            if (reply?.ok) setPasswordJoin(null);
          }}
        />
      )}
      {playerSettingsOpen && (
        <PlayerSettingsModal
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
          matrixEnabled={matrixEnabled}
          setMatrixEnabled={setMatrixEnabled}
          playerAvatar={playerAvatar}
          authUser={authUser}
          onAvatarChange={async (avatar) => {
            setPlayerAvatar(avatar);
            if (authUser) {
              const optimisticUser = { ...authUser, avatar };
              setAuthUser(optimisticUser);
              setProfileUser((current) => current?.id === authUser.id ? optimisticUser : current);
            }
            if (room) await action("player:avatar", { avatar });
            else if (authUser) await authAction("auth:updateProfile", { token: authToken, avatar });
          }}
          onOpenAuth={() => setAuthModal("login")}
          onOpenProfile={() => {
            setPlayerSettingsOpen(false);
            loadProfile(authUser?.id);
          }}
          onClose={() => setPlayerSettingsOpen(false)}
        />
      )}
      {authModal && (
        <AuthModal
          mode={authModal}
          setMode={setAuthModal}
          authAction={authAction}
          onClose={() => setAuthModal(null)}
        />
      )}
      {profileUser && (
        <div className="confirm-overlay profile-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal">
            <ProfilePage
              profile={profileUser}
              isOwn={authUser?.id === profileUser.id}
              authAction={authAction}
              onBack={() => setProfileUser(null)}
              onLogout={async () => {
                await authAction("auth:logout", { token: authToken });
                setAuthToken("");
                setAuthUser(null);
                setAuthSavedAt(0);
                setPlayerAvatar("");
                setProfileUser(null);
              }}
            />
          </div>
        </div>
      )}
      {draggedPlayerSnapshot && (
        <div className={`drag-ghost player-card team-surface ${draggedPlayerSnapshot.team || ""}`} style={{ "--drag-x": `${dragPosition.x}px`, "--drag-y": `${dragPosition.y}px` }}>
          <PlayerIdentity player={draggedPlayerSnapshot} />
        </div>
      )}
    </div>
  );
}

function MeiraGamesSite({ view, setView, games, authUser, onOpenAuth, onOpenProfile, onSelectGame }) {
  const availableGames = games.filter((game) => game.available);
  const currentView = view || "home";
  return (
    <div className="meira-site">
      <MeiraHeader view={currentView} setView={setView} authUser={authUser} onOpenAuth={onOpenAuth} onOpenProfile={onOpenProfile} />
      <main className="meira-main">
        {currentView === "games" && <MeiraGamesGrid games={games} onSelectGame={onSelectGame} />}
        {currentView === "contact" && <MeiraContact />}
        {currentView === "home" && <MeiraHome games={games} availableCount={availableGames.length} onSelectGame={onSelectGame} />}
      </main>
      <MeiraFooter setView={setView} />
    </div>
  );
}

function MeiraHeader({ view, setView, authUser, onOpenAuth, onOpenProfile }) {
  return (
    <header className="meira-header">
      <nav className="meira-nav" aria-label="Navegacao principal">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>Inicio</button>
        <button className={view === "games" ? "active" : ""} onClick={() => setView("games")}>Jogos</button>
        <button className={view === "contact" ? "active" : ""} onClick={() => setView("contact")}>Contato</button>
      </nav>
      <img className="meira-logo-main" src={SITE_ASSETS.logo} alt="Meira Games" />
      <div className="meira-auth">
        {authUser ? (
          <button onClick={onOpenProfile}>
            <span className="meira-header-avatar">{authUser.avatar ? <img src={authUser.avatar} alt="" /> : <UserCircle size={20} />}</span>
            {authUser.displayName}
          </button>
        ) : (
          <button onClick={onOpenAuth}><UserCircle size={18} /> Entrar / Criar conta</button>
        )}
      </div>
    </header>
  );
}

function MeiraHome({ games, availableCount, onSelectGame }) {
  const featured = games[0];
  return (
    <div className="meira-page enter">
      <section className="meira-hero-slider">
        <img src={featured.heroImage} alt={`${featured.name} destaque`} />
        <div>
          <span>Jogo em destaque</span>
          <h1>{featured.name}</h1>
          <p>{featured.description}</p>
          <button className="primary" onClick={() => onSelectGame(featured.id)}><Play size={18} /> Jogar agora</button>
        </div>
      </section>
      <section className="meira-info-grid">
        <article>
          <h2>Fliperama online</h2>
          <p>Meira Games reune jogos multiplayer personalizaveis, salas em tempo real e perfis globais para acompanhar suas partidas.</p>
        </article>
        <article>
          <h2>{availableCount} jogo disponivel</h2>
          <p>O catalogo comeca com Code Hack e foi preparado para receber novos jogos sem misturar salas, historicos ou estatisticas.</p>
        </article>
        <article>
          <h2>Conquistas</h2>
          <p>Placeholder para medalhas, desafios semanais e marcos especiais do jogador.</p>
        </article>
        <article>
          <h2>Amigos</h2>
          <p>Placeholder para lista de amigos, convites rapidos e presenca online.</p>
        </article>
        <article className="meira-news-card">
          <h2>Noticias</h2>
          <p>Code Hack abriu o portal. Em breve, novas mesas digitais chegam ao Meira Games.</p>
        </article>
      </section>
    </div>
  );
}

function MeiraGamesGrid({ games, onSelectGame }) {
  return (
    <div className="meira-page enter">
      <section className="meira-section-head">
        <h1>Jogos</h1>
        <p>Escolha uma mesa, chame seus amigos e entre no modo arcade.</p>
      </section>
      <div className="meira-games-grid">
        {games.map((game) => (
          <button className="meira-game-card" key={game.id} onClick={() => game.available && onSelectGame(game.id)} disabled={!game.available}>
            <img src={game.cardImage} alt={game.name} />
            <span>
              <strong>{game.name}</strong>
              <em>{game.description}</em>
            </span>
          </button>
        ))}
        <div className="meira-game-card coming-soon">
          <img src={SITE_ASSETS.comingSoonCard} alt="Novos jogos em breve" />
          <span>
            <strong>Novos jogos</strong>
            <em>O proximo cartucho ainda esta carregando.</em>
          </span>
        </div>
      </div>
    </div>
  );
}

function MeiraContact() {
  return (
    <div className="meira-page enter">
      <section className="meira-contact panel">
        <h1>Quem somos</h1>
        <p>Meira Games e um espaco para transformar jogos de mesa, deducao e estrategia em experiencias online com personalidade propria.</p>
        <div className="meira-contact-list">
          <p><strong>Email</strong><span>contato@meiragames.example</span></p>
          <p><strong>Discord</strong><span>discord.gg/meiragames-placeholder</span></p>
          <p><strong>Instagram</strong><span>@meiragames.placeholder</span></p>
        </div>
      </section>
    </div>
  );
}

function MeiraFooter({ setView }) {
  return (
    <footer className="meira-footer">
      <div>
        <img src={SITE_ASSETS.logo} alt="Meira Games" />
        <p>Jogos online personalizaveis com salas em tempo real, perfis globais e uma pitada de fliperama.</p>
      </div>
      <nav>
        <strong>Navegacao</strong>
        <button onClick={() => setView("home")}>Inicio</button>
        <button onClick={() => setView("games")}>Jogos</button>
        <button onClick={() => setView("contact")}>Contato</button>
      </nav>
      <label>
        Idioma
        <select value="pt-BR" onChange={() => {}}>
          <option value="pt-BR">Portugues Brasil</option>
          <option value="en-US">English em breve</option>
        </select>
      </label>
    </footer>
  );
}

function PlayerSettingsModal({ soundMuted, setSoundMuted, matrixEnabled, setMatrixEnabled, playerAvatar, authUser, onAvatarChange, onOpenAuth, onOpenProfile, onClose }) {
  async function pickAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const avatar = await resizeAvatar(file);
    await onAvatarChange(avatar);
  }

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="player-settings-modal">
        <div className="modal-title">
          <strong>Configuracoes</strong>
          <button className="icon-only" onClick={onClose} aria-label="Fechar configuracoes"><X size={18} /></button>
        </div>
        <div className="avatar-editor-block">
          <label className={`avatar-editor ${authUser ? "" : "disabled"}`} title={authUser ? "Alterar avatar no perfil" : "Entre para alterar avatar"}>
            <span className="settings-avatar-preview">
              {authUser?.avatar ? <img src={authUser.avatar} alt="Avatar atual" /> : <UserCircle size={42} />}
            </span>
            {authUser && <span className="avatar-edit-overlay"><Pencil size={30} /></span>}
            {authUser && <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />}
          </label>
          {authUser?.avatar && (
            <button className="avatar-remove-button" title="Remover avatar" aria-label="Remover avatar" onClick={() => onAvatarChange("")}>
              <X size={16} />
            </button>
          )}
        </div>
        {authUser ? (
          <button onClick={onOpenProfile}><UserCircle size={18} /> Perfil</button>
        ) : (
          <button onClick={onOpenAuth}><UserCircle size={18} /> Entrar ou criar conta</button>
        )}
        <SettingToggle
          icon={soundMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          title="Sons"
          checked={!soundMuted}
          onChange={(checked) => setSoundMuted(!checked)}
        />
        <SettingToggle
          icon={<RadioTower size={22} />}
          title="Efeitos"
          checked={matrixEnabled}
          onChange={setMatrixEnabled}
        />
      </div>
    </div>
  );
}

function SettingToggle({ icon, title, checked, onChange }) {
  return (
    <div className="setting-toggle-row">
      <div className="setting-toggle-copy">
        <span className="setting-toggle-icon">{icon}</span>
        <div>
          <strong>{title}</strong>
        </div>
      </div>
      <button className={`toggle-switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
        <span />
      </button>
    </div>
  );
}

function RetroSelect({ value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const items = options.map((option) => (
    typeof option === "string" ? { value: option, label: option } : option
  ));
  const selected = items.find((option) => option.value === value) || items[0];
  useEffect(() => {
    if (!open) return undefined;
    function updateRect() {
      const rect = triggerRef.current?.getBoundingClientRect();
      const zoom = siteZoom();
      if (rect) setMenuRect({ left: rect.left / zoom, top: (rect.bottom + 6) / zoom, width: rect.width / zoom });
    }
    function close(event) {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    updateRect();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  return (
    <div className={`retro-select ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="retro-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label || "Selecionar"}</span>
        <i aria-hidden="true" />
      </button>
      {open && menuRect && createPortal(
        <div ref={menuRef} className="retro-select-menu retro-select-menu-portal" role="listbox" style={{ left: menuRect.left, top: menuRect.top, width: menuRect.width }}>
          {items.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function ConfirmDialog({ title, text, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <strong>{title}</strong>
        <p>{text}</p>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={onConfirm}><BadgeCheck size={18} /> {confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function RoomEventStack({ events }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!events.some((event) => event.type === "inactivity")) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [events]);
  if (!events.length) return null;
  return (
    <div className="room-event-stack" aria-live="polite">
      {events.map((event) => (
        event.type === "inactivity" ? (
          <InactivityEventCard key={event.id} event={event} now={now} />
        ) : (
          <div className="room-event-card" key={event.id}>
            <span className="room-event-avatar">
              {event.avatar ? <img src={event.avatar} alt={`Avatar de ${event.playerName}`} /> : initials(event.playerName)}
            </span>
            <span className="room-event-text">
              <strong><GuestDisplayName name={event.playerName} sessionTag={event.sessionTag} /></strong>
              {event.type === "leave" ? (
                " saiu da partida."
              ) : (
                <>
                  {" entrou no "}
                  <em className={`team-name ${event.team || "neutral"}`}>{teamEventName(event.team)}</em>
                </>
              )}
            </span>
          </div>
        )
      ))}
    </div>
  );
}

function InactivityEventCard({ event, now }) {
  const remaining = Math.max(0, Number(event.closesAt || now) - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return (
    <div className="room-event-card inactivity-event-card">
      <span className="room-event-avatar countdown-avatar">{minutes}:{String(seconds).padStart(2, "0")}</span>
      <span className="room-event-text">
        <strong>Sala inativa</strong>
        {" interaja para impedir o encerramento."}
      </span>
    </div>
  );
}

function InactivityClosedModal({ reason, onClose }) {
  const text = reason === "noPlayers"
    ? "Partida encerrada por falta de jogadores."
    : "A sala foi encerrada por inatividade. Voce voltou para o menu principal.";
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <strong>Partida encerrada</strong>
        <p>{text}</p>
        <div className="inline-actions">
          <button className="primary" onClick={onClose}><BadgeCheck size={18} /> Entendi</button>
        </div>
      </div>
    </div>
  );
}

function SettingsAvatarButton({ avatar, onClick }) {
  return (
    <button className="settings-avatar-preview small avatar-profile-button" title="Configuracoes" aria-label="Configuracoes" onClick={onClick}>
      {avatar ? <img src={avatar} alt="" /> : <UserCircle size={32} />}
    </button>
  );
}

function JoinChoiceModal({ joinChoice, onCancel, onPick }) {
  const players = joinChoice.preview?.players || [];
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal join-choice-modal">
        <strong>Entrar na partida</strong>
        <p>A partida ja esta em andamento. Escolha como deseja entrar.</p>
        <div className="join-preview-list">
          {["red", "blue", null].map((team) => {
            const list = players.filter((player) => player.team === team);
            return (
              <div className={`join-preview-team ${team ? `team-surface ${team}` : "spectator-preview"}`} key={team || "spectators"}>
                <span>{team ? teamLabel(team) : "Espectadores"}</span>
                {list.length ? list.map((player) => <PlayerIdentity key={player.id} player={player} />) : <small>Vazio</small>}
              </div>
            );
          })}
        </div>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button onClick={() => onPick("spectator")}>Entrar como espectador</button>
          <button className="primary" onClick={() => onPick("player")}>Entrar como jogador</button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, setMode, authAction, onClose }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isRegister && password !== passwordRepeat) {
      setError("As senhas nao coincidem.");
      return;
    }
    const reply = await authAction(isRegister ? "auth:register" : "auth:login", { username, displayName, password });
    if (reply?.ok) onClose();
    else setError(reply?.error || "Falha ao autenticar.");
  }

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <form className="confirm-modal auth-modal" onSubmit={submit}>
        <div className="auth-head">
          <UserCircle size={30} />
          <strong>{isRegister ? "Criar conta" : "Entrar"}</strong>
        </div>
        <label>Usuario
          <input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={24} autoFocus />
        </label>
        {isRegister && (
          <label>Nome de exibicao
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={18} />
          </label>
        )}
        <label>Senha
          <PasswordField value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} />
        </label>
        {isRegister && (
          <label>Repetir senha
            <PasswordField value={passwordRepeat} onChange={setPasswordRepeat} show={showPassword} setShow={setShowPassword} />
          </label>
        )}
        {error && <p className="toast">{error}</p>}
        <div className="inline-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" onClick={() => setMode(isRegister ? "login" : "register")}>{isRegister ? "Ja tenho conta" : "Criar conta"}</button>
          <button className="primary" type="submit"><UserCircle size={18} /> {isRegister ? "Criar" : "Entrar"}</button>
        </div>
      </form>
    </div>
  );
}

function ProfilePage({ profile, isOwn, authAction, onBack, onLogout }) {
  const [tab, setTab] = useState("stats");
  const [gameTab, setGameTab] = useState("code-hack");
  const [draftName, setDraftName] = useState(profile.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [accountError, setAccountError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const matches = (profile.matches || []).filter((match) => String(match.gameId || "code-hack") === gameTab);
  const stats = gameStatsForProfile(profile, gameTab);
  useEffect(() => {
    setDraftName(profile.displayName || "");
  }, [profile.displayName]);

  async function pickAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const avatar = await resizeAvatar(file);
    await authAction("auth:updateProfile", { token: localStorageToken(), avatar });
  }

  async function saveDisplayName() {
    setAccountError("");
    const reply = await authAction("auth:updateProfile", { token: localStorageToken(), displayName: draftName });
    if (!reply?.ok) setAccountError(reply?.error || "Nao foi possivel salvar o nome.");
  }

  async function savePassword() {
    setAccountError("");
    if (newPassword !== newPasswordRepeat) {
      setAccountError("As senhas novas nao coincidem.");
      return;
    }
    const reply = await authAction("auth:changePassword", { token: localStorageToken(), currentPassword, newPassword });
    if (!reply?.ok) {
      setAccountError(reply?.error || "Nao foi possivel redefinir a senha.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordRepeat("");
  }

  return (
    <main className="profile-page enter">
      <section className="panel profile-hero">
        <label className={`avatar-editor ${isOwn ? "" : "disabled"}`}>
          <span className="settings-avatar-preview">{profile.avatar ? <img src={profile.avatar} alt="" /> : <UserCircle size={44} />}</span>
          {isOwn && <span className="avatar-edit-overlay"><Pencil size={30} /></span>}
          {isOwn && <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />}
        </label>
        <div>
          <strong>@{profile.username}</strong>
          <p>{profile.displayName}</p>
        </div>
        <div className="profile-actions">
          <button onClick={onBack}><ArrowLeft size={17} /> Voltar</button>
          {isOwn && <button className="danger-action" onClick={onLogout}><Unplug size={17} /> Deslogar</button>}
        </div>
      </section>
      <div className="segmented profile-tabs">
        {isOwn && <button className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}>Conta</button>}
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>Estatisticas</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Historico</button>
      </div>
      <div className="segmented profile-game-tabs">
        {GAME_CATALOG.map((game) => (
          <button
            key={game.id}
            className={gameTab === game.id ? "active" : ""}
            onClick={() => {
              setGameTab(game.id);
              setSelectedMatch(null);
            }}
          >
            {game.name}
          </button>
        ))}
      </div>
      {tab === "account" && isOwn && (
        <section className="panel profile-account-panel">
          <div className="profile-account-row">
            <label>Nome de exibicao
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={18} />
            </label>
            <button className="primary compact-action" onClick={saveDisplayName}>Salvar</button>
          </div>
          <div className="profile-account-row password-row">
            <label>Senha atual
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <label>Nova senha
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label>Repetir nova senha
              <input type="password" value={newPasswordRepeat} onChange={(event) => setNewPasswordRepeat(event.target.value)} />
            </label>
            <button className="compact-action" onClick={savePassword}>Redefinir</button>
          </div>
          {accountError && <p className="toast">{accountError}</p>}
        </section>
      )}
      {tab === "stats" && <ProfileStats stats={stats} />}
      {tab === "history" && (
        <ProfileHistory matches={matches} selectedMatch={selectedMatch} setSelectedMatch={setSelectedMatch} />
      )}
    </main>
  );
}

function ProfileStats({ stats }) {
  return (
    <section className="panel profile-grid">
      <div className="profile-stat"><strong>{stats.wins || 0}</strong><span>Vitorias</span></div>
      <div className="profile-stat"><strong>{stats.losses || 0}</strong><span>Derrotas</span></div>
      <div className="profile-stat"><strong>{stats.draws || 0}</strong><span>Empates</span></div>
      <div className="profile-stat"><strong>{stats.abandoned || 0}</strong><span>Abandonos</span></div>
      <TopWords title="Top descriptografadas" words={stats.decryptedWords} />
      <TopWords title="Top interceptadas" words={stats.interceptedWords} />
    </section>
  );
}

function TopWords({ title, words = {} }) {
  const score = (value) => typeof value === "number" ? value : Number(value?.correct || 0);
  const attempts = (value) => typeof value === "number" ? value : Number(value?.attempts || 0);
  const entries = Object.entries(words).sort((a, b) => score(b[1]) - score(a[1]) || attempts(b[1]) - attempts(a[1])).slice(0, 10);
  return (
    <div className="top-words">
      <strong>{title}</strong>
      {entries.length ? entries.map(([word, count]) => <p key={word}>{word}<span>{score(count)}/{attempts(count)}</span></p>) : <p>Nenhum registro ainda.</p>}
    </div>
  );
}

function ProfileHistory({ matches, selectedMatch, setSelectedMatch }) {
  const sortedMatches = [...matches].sort((a, b) => Number(b.finishedAt || 0) - Number(a.finishedAt || 0));
  return (
    <section className="profile-history-grid">
      <div className="panel match-list">
        {sortedMatches.length ? sortedMatches.map((match) => (
          <button key={match.id} className={`match-card ${match.outcome || "loss"} ${selectedMatch?.id === match.id ? "active" : ""}`} onClick={() => setSelectedMatch(match)}>
            <strong>{new Date(match.finishedAt).toLocaleString()}</strong>
            <span>{match.id}</span>
            <em>{match.playerCount} jogadores - {match.outcome === "win" ? "vitoria" : match.outcome === "draw" ? "empate" : match.outcome === "abandoned" ? "abandonada" : "derrota"}</em>
          </button>
        )) : <p>Nenhuma partida registrada.</p>}
      </div>
      {selectedMatch && <MatchDetails match={selectedMatch} />}
    </section>
  );
}

function MatchDetails({ match }) {
  const pseudoRoom = matchToRoom(match);
  return (
    <div className={`panel match-details match-outcome-${match.outcome || "loss"}`}>
      <strong>Placar final</strong>
      <ScoreBoard room={pseudoRoom} constants={DEFAULT_CONSTANTS} playerId="" ordered />
      <MatchPlayers players={match.players || []} />
      <div className="match-teams">
        {TEAMS.map((team) => (
          <div className={`hint-board team-surface ${team}`} key={team}>
            <strong>{teamLabel(team)}</strong>
            <ol className="match-word-list">
              {(match.teams?.[team]?.words || []).map((word, index) => (
                <li key={`${team}-${word}-${index}`}>
                  <span className="word-number">#{index + 1} </span>{word}
                  <MatchTiebreakerGuess match={match} team={team} index={index} />
                </li>
              ))}
            </ol>
            <div className="history-rounds">
              {orderedHistory(match.teams?.[team]?.hintHistory || []).map((entry) => (
                <HistoryRoundCard key={`${team}-${entry.round}`} team={team} outcome={match.outcome} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function gameStatsForProfile(profile, gameId) {
  if (gameId === "code-hack") {
    return profile.stats || { wins: 0, losses: 0, draws: 0, abandoned: 0, decryptedWords: {}, interceptedWords: {} };
  }
  const matches = (profile.matches || []).filter((match) => String(match.gameId || "code-hack") === gameId && match.status !== "active");
  return matches.reduce((stats, match) => {
    if (match.outcome === "win") stats.wins += 1;
    else if (match.outcome === "draw") stats.draws += 1;
    else if (match.outcome === "abandoned") stats.abandoned += 1;
    else stats.losses += 1;
    return stats;
  }, { wins: 0, losses: 0, draws: 0, abandoned: 0, decryptedWords: {}, interceptedWords: {} });
}

function MatchTiebreakerGuess({ match, team, index }) {
  const guesser = otherTeam(team);
  const guess = match.tiebreaker?.[guesser]?.guess?.[index];
  if (!guess) return null;
  const correct = normalizeWordText(guess) === normalizeWordText(match.teams?.[team]?.words?.[index] || "");
  return (
    <small className={`match-tiebreaker-guess ${correct ? "correct" : "wrong"}`}>
      {teamLabel(guesser)}: {guess}
    </small>
  );
}

function MatchPlayers({ players }) {
  if (!players.length) return null;
  return (
    <div className="match-players">
      {players.map((player, index) => (
        <button
          type="button"
          key={`${player.userId || player.id || player.name}-${index}`}
          className={`player-card team-surface ${player.team || ""}`}
          onClick={() => player.userId && window.dispatchEvent(new CustomEvent("profile:open", { detail: { userId: player.userId } }))}
          disabled={!player.userId}
        >
          <PlayerIdentity player={player} />
        </button>
      ))}
    </div>
  );
}

function HistoryRoundCard({ team, outcome, entry }) {
  return (
    <div className={`history-round team-surface ${team} match-outcome-${outcome || "loss"}`}>
      <strong>Rodada {entry.round}</strong>
      <div className="round-code-list">
        {[0, 1, 2].map((slot) => (
          <div className="round-code-row" key={`${entry.round}-${slot}`}>
            <span className="round-hint">{entry.hints?.[slot] || ""}</span>
            <span className={`code-chip ${team}`}>{entry.teamGuess?.[slot] || "?"}</span>
            <span className={`code-chip ${otherTeam(team)}`}>{entry.interceptGuess?.[slot] || "?"}</span>
            <span className="code-chip correct-code">{entry.code?.[slot] || "?"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function matchToRoom(match) {
  return {
    phase: "gameOver",
    settings: {
      startingLives: match.settings?.startingLives || DEFAULT_CONSTANTS.STARTING_LIVES,
      winIntercepts: match.settings?.winIntercepts || DEFAULT_CONSTANTS.WIN_INTERCEPTS
    },
    teams: {
      red: { score: match.finalScore?.red || { lives: 0, interceptions: 0, correct: 0 } },
      blue: { score: match.finalScore?.blue || { lives: 0, interceptions: 0, correct: 0 } }
    },
    players: []
  };
}

function localStorageToken() {
  try {
    return JSON.parse(localStorage.getItem("codehack:authToken") || "\"\"");
  } catch {
    return "";
  }
}

function Home({ action, constants, toast, game, playerAvatar, authUser, roomDirectory, onOpenRooms, onBackToPortal, onOpenAuth, onOpenProfile, onOpenSettings, onPasswordJoin }) {
  const [name, setName] = useLocalState("decrypto:name", "");
  const [code, setCode] = useLocalState("decrypto:lastRoomCode", "");
  const [createOpen, setCreateOpen] = useState(false);
  const guestDisplayName = splitGuestDisplayName(name.trim()).name || guestName();
  const displayName = authUser?.displayName || guestDisplayName;
  async function pasteRoomCode() {
    try {
      const text = await navigator.clipboard.readText();
      setCode(String(text || "").trim().toUpperCase().slice(0, 6));
    } catch {
      // Clipboard access depends on browser permission.
    }
  }

  async function joinByCode() {
    const normalizedCode = code.trim().toUpperCase();
    const clientId = getRoomClientId(normalizedCode);
    const listedRoom = roomDirectory.find((room) => room.code === normalizedCode);
    if (listedRoom?.hasPassword) {
      onPasswordJoin({ room: listedRoom, name: displayName, clientId });
      return;
    }
    await action("room:join", { code: normalizedCode, name: displayName, avatar: authUser?.avatar || "", clientId });
  }

  return (
    <section className="home-grid enter">
      <div className="console-panel">
        <div className="home-user-strip">
          <SettingsAvatarButton avatar={authUser?.avatar} onClick={onOpenSettings} />
          {authUser ? (
            <div>
              <strong>{authUser.displayName}</strong>
            </div>
          ) : (
            <label className="guest-display-field">
              <span>Nome</span>
              <input
                value={guestDisplayName}
                onChange={(event) => setName(event.target.value)}
                maxLength={18}
                placeholder="Nome de exibicao"
              />
            </label>
          )}
        </div>
        <button onClick={onBackToPortal}><ArrowLeft size={18} /> Meira Games</button>
        <button className="primary" onClick={() => setCreateOpen(true)}><Play size={18} /> Criar sala</button>
        {authUser ? <button onClick={onOpenProfile}><UserCircle size={18} /> Perfil</button> : <button onClick={onOpenAuth}><UserCircle size={18} /> Criar conta / Entrar</button>}
        <button onClick={onOpenRooms}><RadioTower size={18} /> Salas</button>
        <div className="join-row">
          <div className="paste-input-wrap">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
            <button type="button" className="input-icon-button" title="Colar codigo" aria-label="Colar codigo" onClick={pasteRoomCode}>
              <ClipboardPaste size={18} />
            </button>
          </div>
          <button onClick={joinByCode}><LogIn size={18} /> Entrar</button>
        </div>
        {toast && <p className="toast">{toast}</p>}
      </div>
      {createOpen && (
        game?.id === "ringbound" ? (
          <RingboundCreateRoomModal
            playerName={displayName}
            constants={constants.RINGBOUND || {}}
            onCancel={() => setCreateOpen(false)}
            onCreate={async (settings) => {
              const reply = await action("room:create", { name: displayName, avatar: authUser?.avatar || "", clientId: makeRoomClientId(), ...settings });
              if (reply?.ok) setCreateOpen(false);
            }}
          />
        ) : (
          <CreateRoomModal
            playerName={displayName}
            onCancel={() => setCreateOpen(false)}
            onCreate={async (settings) => {
              const reply = await action("room:create", { name: displayName, avatar: authUser?.avatar || "", clientId: makeRoomClientId(), ...settings });
              if (reply?.ok) setCreateOpen(false);
            }}
          />
        )
      )}
    </section>
  );
}

function RoomDirectory({ rooms, constants, game, action, toast, playerAvatar, authUser, onBack, onBackToPortal, onOpenSettings, onOpenAuth, onOpenProfile, onPasswordJoin }) {
  const [name, setName] = useLocalState("decrypto:name", "");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [passwordFilter, setPasswordFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("name");
  const categories = game?.id === "ringbound" ? constants.RINGBOUND?.categories || [] : Object.keys(constants.WORD_BANKS || {});
  const visibleRooms = [...rooms]
    .filter((room) => phaseFilter === "all" || (phaseFilter === "playing" ? room.inGame : !room.inGame))
    .filter((room) => passwordFilter === "all" || (passwordFilter === "with" ? room.hasPassword : !room.hasPassword))
    .filter((room) => categoryFilter === "all" || room.category === categoryFilter)
    .sort((left, right) => {
      if (sortMode === "players") return right.playerCount - left.playerCount || left.name.localeCompare(right.name);
      return left.name.localeCompare(right.name) || right.playerCount - left.playerCount;
    });

  async function joinRoom(room) {
    const displayName = authUser?.displayName || splitGuestDisplayName(name.trim()).name || guestName();
    const clientId = getRoomClientId(room.code);
    if (room.hasPassword) {
      onPasswordJoin({ room, name: displayName, clientId });
      return;
    }
    await action("room:join", { code: room.code, name: displayName, avatar: authUser?.avatar || "", clientId });
  }

  return (
    <main className="rooms-page">
      <section className="panel rooms-filter-panel">
        <div className="rooms-filter-top">
          <div className="home-user-strip rooms-profile-strip">
            <SettingsAvatarButton avatar={authUser?.avatar} onClick={onOpenSettings} />
            <div>
              <strong>{authUser ? authUser.displayName : (splitGuestDisplayName(name.trim()).name || guestName())}</strong>
            </div>
            {!authUser && <button className="compact-action" onClick={onOpenAuth}><UserCircle size={18} /> Entrar</button>}
          </div>
          <div className="inline-actions">
            <button onClick={onBackToPortal}><ArrowLeft size={17} /> Meira Games</button>
            <button onClick={onBack}><LogOut size={17} /> Menu principal</button>
          </div>
        </div>
        <div className="rooms-filter-grid">
          <label>Status
            <RetroSelect
              value={phaseFilter}
              onChange={setPhaseFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "lobby", label: "Lobby" },
                { value: "playing", label: "Em andamento" }
              ]}
            />
          </label>
          <label>Senha
            <RetroSelect
              value={passwordFilter}
              onChange={setPasswordFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "with", label: "Com senha" },
                { value: "without", label: "Sem senha" }
              ]}
            />
          </label>
          <label>Categoria
            <RetroSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "Todas" },
                ...categories.map((category) => ({ value: category, label: category })),
                { value: "Personalizada", label: "Personalizada" }
              ]}
            />
          </label>
          <label>Ordenar
            <RetroSelect
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: "name", label: "Ordem alfabetica" },
                { value: "players", label: "Quantidade de jogadores" }
              ]}
            />
          </label>
        </div>
      </section>

      <section className="rooms-list-section">
        <div className="rooms-list-head">
          <strong>Salas disponiveis</strong>
          <span>{visibleRooms.length} / {rooms.length}</span>
        </div>
        {visibleRooms.length ? (
          <div className="room-card-grid">
            {visibleRooms.map((room) => (
              <button className="room-card" key={room.code} onClick={() => joinRoom(room)}>
                <span className="room-card-title">{room.name}</span>
                <span>Criada por {room.hostName}</span>
                <span className="room-card-meta">
                  <em><Users size={15} /> {room.playerCount}/12</em>
                  <em>{room.inGame ? "Em andamento" : "Lobby"}</em>
                  <em>{room.hasPassword ? "Com senha" : "Sem senha"}</em>
                </span>
                <span className="room-card-category">{room.category}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-rooms panel">
            <RadioTower size={24} />
            <p>Nenhuma sala publica encontrada.</p>
          </div>
        )}
        {toast && <p className="toast">{toast}</p>}
      </section>
    </main>
  );
}

function PasswordJoinModal({ room, toast, onCancel, onJoin }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <strong>Senha da sala</strong>
        <p>{room.name}</p>
        <label>Senha
          <PasswordField value={password} maxLength={32} show={showPassword} setShow={setShowPassword} onChange={setPassword} autoFocus />
        </label>
        {toast && <p className="toast">{toast}</p>}
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={() => onJoin(password)}><LogIn size={18} /> Entrar</button>
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ playerName, onCancel, onCreate }) {
  const defaultName = `Sala de ${String(playerName || "Operador").trim() || "Operador"}`;
  const [roomName, setRoomName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [publicRoom, setPublicRoom] = useState(true);
  const valid = roomName.trim().length > 0;

  useEffect(() => {
    setRoomName((current) => current.trim() ? current : defaultName);
  }, [defaultName]);

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal create-room-modal">
        <strong>Criar sala</strong>
        <label>Nome da sala
          <input value={roomName} maxLength={36} onChange={(event) => setRoomName(event.target.value)} placeholder={defaultName} />
        </label>
        <label>Senha
          <PasswordField
            value={publicRoom ? password : ""}
            maxLength={32}
            disabled={!publicRoom}
            show={showPassword}
            setShow={setShowPassword}
            onChange={setPassword}
            placeholder={publicRoom ? "Opcional" : "Desativada em sala privada"}
          />
        </label>
        <div className="setting-toggle-row">
          <div className="setting-toggle-copy">
            <span className="setting-toggle-icon"><RadioTower size={18} /></span>
            <strong>{publicRoom ? "Sala publica" : "Sala privada"}</strong>
          </div>
          <button className={`toggle-switch ${publicRoom ? "on" : ""}`} onClick={() => setPublicRoom(!publicRoom)} aria-label="Alternar sala publica">
            <span />
          </button>
        </div>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" disabled={!valid} onClick={() => onCreate({ roomName: roomName.trim(), password: publicRoom ? password.trim() : "", publicRoom })}><Play size={18} /> Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, setShow, disabled = false, maxLength = 64, placeholder = "", autoFocus = false }) {
  return (
    <span className="password-field">
      <input
        type={show ? "text" : "password"}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <button type="button" className="input-icon-button" disabled={disabled} onClick={() => setShow(!show)} aria-label={show ? "Esconder senha" : "Mostrar senha"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}

function Lobby({ room, playerId, constants, action, toast, playerAvatar, customCategories, setCustomCategories, draggedPlayerId, setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;
  const [customName, setCustomName] = useState("");
  const [customWords, setCustomWords] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const categories = [...Object.keys(constants.WORD_BANKS), ...customCategories.map((cat) => cat.name), "Personalizada"];
  const selectedCustom = customCategories.find((cat) => cat.name === room.settings.category);

  function applyCategory(category) {
    const custom = customCategories.find((cat) => cat.name === category);
    action("room:settings", {
      category: custom ? "Personalizada" : category,
      customWords: custom ? custom.words : room.settings.customWords
    });
  }

  function saveCustom() {
    const words = customWords.split(",").map((word) => word.trim()).filter(Boolean);
    if (!customName.trim() || words.length < 12) return;
    setCustomCategories([...customCategories.filter((cat) => cat.name !== customName.trim()), { name: customName.trim(), words }]);
    setCustomName("");
    setCustomWords("");
  }

  return (
    <section className="lobby enter">
      <div className="lobby-grid">
        <div className="panel teams-panel">
          {!room.settings.randomTeams && (
            <>
              <TeamColumn team="red" room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
              <TeamColumn team="blue" room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
            </>
          )}
          <TeamColumn team={null} room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
          {isHost && (
            <div className="host-actions">
              <button className={room.settings.randomTeams ? "active-toggle" : ""} onClick={() => action("room:settings", { randomTeams: !room.settings.randomTeams })}><Shuffle size={17} /> Times aleatorios</button>
              {toast && <p className="toast lobby-action-error">{toast}</p>}
              <button className="primary" onClick={() => action("game:start")}><Zap size={17} /> Iniciar</button>
            </div>
          )}
        </div>

        <div className="panel settings-panel">
          <label>Categoria</label>
          <RetroSelect
            disabled={!isHost}
            value={selectedCustom?.name || room.settings.category}
            onChange={applyCategory}
            options={categories.map((category) => ({ value: category, label: category }))}
          />
          <label>Dificuldade</label>
          <div className="segmented">
            {[4, 5, 6].map((count) => (
              <button key={count} disabled={!isHost} className={room.settings.wordCount === count ? "active" : ""} onClick={() => action("room:settings", { wordCount: count })}>{count} palavras</button>
            ))}
          </div>
          <div className="number-settings">
            <label>Vidas
              <NumberStepper
                value={room.settings.startingLives || constants.STARTING_LIVES}
                disabled={!isHost}
                onChange={(value) => action("room:settings", { startingLives: value })}
              />
            </label>
            <label>Interceptacoes
              <NumberStepper
                value={room.settings.winIntercepts || constants.WIN_INTERCEPTS}
                disabled={!isHost}
                onChange={(value) => action("room:settings", { winIntercepts: value })}
              />
            </label>
          </div>
          <div className={`custom-box collapsible ${customOpen ? "open" : ""}`}>
            <button className="custom-toggle" onClick={() => setCustomOpen(!customOpen)}>
              <strong>Categoria Personalizada</strong>
              <span>{customOpen ? "-" : "+"}</span>
            </button>
            {customOpen && (
              <div className="custom-content">
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nome da categoria" />
                <textarea value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="palavra, palavra, palavra..." />
                <button onClick={saveCustom}><BadgeCheck size={17} /> Salvar categoria</button>
              </div>
            )}
          </div>
          <ChatPanel room={room} playerId={playerId} action={action} scope="global" />
        </div>
      </div>
    </section>
  );
}

function NumberStepper({ value, onChange, disabled }) {
  const current = clampNumber(Number(value) || 1, 1, 5);
  return (
    <div className={`number-stepper ${disabled ? "disabled" : ""}`}>
      <button type="button" disabled={disabled || current <= 1} onClick={() => onChange(clampNumber(current - 1, 1, 5))}>-</button>
      <input
        type="number"
        min="1"
        max="5"
        disabled={disabled}
        value={current}
        onChange={(event) => onChange(clampNumber(Number(event.target.value) || 1, 1, 5))}
      />
      <button type="button" disabled={disabled || current >= 5} onClick={() => onChange(clampNumber(current + 1, 1, 5))}>+</button>
    </div>
  );
}

function RingboundLobby({ room, playerId, constants, action, toast, playerAvatar }) {
  const isHost = room.hostId === playerId;
  const categories = constants.RINGBOUND?.categories?.length ? constants.RINGBOUND.categories : DEFAULT_CONSTANTS.RINGBOUND.categories;
  return (
    <section className="ringbound-lobby enter">
      <div className="ringbound-lobby-grid">
        <div className="panel ringbound-room-panel">
          <div className="ringbound-section-title">
            <strong>Jogadores</strong>
            <span>{room.players.length}/12</span>
          </div>
          <div className="ringbound-player-list">
            {room.players.map((player) => (
              <div className={`ringbound-player-card ${player.id === playerId ? "self" : ""}`} key={player.id}>
                <PlayerIdentity player={player} fallbackAvatar={playerAvatar} />
                {player.isHost && <IconImg src={ICONS.leader} alt="Host" className="leader-icon" />}
              </div>
            ))}
          </div>
          <ChatPanel room={room} playerId={playerId} action={action} scope="global" />
        </div>

        <div className="panel ringbound-settings-panel">
          <label>Categoria das cartas</label>
          <RetroSelect
            disabled={!isHost}
            value={room.settings.wordCategory || "Geral"}
            onChange={(wordCategory) => action("room:settings", { wordCategory })}
            options={categories.map((category) => ({ value: category, label: category }))}
          />
          <label>Aneis</label>
          <div className="segmented ringbound-segmented">
            {[1, 2, 3].map((count) => (
              <button key={count} disabled={!isHost} className={room.settings.ringCount === count ? "active" : ""} onClick={() => action("room:settings", { ringCount: count })}>{count}</button>
            ))}
          </div>
          <label>Mestre dos Aneis</label>
          <div className="segmented ringbound-segmented">
            <button disabled={!isHost} className={room.settings.masterMode === "game" ? "active" : ""} onClick={() => action("room:settings", { masterMode: "game" })}>Jogo</button>
            <button disabled={!isHost} className={room.settings.masterMode === "player" ? "active" : ""} onClick={() => action("room:settings", { masterMode: "player" })}>Jogador</button>
          </div>
          <div className="ringbound-rules-preview">
            <strong>Como funciona</strong>
            <p>Os aneis mostram a categoria da regra. A regra exata fica escondida, exceto para o Mestre dos Aneis.</p>
          </div>
          {isHost && <button className="primary" onClick={() => action("game:start")}><Zap size={17} /> Iniciar Ringbound</button>}
          {toast && <p className="toast">{toast}</p>}
        </div>
      </div>
    </section>
  );
}

function RingboundGame({ room, playerId, action, toast, playerAvatar }) {
  const state = room.ringbound || {};
  const rings = state.rings || [];
  const currentItem = state.deck?.[0];
  const master = room.players.find((player) => player.id === state.ringMasterId);
  const currentPlayerId = ringboundCurrentPlayerId(room);
  const isCurrentPlayer = currentPlayerId === playerId;
  const isMaster = state.ringMasterId === playerId;
  const currentPlayer = room.players.find((player) => player.id === currentPlayerId);
  const [selection, setSelection] = useState(["A", "B", "C"].slice(0, rings.length));
  const [masterSelection, setMasterSelection] = useState([]);

  useEffect(() => {
    setSelection(["A", "B", "C"].slice(0, rings.length));
    setMasterSelection([]);
  }, [currentItem?.id, rings.length]);

  if (room.phase === "gameOver") {
    return <RingboundGameOver room={room} playerId={playerId} action={action} playerAvatar={playerAvatar} />;
  }

  return (
    <section className="ringbound-game enter">
      <aside className="ringbound-side panel">
        <RingboundScore room={room} playerId={playerId} />
        <RingboundPlayers room={room} playerId={playerId} currentPlayerId={currentPlayerId} playerAvatar={playerAvatar} />
      </aside>
      <main className="ringbound-table panel">
        <div className="ringbound-round-head">
          <span>Rodada {state.round || 1}/{state.round + (state.deck?.length || 0) - 1 || 1}</span>
          {master ? <span>Mestre dos Aneis: {master.name}</span> : <span>Mestre dos Aneis: jogo</span>}
        </div>
        <RingboundBoard rings={rings} placed={state.placed || []} />
        <div className="ringbound-turn-card">
          {currentItem ? (
            <>
              <p className="eyebrow">{isCurrentPlayer ? "Sua vez" : `Vez de ${currentPlayer?.name || "jogador"}`}</p>
              <div className="ringbound-item-focus">
                <WordImage word={currentItem.label} index={state.round || 0} category={room.settings.wordCategory} />
                <strong className="ringbound-current-item">{currentItem.label}</strong>
              </div>
              <RingboundChoice rings={rings} value={selection} onChange={setSelection} disabled={!isCurrentPlayer || Boolean(state.pending)} />
              <button className="primary" disabled={!isCurrentPlayer || Boolean(state.pending)} onClick={() => action("ringbound:guess", { ringIds: selection })}>
                <Play size={17} /> Posicionar
              </button>
            </>
          ) : (
            <strong>Todos os itens foram posicionados.</strong>
          )}
          {state.pending && (
            <div className="ringbound-pending">
              <strong>Palpite aguardando validacao</strong>
              <p>{playerName(room, state.pending.playerId)} colocou <b>{state.pending.item?.label}</b> em {ringboundComboLabel(state.pending.guess)}</p>
              {isMaster ? (
                <>
                  <RingboundChoice rings={rings} value={masterSelection} onChange={setMasterSelection} />
                  <div className="inline-actions">
                    <button className="primary" onClick={() => action("ringbound:resolve", { ringIds: state.pending.guess })}><Check size={17} /> Palpite correto</button>
                    <button onClick={() => action("ringbound:resolve", { ringIds: masterSelection })}><X size={17} /> Corrigir posicao</button>
                  </div>
                </>
              ) : (
                <p className="small">O Mestre dos Aneis esta analisando a jogada.</p>
              )}
            </div>
          )}
          {toast && <p className="toast">{toast}</p>}
        </div>
      </main>
      <aside className="ringbound-side panel">
        <RingboundRules rings={rings} />
        <RingboundLog room={room} />
      </aside>
    </section>
  );
}

function RingboundBoard({ rings, placed }) {
  return (
    <div className={`ringbound-board rings-${rings.length}`}>
      <div className="ringbound-venn">
        {rings.map((ring, index) => (
          <div className={`ringbound-ring ring-${index}`} key={ring.id} style={{ "--ring-color": ring.color }}>
            <span>{ring.id}</span>
          </div>
        ))}
      </div>
      <div className="ringbound-zone-list">
        {ringboundZones(rings).map((zone) => {
          const items = placed.filter((item) => ringboundComboKey(item.correct) === ringboundComboKey(zone.ids));
          return (
            <div className="ringbound-zone" key={zone.key}>
              <strong>{zone.label}</strong>
              <div>{items.length ? items.map((item) => <span key={item.id} className={item.success ? "success" : "miss"}>{item.label}</span>) : <em>vazio</em>}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RingboundChoice({ rings, value, onChange, disabled = false }) {
  const selected = new Set(value || []);
  function toggle(id) {
    const next = selected.has(id) ? [...selected].filter((item) => item !== id) : [...selected, id];
    onChange(next.sort());
  }
  return (
    <div className="ringbound-choice">
      {rings.map((ring) => (
        <button key={ring.id} disabled={disabled} className={selected.has(ring.id) ? "active" : ""} style={{ "--ring-color": ring.color }} onClick={() => toggle(ring.id)}>
          Anel {ring.id}
        </button>
      ))}
      <button disabled={disabled} className={!selected.size ? "active outside" : "outside"} onClick={() => onChange([])}>Fora</button>
    </div>
  );
}

function RingboundRules({ rings }) {
  return (
    <div className="ringbound-rules">
      <strong>Categorias dos aneis</strong>
      {rings.map((ring) => (
        <div className="ringbound-rule-row" key={ring.id} style={{ "--ring-color": ring.color }}>
          <span>Anel {ring.id}</span>
          <b>{ring.groupLabel}</b>
          {ring.label && <small>{ring.label}</small>}
        </div>
      ))}
    </div>
  );
}

function RingboundScore({ room, playerId }) {
  const scores = room.ringbound?.scores || {};
  const ordered = [...room.players].sort((left, right) => Number(scores[right.id] || 0) - Number(scores[left.id] || 0));
  return (
    <div className="ringbound-score">
      <strong>Pontuacao</strong>
      {ordered.map((player) => (
        <div className={player.id === playerId ? "self" : ""} key={player.id}>
          <span>{player.name}</span>
          <b>{scores[player.id] || 0}</b>
        </div>
      ))}
    </div>
  );
}

function RingboundPlayers({ room, playerId, currentPlayerId, playerAvatar }) {
  return (
    <div className="ringbound-players">
      <strong>Jogadores</strong>
      {room.players.map((player) => (
        <div className={`ringbound-player-card ${player.id === playerId ? "self" : ""} ${player.id === currentPlayerId ? "turn" : ""}`} key={player.id}>
          <PlayerIdentity player={player} fallbackAvatar={playerAvatar} />
          {player.id === room.ringbound?.ringMasterId && <span className="ringbound-master-badge">Mestre</span>}
        </div>
      ))}
    </div>
  );
}

function RingboundLog({ room }) {
  const log = room.ringbound?.log || [];
  return (
    <div className="ringbound-log">
      <strong>Historico</strong>
      {log.length ? log.slice().reverse().map((entry, index) => (
        <p key={`${entry.item}-${index}`}>
          <b>{entry.item}</b> em {ringboundComboLabel(entry.guess)} {entry.success ? "acertou" : `corrigido para ${ringboundComboLabel(entry.correct)}`}
        </p>
      )) : <p className="small">As jogadas aparecem aqui.</p>}
    </div>
  );
}

function RingboundGameOver({ room, playerId, action, playerAvatar }) {
  const scores = room.ringbound?.scores || {};
  const winner = [...room.players].sort((left, right) => Number(scores[right.id] || 0) - Number(scores[left.id] || 0))[0];
  return (
    <section className="ringbound-game enter">
      <main className="ringbound-table panel ringbound-final">
        <strong>Resultado Ringbound</strong>
        <p>{winner ? `${winner.name} venceu com ${scores[winner.id] || 0} pontos.` : "Partida encerrada."}</p>
        <RingboundBoard rings={room.ringbound?.rings || []} placed={room.ringbound?.placed || []} />
        {room.hostId === playerId && <button className="primary" onClick={() => action("host:returnLobby")}><RotateCcw size={17} /> Voltar ao lobby</button>}
      </main>
      <aside className="ringbound-side panel">
        <RingboundPlayers room={room} playerId={playerId} currentPlayerId="" playerAvatar={playerAvatar} />
      </aside>
    </section>
  );
}

function ringboundCurrentPlayerId(room) {
  const state = room.ringbound || {};
  const order = (state.turnOrder || []).filter((id) => room.players.some((player) => player.id === id && player.connected) && id !== state.ringMasterId);
  if (!order.length) return "";
  return order[(state.turnIndex || 0) % order.length];
}

function ringboundZones(rings) {
  const ids = rings.map((ring) => ring.id);
  const zones = [{ key: "outside", ids: [], label: "Fora dos aneis" }];
  ids.forEach((id) => zones.push({ key: id, ids: [id], label: `Anel ${id}` }));
  if (ids.length >= 2) zones.push({ key: `${ids[0]}${ids[1]}`, ids: [ids[0], ids[1]], label: `Intersecao ${ids[0]} + ${ids[1]}` });
  if (ids.length >= 3) {
    zones.push({ key: `${ids[0]}${ids[2]}`, ids: [ids[0], ids[2]], label: `Intersecao ${ids[0]} + ${ids[2]}` });
    zones.push({ key: `${ids[1]}${ids[2]}`, ids: [ids[1], ids[2]], label: `Intersecao ${ids[1]} + ${ids[2]}` });
    zones.push({ key: ids.join(""), ids, label: "Centro dos tres aneis" });
  }
  return zones;
}

function ringboundComboKey(ids = []) {
  return [...ids].sort().join("-");
}

function ringboundComboLabel(ids = []) {
  return ids?.length ? ids.join(" + ") : "fora";
}

function playerName(room, playerId) {
  return room.players.find((player) => player.id === playerId)?.name || "Jogador";
}

function TeamColumn({ team, room, playerId, isHost, action, playerAvatar, draggedPlayerId, setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const players = room.players.filter((player) => player.team === team);
  const randomLocked = room.settings.randomTeams;
  const me = room.players.find((player) => player.id === playerId);
  const canChooseHere = !randomLocked && me?.team !== team && room.phase === "lobby";
  const canDropHere = isHost && !randomLocked && room.phase === "lobby";

  function chooseHere() {
    if (canChooseHere) action("player:team", { team });
  }

  function dropPlayer(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!canDropHere) return;
    const draggedPlayerId = event.dataTransfer.getData("text/player-id");
    if (draggedPlayerId) action("host:move", { playerId: draggedPlayerId, team });
    setDraggedPlayerId("");
    setDraggedPlayerSnapshot(null);
  }

  return (
    <div
      className={`team-box ${team ? `team-surface ${team}` : ""} ${team || "unassigned"} ${canChooseHere ? "clickable" : ""}`}
      onClick={chooseHere}
      onDragOver={(event) => canDropHere && event.preventDefault()}
      onDrop={dropPlayer}
    >
      <div className="team-header">
        <h3>{randomLocked && team === null ? "Times Aleatorios" : teamLabel(team)}</h3>
      </div>
      <div className="player-card-list">
        {players.length ? players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            playerId={playerId}
            isHost={isHost}
            randomLocked={randomLocked}
            action={action}
            localAvatar={playerAvatar}
            dragged={draggedPlayerId === player.id}
            dragEnabled={isHost && !randomLocked}
            setDraggedPlayerId={setDraggedPlayerId}
            setDraggedPlayerSnapshot={setDraggedPlayerSnapshot}
            setDragPosition={setDragPosition}
          />
        )) : <div className="empty-team">Vazio</div>}
      </div>
    </div>
  );
}

function PlayerCard({ player, playerId, isHost, action, dragged, dragEnabled = false, marker = "", localAvatar = "", confirmState = "", setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const isSelf = player.id === playerId;
  const visiblePlayer = isSelf && localAvatar ? { ...player, avatar: localAvatar } : player;
  return (
    <div
      className={`player-card team-surface ${player.team || ""} ${isSelf ? "self" : ""} ${confirmState ? `vote-${confirmState}` : ""} ${dragged ? "dragging" : ""} ${player.connected ? "" : "offline"}`}
      draggable={dragEnabled}
      onClick={(event) => {
        event.stopPropagation();
        if (player.userId) window.dispatchEvent(new CustomEvent("profile:open", { detail: { userId: player.userId } }));
      }}
      onDragStart={(event) => {
        if (!dragEnabled) return;
        event.dataTransfer.setData("text/player-id", player.id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setDragImage(new Image(), 0, 0);
        setDragPosition({ x: event.clientX, y: event.clientY });
        setDraggedPlayerId(player.id);
        setDraggedPlayerSnapshot(player);
      }}
      onDrag={(event) => {
        if (dragEnabled && event.clientX && event.clientY) setDragPosition({ x: event.clientX, y: event.clientY });
      }}
      onDragEnd={() => {
        setDraggedPlayerId?.("");
        setDraggedPlayerSnapshot?.(null);
      }}
    >
      <PlayerIdentity player={visiblePlayer} marker={marker} />
      {isHost && player.id !== playerId && (
        <button className="icon-only naked-icon" title="Remover da sala" aria-label="Remover da sala" onClick={() => action("host:kick", { playerId: player.id })}><Trash2 size={17} /></button>
      )}
    </div>
  );
}

function PlayerIdentity({ player, marker = "" }) {
  return (
    <span className="player-identity">
      <span className="player-avatar">{player.avatar ? <img src={player.avatar} alt={`Avatar de ${player.name}`} /> : <UserCircle size={22} />}</span>
      <span className="player-copy">
        <span className="player-name">
          <GuestDisplayName name={player.name} sessionTag={player.sessionTag} />
          {player.isHost && <IconImg src={ICONS.leader} alt="Lider da sala" className="leader-icon" />}
        </span>
        {marker && <small className="player-marker">{marker}</small>}
      </span>
    </span>
  );
}

function GuestDisplayName({ name, sessionTag = "" }) {
  const guestParts = splitGuestDisplayName(name);
  const tag = String(sessionTag || guestParts.tag || "").trim().toUpperCase();
  return (
    <>
      <span>{guestParts.name}</span>
      {tag && <span className="guest-id-tag">{tag}</span>}
    </>
  );
}

function ChatPanel({ room, playerId, action, scope }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const me = room.players.find((player) => player.id === playerId);
  const isTeamChat = scope === "team";
  const isSpectatorChat = scope === "spectator";
  const canUseTeamChat = isTeamChat && room.phase !== "lobby" && TEAMS.includes(me?.team);
  const canUseSpectatorChat = isSpectatorChat && isSpectatorPlayer(me, room);
  const messages = isSpectatorChat ? room.chat?.spectator || [] : isTeamChat ? room.chat?.team || [] : room.chat?.global || [];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  if (isTeamChat && !canUseTeamChat) return null;
  if (isSpectatorChat && !canUseSpectatorChat) return null;

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply = await action("chat:send", { scope, text });
    if (reply?.ok) setDraft("");
  }

  return (
    <section className={`chat-panel ${isTeamChat ? `team-chat team-surface ${me?.team || ""}` : isSpectatorChat ? "spectator-chat" : "global-chat"}`}>
      <h2>{isTeamChat ? "Chat do time" : isSpectatorChat ? "Chat dos espectadores" : "Chat da sala"}</h2>
      <div className="chat-messages" ref={listRef}>
        {messages.length ? messages.map((message) => (
          <p className={`chat-line ${message.playerId === playerId ? "mine" : ""}`} key={message.id}>
            <strong className={room.phase !== "lobby" && message.team ? `team-name ${message.team}` : ""}>
              <GuestDisplayName name={message.playerName} sessionTag={room.players.find((player) => player.id === message.playerId)?.sessionTag} />
            </strong>
            <span>: {message.text}</span>
          </p>
        )) : <p className="small">Nenhuma mensagem ainda.</p>}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} placeholder={isTeamChat ? "Mensagem para seu time" : isSpectatorChat ? "Mensagem para espectadores" : "Mensagem para a sala"} />
        <button type="submit">Enviar</button>
      </form>
    </section>
  );
}

function Game({ room, playerId, constants, action, toast, playerAvatar }) {
  const me = room.players.find((p) => p.id === playerId);
  if (isSpectatorPlayer(me, room)) return <SpectatorGame room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />;
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const winner = getWinner(room, constants);
  const roundResultRevealed = useRoundResultRevealed(room);

  return (
    <section className="game-page enter">
      <div className="game-grid">
        <aside className="left-rail">
          <RoundCounter room={room} constants={constants} compact />
          <WordsPanel team={myTeam} words={room.teams[myTeam]?.words || []} category={room.settings.category} imageMap={room.imageMap} canRefreshImages />
          <GamePlayersPanel room={room} playerId={playerId} constants={constants} action={action} playerAvatar={playerAvatar} />
        </aside>

        <div className="play-panel">
          {room.blocked && <p className="toast game-blocker">{room.blocked}</p>}
          {room.phase === "playing" && <LiveRound room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "roundResult" && <RoundResult room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "tiebreaker" && <Tiebreaker room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "gameOver" && <GameOver room={room} playerId={playerId} constants={constants} winner={winner} action={action} />}
          {toast && <p className="toast">{toast}</p>}
        </div>

        <aside className="right-rail">
          <div className="side-panel scoreboard-panel">
            <ScoreBoard room={room} constants={constants} playerId={playerId} ordered revealScores={roundResultRevealed} />
          </div>
          <ChatPanel room={room} playerId={playerId} action={action} scope="team" />
        </aside>
      </div>
      <HintHistory room={room} constants={constants} playerId={playerId} />
    </section>
  );
}

function SpectatorGame({ room, playerId, constants, action, toast, playerAvatar }) {
  const winner = getWinner(room, constants);
  return (
    <section className="game-page spectator-page enter">
      <div className="spectator-game-grid">
        <div className="spectator-main">
          <RoundCounter room={room} constants={constants} compact />
          {room.blocked && <p className="toast game-blocker">{room.blocked}</p>}
          {room.phase === "playing" && <SpectatorRound room={room} playerId={playerId} constants={constants} />}
          {room.phase === "roundResult" && <RoundResult room={room} playerId={playerId} constants={constants} action={() => Promise.resolve({ ok: false })} />}
          {room.phase === "tiebreaker" && <StatusCard title="Desempate em andamento" text="Espectadores acompanham a decisao final sem confirmar." team="blue" />}
          {room.phase === "gameOver" && <GameOver room={room} playerId={playerId} constants={constants} winner={winner} action={() => Promise.resolve({ ok: false })} />}
          <SpectatorChats room={room} constants={constants} />
          {toast && <p className="toast">{toast}</p>}
        </div>
        <aside className="right-rail">
          <ChatPanel room={room} playerId={playerId} action={action} scope="spectator" />
          <GamePlayersPanel room={room} playerId={playerId} constants={constants} action={() => Promise.resolve({ ok: false })} playerAvatar={playerAvatar} />
        </aside>
      </div>
      <HintHistory room={room} constants={constants} playerId={playerId} />
    </section>
  );
}

function SpectatorRound({ room, playerId, constants }) {
  const me = room.players.find((player) => player.id === playerId);
  return (
    <div className="spectator-team-grid">
      {TEAMS.map((team) => (
        <div className={`spectator-team-column team-surface ${team}`} key={team}>
          <p className="eyebrow"><RadioTower size={16} /> {constants.TEAM_NAMES[team]}</p>
          <TeamScoreCard room={room} team={team} constants={constants} />
          <WordsPanel team={team} words={room.teams[team]?.words || []} category={room.settings.category} imageMap={room.imageMap} canRefreshImages />
          <SpectatorHints hints={room.current?.turns?.[team]?.hints || []} />
          <GuessPhase room={room} playerId={playerId} kind="team" targetTeam={team} title="Descriptografia" hints={room.current?.turns?.[team]?.hints || []} action={() => Promise.resolve({ ok: false })} />
          <GuessPhase room={room} playerId={playerId} kind="intercept" targetTeam={team} title="Interceptacao" hints={room.current?.turns?.[team]?.hints || []} action={() => Promise.resolve({ ok: false })} />
        </div>
      ))}
    </div>
  );
}

function SpectatorHints({ hints }) {
  return (
    <div className={`spectator-round-section ${hints.length ? "" : "empty"}`}>
      <strong>Dicas</strong>
      {hints.length ? <HintsList hints={hints} /> : <p className="small">Aguardando dicas.</p>}
    </div>
  );
}

function SpectatorChats({ room, constants }) {
  const teamChat = room.chat?.team || {};
  return (
    <div className="spectator-chats">
      {TEAMS.map((team) => (
        <section className={`chat-panel team-chat team-surface ${team}`} key={team}>
          <h2>Chat do {constants.TEAM_NAMES[team]}</h2>
          <div className="chat-messages">
            {(teamChat[team] || []).map((message) => (
              <p className="chat-line" key={message.id}>
                <strong className={`team-name ${team}`}>
                  <GuestDisplayName name={message.playerName} sessionTag={room.players.find((player) => player.id === message.playerId)?.sessionTag} />
                </strong>
                <span>: {message.text}</span>
              </p>
            ))}
            {!(teamChat[team] || []).length && <p className="small">Nenhuma mensagem ainda.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}

function GamePlayersPanel({ room, playerId, constants, action, playerAvatar }) {
  const isHost = room.hostId === playerId;
  const me = room.players.find((player) => player.id === playerId);
  const hasSpectators = room.players.some((player) => player.team === null);
  const visibleTeams = me?.team ? [me.team, otherTeam(me.team), ...(hasSpectators ? [null] : [])] : [...TEAMS, ...(hasSpectators ? [null] : [])];
  return (
    <div className={`side-panel players-panel team-surface ${me?.team || ""}`}>
      <h2><Users size={20} /> Jogadores</h2>
      {visibleTeams.map((team) => {
        const teamPlayers = room.players.filter((player) => player.team === team);
        if (team === null && !teamPlayers.length) return null;
        return (
        <div className={`game-team-list ${team ? `team-surface ${team}` : "spectator-preview"}`} key={team || "spectators"}>
          <strong>{team ? constants.TEAM_NAMES[team] : "Espectadores"}</strong>
          <div className="player-card-list">
            {teamPlayers.length ? teamPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                playerId={playerId}
                isHost={isHost}
                action={action}
                localAvatar={playerAvatar}
                marker={playerCardMarker(room, player)}
                confirmState={playerConfirmState(room, player)}
              />
            )) : <div className="empty-team">Vazio</div>}
          </div>
        </div>
        );
      })}
    </div>
  );
}

function LiveRound({ room, playerId, constants, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const ownTurn = room.current?.turns?.[myTeam];
  const rivalTurn = room.current?.turns?.[rival];
  const isCoder = ownTurn?.coderId === playerId;
  if (!TEAMS.includes(myTeam) || !ownTurn) {
    return <StatusCard title="Sincronizando partida" text="Aguardando atribuicao de time e estado da rodada." team={myTeam} />;
  }

  return (
    <div className="live-stack">
      {isCoder && !ownTurn?.hints.length ? (
        <HintsPhase room={room} targetTeam={myTeam} action={action} />
      ) : (
        <StatusCard
          title={ownTurn?.hints.length ? "Dicas transmitidas" : "Aguardando comunicador"}
          text={ownTurn?.hints.length ? "Escolha o codigo do seu time e acompanhe a interceptacao." : "As escolhas liberam assim que as dicas chegarem."}
          team={myTeam}
        />
      )}

      <div className="decision-grid">
        <GuessPhase
          room={room}
          playerId={playerId}
          kind="team"
          targetTeam={myTeam}
          title="Descriptografar"
          hints={ownTurn?.hints || []}
          action={action}
        />
        <GuessPhase
          room={room}
          playerId={playerId}
          kind="intercept"
          targetTeam={rival}
          title="Interceptar"
          hints={rivalTurn?.hints || []}
          action={action}
        />
      </div>
    </div>
  );
}

function StatusCard({ title, text, team }) {
  return (
    <div className={`status-card team-surface ${team || ""}`}>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function HintsPhase({ room, targetTeam, action }) {
  const [hints, setHints] = useState(["", "", ""]);
  const [reviewing, setReviewing] = useState(false);
  const turn = room.current?.turns?.[targetTeam];
  const words = room.teams[targetTeam]?.words || [];

  useEffect(() => {
    if (reviewing) playConfirmCue();
  }, [reviewing]);

  return (
    <>
      <div className={`phase-card compact team-surface ${targetTeam}`}>
        <p className="eyebrow"><Zap size={16} /> codigo confidencial</p>
        <div className="secret-code">{turn?.code?.join("-") || "?"}</div>
        <div className="hint-grid">
          {(turn?.code || []).map((number, index) => (
            <label key={`${number}-${index}`}>Dica para {words[number - 1] || `#${number}`}
              <input value={hints[index]} onChange={(e) => setHints(hints.map((hint, i) => i === index ? e.target.value : hint))} placeholder="Digite uma pista curta" />
            </label>
          ))}
        </div>
        <button className="primary pulse" disabled={Boolean(room.blocked) || hints.filter((hint) => hint.trim()).length !== 3} onClick={() => setReviewing(true)}><BadgeCheck size={18} /> Revisar dicas</button>
      </div>
      {reviewing && createPortal(
        <div className="confirm-overlay hint-review-overlay" role="dialog" aria-modal="true">
          <div className={`confirm-modal hint-review-modal team-surface ${targetTeam}`}>
            <div className="confirm-warning">
              <BadgeCheck size={34} />
              <div>
                <strong>Confirmação final</strong>
                <span>Depois de enviar, as dicas ficam visíveis para todos os jogadores.</span>
              </div>
            </div>
            <HintsList hints={hints} />
            <div className="inline-actions">
              <button onClick={() => setReviewing(false)}>Editar</button>
              <button className="primary" disabled={Boolean(room.blocked)} onClick={async () => {
                const reply = await action("game:hints", { hints });
                if (reply?.ok) setReviewing(false);
              }}><BadgeCheck size={18} /> Enviar dicas</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function GuessPhase({ room, playerId, kind, targetTeam, title, hints, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const turn = room.current?.turns?.[targetTeam];
  const proposal = turn?.proposals?.[kind] || { guess: [], confirmedBy: [], finalized: false };
  const isOwnCoderGuess = kind === "team" && turn?.coderId === playerId;
  const soloCoderTest = isOwnCoderGuess && canSoloCoderTest(room, targetTeam);
  const expectedTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
  const guessValue = proposal.guess?.length ? proposal.guess : [1, 2, 3];
  const canAct = !room.blocked && me?.team === expectedTeam && (!isOwnCoderGuess || soloCoderTest) && hints.length > 0 && !proposal?.finalized;
  const canViewSharedGuess = (me?.spectator || me?.team === expectedTeam) && hints.length > 0;
  const voters = room.players.filter((player) => !player.spectator && player.team === expectedTeam && player.connected && (kind !== "team" || player.id !== turn?.coderId || soloCoderTest));
  const interceptLocked = kind === "intercept" && room.round === 1;

  if (!turn) {
    return (
      <div className={`decision-card team-surface ${targetTeam || ""}`}>
        <p className="eyebrow"><RadioTower size={16} /> {title}</p>
        <WaitingState />
      </div>
    );
  }

  function updateShared(nextGuess) {
    action("game:updateGuess", { kind, targetTeam, guess: nextGuess });
  }

  if (interceptLocked) {
    return (
      <div className={`decision-card team-surface ${targetTeam} intercept-disabled-card`}>
        <div className="decision-title">
          <strong>{title}</strong>
          <span>Rodada 2+</span>
        </div>
        <DisabledInterceptState />
      </div>
    );
  }

  return (
    <div className={`decision-card team-surface ${targetTeam} ${canAct ? "ready" : ""}`}>
      <div className="decision-title">
        <strong>{title}</strong>
        {proposal?.finalized && <span>Fechado</span>}
      </div>
      {!hints.length && <WaitingState />}
      {canViewSharedGuess ? (
        <>
          {isOwnCoderGuess && (
            <div className="coder-code-reminder">
              <span>Codigo correto</span>
              <strong>{turn.code.join("-")}</strong>
            </div>
          )}
          <HintChoiceGrid hints={hints} value={guessValue} setValue={updateShared} wordCount={room.settings.wordCount} disabled={!canAct} />
          {canAct ? (
            <button className="primary" disabled={!isValidCode(guessValue)} onClick={() => action("game:confirmDecision", { kind, targetTeam })}><BadgeCheck size={18} /> Confirmar {displayGuess(guessValue)}</button>
          ) : (
            proposal?.finalized ? <p className="small">Decisao fechada.</p> : <WaitingState />
          )}
        </>
      ) : (
        hints.length ? (proposal?.finalized ? <p className="small">Decisao fechada.</p> : <WaitingState />) : null
      )}
      <ConfirmationRoster players={voters} confirmedBy={proposal.confirmedBy || []} />
    </div>
  );
}

function WaitingState({ label = "Aguardando transmissão..." }) {
  return (
    <div className="waiting-state" aria-live="polite">
      <span className="waiting-spinner" aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  );
}

function canSoloCoderTest(room, team) {
  return room.players.filter((player) => player.connected && !player.spectator && player.team === team).length === 1;
}

function HintChoiceGrid({ hints, value, setValue, wordCount, disabled = false }) {
  return (
    <div className="choice-wrap">
      {[0, 1, 2].map((slot) => (
        <div className="choice-slot" key={slot}>
          <span className="choice-hint">{hints[slot]}</span>
          <GuessStepper
            value={Number(value[slot]) || slot + 1}
            min={1}
            max={wordCount}
            disabled={disabled}
            onChange={(nextNumber) => setValue(setSlot(value, slot, nextNumber))}
          />
        </div>
      ))}
    </div>
  );
}

function GuessStepper({ value, min, max, disabled, onChange }) {
  const current = clampNumber(value || min, min, max);
  return (
    <div className="guess-stepper">
      <button
        type="button"
        className="stepper-icon"
        disabled={disabled || current <= min}
        onClick={() => onChange(clampNumber(current - 1, min, max))}
        aria-label="Diminuir palpite"
      >
        <Minus size={18} />
      </button>
      <input tabIndex={-1} readOnly value={current} aria-label="Numero do palpite" />
      <button
        type="button"
        className="stepper-icon"
        disabled={disabled || current >= max}
        onClick={() => onChange(clampNumber(current + 1, min, max))}
        aria-label="Aumentar palpite"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function ConfirmationRoster({ players, confirmedBy }) {
  return (
    <div className="confirm-roster">
      {players.map((player) => {
        const confirmed = confirmedBy.includes(player.id);
        return (
          <div className={`confirm-person ${confirmed ? "confirmed" : ""}`} key={player.id}>
            <IconImg src={ICONS.confirmed} alt={confirmed ? "Confirmado" : "Nao confirmado"} className="confirm-icon" />
            <span><GuestDisplayName name={player.name} sessionTag={player.sessionTag} /></span>
          </div>
        );
      })}
    </div>
  );
}

function RoundResult({ room, playerId, constants, action }) {
  const results = room.current.result;
  const me = room.players.find((player) => player.id === playerId);
  const orderedTeams = me?.team ? [me.team, otherTeam(me.team)] : TEAMS;
  const revealed = useRoundResultRevealed(room);
  useAutoAdvanceRoundResult(room, playerId, action, me);
  return (
    <div className={`phase-card result-phase team-surface ${me?.team || ""} reveal`}>
      <p className="eyebrow"><Sparkles size={16} /> resultados</p>
      <div className="result-grid two">
        {orderedTeams.map((team, index) => (
          <ResultTeamTile
            key={team}
            team={team}
            results={results}
            constants={constants}
            viewerTeam={me?.team}
            fromSide={index === 0 ? "from-right" : "from-left"}
            round={room.round}
          />
        ))}
      </div>
      {revealed && <WaitingState label={roundResultNextLabel(room, me)} />}
    </div>
  );
}

function RingboundCreateRoomModal({ playerName, constants, onCancel, onCreate }) {
  const defaultName = `Sala de ${String(playerName || "Jogador").trim() || "Jogador"}`;
  const categories = constants?.categories?.length ? constants.categories : DEFAULT_CONSTANTS.RINGBOUND.categories;
  const [roomName, setRoomName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [publicRoom, setPublicRoom] = useState(true);
  const [wordCategory, setWordCategory] = useState(categories[0] || "Geral");
  const [ringCount, setRingCount] = useState(3);
  const [masterMode, setMasterMode] = useState("game");
  const valid = roomName.trim().length > 0;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal create-room-modal ringbound-modal">
        <strong>Criar sala Ringbound</strong>
        <label>Nome da sala
          <input value={roomName} maxLength={36} onChange={(event) => setRoomName(event.target.value)} placeholder={defaultName} />
        </label>
        <label>Categoria de cartas
          <RetroSelect value={wordCategory} onChange={setWordCategory} options={categories.map((category) => ({ value: category, label: category }))} />
        </label>
        <label>Quantidade de aneis
          <div className="segmented">
            {[1, 2, 3].map((count) => (
              <button key={count} className={ringCount === count ? "active" : ""} onClick={() => setRingCount(count)}>{count}</button>
            ))}
          </div>
        </label>
        <label>Mestre dos Aneis
          <div className="segmented">
            <button className={masterMode === "game" ? "active" : ""} onClick={() => setMasterMode("game")}>Controlado pelo jogo</button>
            <button className={masterMode === "player" ? "active" : ""} onClick={() => setMasterMode("player")}>Um jogador da sala</button>
          </div>
        </label>
        <label>Senha
          <PasswordField
            value={publicRoom ? password : ""}
            maxLength={32}
            disabled={!publicRoom}
            show={showPassword}
            setShow={setShowPassword}
            onChange={setPassword}
            placeholder={publicRoom ? "Opcional" : "Desativada em sala privada"}
          />
        </label>
        <div className="setting-toggle-row">
          <div className="setting-toggle-copy">
            <span className="setting-toggle-icon"><RadioTower size={18} /></span>
            <strong>{publicRoom ? "Sala publica" : "Sala privada"}</strong>
          </div>
          <button className={`toggle-switch ${publicRoom ? "on" : ""}`} onClick={() => setPublicRoom(!publicRoom)} aria-label="Alternar sala publica">
            <span />
          </button>
        </div>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button
            className="primary"
            disabled={!valid}
            onClick={() => onCreate({ roomName: roomName.trim(), password: publicRoom ? password.trim() : "", publicRoom, wordCategory, ringCount, masterMode })}
          >
            <Play size={18} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamScoreCard({ room, team, constants }) {
  const score = room.teams[team]?.score || { lives: 0, interceptions: 0 };
  return (
    <div className={`score spectator-team-score team-surface ${team}`}>
      <small>
        <IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{startingLivesLimit(room, constants)}
        <IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{winInterceptLimit(room, constants)}
      </small>
    </div>
  );
}

function useRoundResultRevealed(room) {
  const [revealed, setRevealed] = useState(room.phase !== "roundResult");
  useEffect(() => {
    if (room.phase !== "roundResult") {
      setRevealed(true);
      return undefined;
    }
    setRevealed(false);
    const timer = window.setTimeout(() => setRevealed(true), room.round === 1 ? 4300 : 9300);
    return () => window.clearTimeout(timer);
  }, [room.phase, room.current?.id, room.round]);
  return revealed;
}

function roundResultNextLabel(room, me) {
  if (me?.spectator) return "Acompanhando...";
  if (room.current?.nextPhase === "gameOver") return "Fim da partida em instantes...";
  if (room.current?.nextPhase === "tiebreaker") return "Desempate em instantes...";
  return "Proxima rodada em instantes...";
}

function useAutoAdvanceRoundResult(room, playerId, action, me) {
  useEffect(() => {
    if (room.phase !== "roundResult" || me?.spectator || room.blocked) return undefined;
    const timer = window.setTimeout(() => {
      action("game:confirmResult");
    }, 16000);
    return () => window.clearTimeout(timer);
  }, [room.phase, room.current?.id, room.blocked, me?.spectator, playerId]);
}

function ResultTeamTile({ team, results, constants, viewerTeam, fromSide, round }) {
  const ownResult = results[team];
  const rivalResult = results[otherTeam(team)];
  useResultSounds(ownResult, team, viewerTeam);
  const firstRound = round === 1;
  const decryptDelay = firstRound ? 0.4 : 5.5;
  const decryptStatusDelay = firstRound ? 3.4 : 8.5;
  const correctDelay = firstRound ? 3.9 : 9;
  return (
    <div className={`result-tile team-surface ${team}`} key={team}>
      <span>{constants.TEAM_NAMES[team]}</span>
      <div className="result-code-list">
        {!firstRound && (
          <AnimatedInterceptLine
            outgoingValues={rivalResult.interceptGuess}
            incomingValues={ownResult.interceptGuess}
            outgoingTeam={team}
            incomingTeam={otherTeam(team)}
            status={ownResult.intercepted}
            revealDelay={0.2}
            fromSide={fromSide}
          />
        )}
        {ownResult.decryptionSkipped ? (
          <div className="result-code-line skipped decrypt-reveal" style={{ "--reveal-delay": `${decryptDelay}s` }}>
            <strong>Descriptografia ignorada</strong>
          </div>
        ) : (
          <CodeLine
            values={ownResult.teamGuess}
            tone={team}
            status={ownResult.teamCorrect}
            className="decrypt-reveal"
            revealDelay={decryptDelay}
            statusDelay={decryptStatusDelay}
            reading
          />
        )}
        <CodeLine values={ownResult.code} tone="correct" className="correct-reveal" revealDelay={correctDelay} />
      </div>
    </div>
  );
}

function AnimatedInterceptLine({ outgoingValues, incomingValues, outgoingTeam, incomingTeam, status, revealDelay = 0, fromSide }) {
  const [phase, setPhase] = useState("pending");

  useEffect(() => {
    setPhase("pending");
    const baseDelay = revealDelay * 1000;
    const timers = [
      window.setTimeout(() => setPhase("hold"), baseDelay),
      window.setTimeout(() => setPhase("exit"), baseDelay + 1000),
      window.setTimeout(() => setPhase("enter"), baseDelay + 1550)
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [outgoingValues?.join("-"), incomingValues?.join("-"), revealDelay]);

  if (phase === "pending") {
    return <div className="result-code-line intercept-placeholder" aria-hidden="true"><strong>&nbsp;</strong></div>;
  }

  const incoming = phase === "enter";
  return (
    <CodeLine
      key={phase}
      values={incoming ? incomingValues : outgoingValues}
      tone={incoming ? incomingTeam : outgoingTeam}
      status={incoming ? status : undefined}
      className={`intercept-transfer ${fromSide} ${phase}`}
      statusDelay={incoming ? 3 : 0}
      reading={incoming}
    />
  );
}

function Tiebreaker({ room, playerId, constants, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const entry = room.tiebreaker?.[me?.team];
  const target = entry?.targetTeam;
  const [draft, setDraft] = useState(entry?.guess || []);
  const options = tiebreakerWordOptions(room, constants);
  const duplicates = duplicateWords(draft);
  const hasDuplicate = duplicates.size > 0;

  useEffect(() => {
    setDraft(entry?.guess || []);
  }, [entry?.guess?.join("|")]);

  if (!entry) return null;
  return (
    <div className="phase-card reveal">
      <p className="eyebrow"><Sparkles size={16} /> desempate final</p>
      <h1>Adivinhe as palavras do {constants.TEAM_NAMES[target]}.</h1>
      <div className="word-guess-grid">
        {Array.from({ length: room.settings.wordCount }, (_, index) => (
          <SearchableWordSelect
            key={index}
            value={draft[index] || ""}
            options={options}
            category={room.settings.category}
            placeholder={`Palavra #${index + 1}`}
            duplicate={duplicates.has(normalizeWordText(draft[index] || ""))}
            onChange={(value) => {
              const next = [...draft];
              next[index] = value;
              setDraft(next);
              action("game:updateTiebreaker", { words: next });
            }}
          />
        ))}
      </div>
      {hasDuplicate && <p className="toast">Nao repita o mesmo personagem em mais de um campo.</p>}
      <ConfirmationRoster players={room.players.filter((player) => player.team === me.team && player.connected)} confirmedBy={entry.confirmedBy || []} />
      <button className="primary" disabled={hasDuplicate} onClick={() => action("game:confirmTiebreaker")}><BadgeCheck size={18} /> Confirmar palavras</button>
    </div>
  );
}

function GameOver({ room, playerId, constants, winner, action }) {
  const confirmed = room.final?.confirmedBy || [];
  const me = room.players.find((player) => player.id === playerId);
  const voters = room.players.filter((player) => player.connected && !player.spectator);
  useFinalSounds(room, winner, playerId);
  const isDraw = !winner;
  return (
    <div className={`phase-card reveal team-surface ${winner || me?.team || ""}`}>
      <p className="eyebrow"><IconImg src={ICONS.leader} alt="Vencedor" className="status-icon" /> fim de jogo</p>
      <h1>{isDraw ? "Empate." : `${constants.TEAM_NAMES[winner]} venceu.`}</h1>
      <div className="result-grid two">
        {TEAMS.map((team) => (
          <FinalScoreTile key={team} team={team} room={room} constants={constants} winner={winner} />
        ))}
      </div>
      <FinalWords room={room} constants={constants} canRefreshImages />
      <ConfirmationRoster players={voters} confirmedBy={confirmed} />
      {me?.spectator ? <p className="small">Espectadores aguardam os jogadores voltarem ao lobby.</p> : (
        <button className="primary" disabled={confirmed.includes(playerId)} onClick={() => action("game:confirmFinal")}><Play size={18} /> Voltar ao lobby</button>
      )}
    </div>
  );
}

function ScoreBoard({ room, constants, playerId, ordered = false, revealScores = true }) {
  const me = room.players.find((player) => player.id === playerId);
  const teams = ordered && me?.team ? [me.team, otherTeam(me.team)] : TEAMS;
  return (
    <div className="scoreboard">
      {teams.map((team) => {
        const score = revealScores ? room.teams[team].score : previousRoundScore(room, team, constants);
        return (
          <div className={`score team-surface ${team}`} key={team}>
            <span>{constants.TEAM_NAMES[team]}</span>
            <small>
              <IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{startingLivesLimit(room, constants)}
              <IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{winInterceptLimit(room, constants)}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function RoundCounter({ room, constants, compact = false }) {
  return (
    <div className={`round-counter ${compact ? "compact" : ""}`}>
      <span>Rodada</span>
      <strong>{room.round}/{constants.MAX_ROUNDS}</strong>
    </div>
  );
}

function WordsPanel({ team, words, category, imageMap, canRefreshImages = false }) {
  return (
    <div className={`words-panel team-surface ${team || ""}`}>
      {words.map((word, index) => (
        <div className="word-card" key={`${category}-${word}-${index}`}>
          <WordImage word={word} index={index} category={category} imageUrl={imageUrlForWord(imageMap, word, category)} canRefresh={canRefreshImages} />
          <div>
            <strong><span className="word-number">#{index + 1} </span><WordName word={word} category={category} /></strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function WordImage({ word, index, category, imageUrl = undefined, canRefresh = false }) {
  const seed = Array.from(word).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 23;
  const [failed, setFailed] = useState(word === "CRIPTOGRAFADA");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  const [reportedBroken, setReportedBroken] = useState("");
  const rawUrl = imageUrl !== undefined ? imageUrl : category === "Pokemon" ? pokemonDbImageUrl(word) : remoteUrl;
  const url = normalizeImageUrl(rawUrl);
  const displayedUrl = imageRetry ? `${url}${url.includes("?") ? "&" : "?"}retry=${imageRetry}` : url;
  const waitingForServerImage = imageUrl !== undefined && !imageUrl && word !== "CRIPTOGRAFADA";

  useEffect(() => {
    setImageRetry(0);
    setReportedBroken("");
    if (imageUrl !== undefined) {
      setRemoteUrl(imageUrl || "");
      setFailed(word === "CRIPTOGRAFADA");
      return undefined;
    }
    if (category === "Pokemon" || word === "CRIPTOGRAFADA") return;
    let active = true;
    const cacheKey = imageCacheKey(word, category);
    if (wordImageCache.has(cacheKey)) {
      const cachedUrl = wordImageCache.get(cacheKey);
      setRemoteUrl(cachedUrl || "");
      setFailed(!cachedUrl);
      return undefined;
    }
    setFailed(false);
    setRemoteUrl("");
    const controller = new AbortController();
    const query = imageSearchQuery(word, category);
    fetch(`${apiBaseUrl}/api/image?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category || "")}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        if (data?.url) {
          wordImageCache.set(cacheKey, data.url);
          setRemoteUrl(data.url);
        } else {
          wordImageCache.set(cacheKey, "");
          setFailed(true);
        }
      })
      .catch(() => {
        if (active) {
          wordImageCache.set(cacheKey, "");
          setFailed(true);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [word, category, imageUrl]);

  if (word === "CRIPTOGRAFADA") return <div className="mock-image" style={{ "--hue": seed % 360 }} aria-label={`Imagem relacionada a ${word}`}>{word.slice(0, 2).toUpperCase()}</div>;
  if (waitingForServerImage || failed || !url) {
    return (
      <div className="word-image-loading" aria-label={`Buscando imagem relacionada a ${word}`}>
        <span className="waiting-spinner" aria-hidden="true" />
      </div>
    );
  }
  return (
    <>
      <button className="word-image-button" type="button" onClick={() => setExpanded(true)} aria-label={`Ampliar imagem relacionada a ${word}`}>
        <img className="word-image" src={displayedUrl} alt={`Imagem relacionada a ${word}`} loading="lazy" onError={() => {
          if (imageRetry < 2) setImageRetry((retry) => retry + 1);
          else {
            setFailed(true);
            if (reportedBroken !== url) {
              setReportedBroken(url);
              socket.emit("image:broken", { word, category, url: rawUrl }, (reply) => {
                if (reply?.ok && !reply.invalidated) {
                  window.setTimeout(() => {
                    setReportedBroken("");
                    setFailed(false);
                    setImageRetry((retry) => retry + 1);
                  }, 900);
                }
              });
            }
          }
        }} />
      </button>
      {expanded && createPortal((
        <div className="image-zoom-overlay" role="presentation" onClick={() => setExpanded(false)}>
          <img className="image-zoom" src={displayedUrl} alt={`Imagem ampliada relacionada a ${word}`} onClick={(event) => event.stopPropagation()} />
          {canRefresh && (
            <button
              className="image-refresh-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                socket.emit("image:refresh", { word, category });
              }}
            >
              <RotateCcw size={18} /> Nova busca
            </button>
          )}
        </div>
      ), document.body)}
    </>
  );
}

function imageCacheKey(word, category) {
  return `${category || ""}:${encodeURIComponent(String(word || "").trim().toLowerCase())}`;
}

function DisabledInterceptState() {
  return (
    <div className="disabled-intercept-state" aria-live="polite">
      <strong>Interceptação bloqueada</strong>
      <span>Disponível a partir da segunda rodada.</span>
    </div>
  );
}

function previousRoundScore(room, team, constants) {
  const current = room.teams[team].score || {};
  const score = { correct: current.correct || 0, interceptions: current.interceptions || 0, lives: current.lives ?? startingLivesLimit(room, constants) };
  if (room.phase !== "roundResult" || !room.current?.result) return score;
  TEAMS.forEach((targetTeam) => {
    const result = room.current.result[targetTeam];
    if (!result) return;
    const rival = otherTeam(targetTeam);
    if (result.intercepted && rival === team) score.interceptions = Math.max(0, score.interceptions - 1);
    else if (targetTeam === team && result.teamCorrect) score.correct = Math.max(0, score.correct - 1);
    else if (targetTeam === team && result.teamCorrect === false) score.lives = Math.min(startingLivesLimit(room, constants), score.lives + 1);
  });
  return score;
}

function SearchableWordSelect({ value, options, category, placeholder, duplicate = false, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [menuRect, setMenuRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    function updateRect() {
      const rect = triggerRef.current?.getBoundingClientRect();
      const zoom = siteZoom();
      if (rect) setMenuRect({ left: rect.left / zoom, top: (rect.bottom + 6) / zoom, width: rect.width / zoom });
    }
    function close(event) {
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    updateRect();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  const normalized = stripAccents(query).trim().toLowerCase();
  const filtered = normalized
    ? uniqueWordOptions(options)
      .filter((word) => {
        const label = `${word} ${wordOrigin(word, category) || ""} ${(WORD_SEARCH_ALIASES[word] || []).join(" ")}`;
        return stripAccents(label).toLowerCase().includes(normalized);
      })
      .slice(0, 24)
    : [];

  return (
    <div className="search-select" ref={wrapRef}>
      <button ref={triggerRef} type="button" className={`search-select-trigger ${duplicate ? "duplicate" : ""}`} onClick={() => {
        setQuery("");
        setOpen(!open);
      }}>
        {value ? <WordName word={value} category={category} /> : <span className="muted-option">{placeholder}</span>}
      </button>
      {open && menuRect && createPortal(
        <div ref={menuRef} className="search-select-menu search-select-menu-portal" style={{ left: menuRect.left, top: menuRect.top, width: menuRect.width }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar palavra..."
            autoFocus
          />
          <div className="search-select-options">
            {!normalized ? <span className="empty-option">Digite para buscar.</span> : filtered.length ? filtered.map((word) => (
              <button
                type="button"
                key={word}
                className={word === value ? "selected" : ""}
                onClick={() => {
                  onChange(word);
                  setOpen(false);
                }}
              >
                <WordName word={word} category={category} />
              </button>
            )) : <span className="empty-option">Nenhuma palavra encontrada.</span>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function imageUrlForWord(imageMap, word, category) {
  if (!imageMap) return undefined;
  const key = imageCacheKey(word, category);
  if (!Object.prototype.hasOwnProperty.call(imageMap, key)) return "";
  return imageMap[key] || "";
}

function isBiscoitoUser(player) {
  return String(player?.username || "").toLowerCase() === "biscoito";
}

function normalizeImageUrl(url) {
  const value = String(url || "");
  if (value.startsWith("/api/")) return `${apiBaseUrl}${value}`;
  return value;
}

function WordName({ word, category }) {
  const origin = wordOrigin(word, category);
  return (
    <span className="word-name">
      <span>{word}</span>
      {origin && <small>({origin})</small>}
    </span>
  );
}

function wordOrigin(word, category) {
  if (!["Anime", "Jogos", "Geek"].includes(category)) return "";
  const cleanWord = String(word || "").trim();
  return IMAGE_ORIGIN[category]?.[cleanWord]
    || ORIGIN_FALLBACK[category]?.[cleanWord]
    || CHARACTER_ORIGIN_PATCH[category]?.[cleanWord]
    || COMPREHENSIVE_ORIGIN_PATCH[category]?.[cleanWord]
    || IMAGE_ORIGIN[category]?.[imageAlias(cleanWord)]
    || ORIGIN_FALLBACK[category]?.[imageAlias(cleanWord)]
    || CHARACTER_ORIGIN_PATCH[category]?.[imageAlias(cleanWord)]
    || COMPREHENSIVE_ORIGIN_PATCH[category]?.[imageAlias(cleanWord)]
    || originFromTaggedName(cleanWord, category)
    || "";
}

function originFromTaggedName(word, category) {
  if (category === "Geek") {
    for (const suffix of ["Star Wars", "Star Trek", "Marvel", "DC", "The Matrix"]) {
      if (word.endsWith(` ${suffix}`)) return suffix;
    }
  }
  if (category === "Jogos") {
    for (const suffix of ["Borderlands", "Left 4 Dead", "Silent Hill", "Final Fantasy", "Grand Theft Auto"]) {
      if (word.endsWith(` ${suffix}`)) return suffix;
    }
  }
  return "";
}

function tiebreakerWordOptions(room, constants) {
  if (room.settings.category === "Personalizada") return uniqueWordOptions(room.settings.customWords || []);
  return uniqueWordOptions(constants.WORD_BANKS?.[room.settings.category] || []);
}

function uniqueWordOptions(words = []) {
  const seen = new Set();
  return words.filter((word) => {
    const key = normalizeWordText(word);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function duplicateWords(values = []) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((word) => {
    const key = normalizeWordText(word);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  });
  return duplicates;
}

function HintsList({ hints }) {
  return <div className="hints-list">{hints.map((hint, index) => <div className="hint" key={index}>{hint}</div>)}</div>;
}

function ConfirmPanel({ room, playerId, constants }) {
  if (room.phase !== "playing") return <p className="small">Sem votacao em aberto.</p>;
  const me = room.players.find((player) => player.id === playerId);
  const rival = otherTeam(me?.team);
  const entries = TEAMS.flatMap((targetTeam) => ["team", "intercept"].map((kind) => {
    const turn = room.current?.turns?.[targetTeam];
    const proposal = turn?.proposals?.[kind];
    if (!proposal) return null;
    const votingTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
    if (votingTeam !== rival) return null;
    const voters = room.players.filter((player) => player.team === votingTeam && player.connected && (kind !== "team" || player.id !== turn?.coderId));
    return { targetTeam, kind, proposal, voters };
  })).filter(Boolean);
  if (!entries.length) return <p className="small">A equipe adversaria ainda nao iniciou uma confirmacao.</p>;
  return (
    <div className="confirm-list">
      {entries.map(({ targetTeam, kind, proposal, voters }) => (
          <div className={`confirm-box team-surface ${rival}`} key={`${targetTeam}-${kind}`}>
            <strong>{kind === "team" ? "Descriptografia" : "Interceptacao"}</strong>
            <ConfirmationRoster players={voters} confirmedBy={proposal.confirmedBy || []} />
          </div>
      ))}
    </div>
  );
}

function playerCardMarker(room, player) {
  const labels = [];
  if (room.current && room.current.turns?.[player.team]?.coderId === player.id) labels.push("Comunicador");
  const state = playerConfirmState(room, player);
  if (state === "both") labels.push("Descriptografia e interceptacao confirmadas");
  else if (state === "team") labels.push("Descriptografia confirmada");
  else if (state === "intercept" && room.round > 1) labels.push("Interceptacao confirmada");
  return labels.join(" • ");
}

function playerConfirmState(room, player) {
  if (room.phase !== "playing" || !room.current || !TEAMS.includes(player.team)) return "";
  const ownTurn = room.current.turns[player.team];
  const rivalTurn = room.current.turns[otherTeam(player.team)];
  const teamConfirmed = ownTurn?.proposals?.team?.confirmedBy?.includes(player.id) || false;
  const interceptConfirmed = room.round > 1 && (rivalTurn?.proposals?.intercept?.confirmedBy?.includes(player.id) || false);
  if (teamConfirmed && interceptConfirmed) return "both";
  if (teamConfirmed) return "team";
  if (interceptConfirmed) return "intercept";
  return "";
}

function HintHistory({ room, constants, playerId }) {
  const me = room.players.find((player) => player.id === playerId);
  return (
    <div className={`history-section team-surface ${me?.team || ""}`}>
      <h2><RadioTower size={20} /> Historico de dicas</h2>
      <div className="history-grid">
        {TEAMS.map((team) => (
          <div className={`hint-board team-surface ${team}`} key={team}>
            <strong>{constants.TEAM_NAMES[team]}</strong>
            <div className="hint-board-grid" style={{ "--cols": room.settings.wordCount }}>
              {Array.from({ length: room.settings.wordCount }, (_, column) => (
              <div className="hint-column" key={column}>
                <span>#{column + 1}</span>
                  {orderedHistory(room.teams[team].hintHistory).map((entry) => {
                    const hintIndex = entry.code.indexOf(column + 1);
                    return hintIndex >= 0 ? <p key={`${entry.round}-${column}`}>{entry.hints[hintIndex]}</p> : null;
                  })}
                </div>
            ))}
          </div>
          <div className="history-rounds">
            {orderedHistory(room.teams[team].hintHistory).map((entry) => (
              <div className={`history-round team-surface ${team}`} key={`codes-${team}-${entry.round}`}>
                <strong>Rodada {entry.round}</strong>
                <div className="round-code-list">
                  {[0, 1, 2].map((slot) => (
                    <div className="round-code-row" key={`${entry.round}-${slot}`}>
                      <span className="round-hint">{entry.hints[slot]}</span>
                      <span className={`code-chip ${team}`}>{entry.teamGuess?.[slot] || "?"}</span>
                      <span className={`code-chip ${otherTeam(team)}`}>{entry.interceptGuess?.[slot] || "?"}</span>
                      <span className="code-chip correct-code">{entry.code[slot] || "?"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}

function ResultTile({ label, value, good, team }) {
  return <div className={`result-tile team-surface ${team || ""} ${good ? "good" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function FinalScoreTile({ team, room, constants, winner }) {
  const score = room.teams[team].score;
  return (
    <div className={`result-tile final-score team-surface ${team} ${team === winner ? "good" : ""}`}>
      <span>{constants.TEAM_NAMES[team]}</span>
      <div className="final-score-row">
        <span><IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{startingLivesLimit(room, constants)}</span>
        <span><IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{winInterceptLimit(room, constants)}</span>
      </div>
    </div>
  );
}

function FinalWords({ room, constants, canRefreshImages = false }) {
  const hasTiebreaker = Boolean(room.tiebreaker && room.final?.reason === "desempate");
  return (
    <div className="final-words-grid">
      {TEAMS.map((team) => {
        const guesser = otherTeam(team);
        const guesses = room.tiebreaker?.[guesser]?.guess || [];
        return (
          <div className={`final-words team-surface ${team}`} key={`final-words-${team}`}>
            <strong>{constants.TEAM_NAMES[team]}</strong>
            <div className="final-word-list">
              {(room.teams[team].words || []).map((word, index) => {
                const guess = guesses[index] || "";
                const right = hasTiebreaker && normalizeWordText(guess) === normalizeWordText(word);
                return (
                  <div className="final-word-card" key={`${team}-${word}-${index}`}>
                    <WordImage word={word} index={index} category={room.settings.category} imageUrl={imageUrlForWord(room.imageMap, word, room.settings.category)} canRefresh={canRefreshImages} />
                    <div className="final-word-copy">
                      <span><span className="word-number">#{index + 1} </span><WordName word={word} category={room.settings.category} /></span>
                      {hasTiebreaker && (
                        <small className={right ? "guess-ok" : "guess-bad"}>
                          {guess || "sem palpite"} {right ? <Check size={15} /> : <X size={15} />}
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CodeLine({ values = [], tone, status, className = "", revealDelay = 0, statusDelay = 0, reading = false }) {
  return (
    <div className={`result-code-line ${tone} ${className}`} style={{ "--reveal-delay": `${revealDelay}s`, "--status-delay": `${statusDelay}s` }}>
      <strong>{displayGuess(values)}</strong>
      {reading && <span className="reading-indicator" aria-label="Lendo palpite" />}
      {typeof status === "boolean" && (
        <span className={status ? "result-mark ok" : "result-mark bad"} aria-label={status ? "correto" : "incorreto"}>
          {status ? <Check size={18} /> : <X size={18} />}
        </span>
      )}
    </div>
  );
}

function MatrixRain() {
  const columns = useRef(null);
  if (!columns.current) {
    const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    columns.current = Array.from({ length: 42 }, (_, index) => ({
      text: Array.from({ length: 22 + (index % 8) }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(""),
      flipped: index % 7 === 0 || index % 11 === 0,
      duration: `${4.2 + (index % 7) * 0.55}s`
    }));
  }
  return (
    <div className="matrix-bg" aria-hidden="true">
      {columns.current.map((column, i) => (
        <span
          className={column.flipped ? "flipped" : ""}
          key={i}
          style={{ "--i": i, "--d": column.duration }}
        >
          {column.text}
        </span>
      ))}
    </div>
  );
}

function IconImg({ src, alt, className = "" }) {
  return <img src={src} alt={alt} className={className} aria-hidden={alt === "" ? "true" : undefined} />;
}

function initials(name = "") {
  return String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Arquivo invalido."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        const sourceSize = Math.min(image.width, image.height);
        const sx = (image.width - sourceSize) / 2;
        const sy = (image.height - sourceSize) / 2;
        context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getWinner(room, constants) {
  if (room.final?.winner) return room.final.winner;
  if (room.phase === "gameOver" && room.final && !room.final.winner) return null;
  return TEAMS.find((team) => {
    const score = room.teams[team].score;
    const rival = room.teams[otherTeam(team)].score;
    return score.correct >= constants.WIN_CORRECT || score.interceptions >= winInterceptLimit(room, constants) || rival.lives <= 0;
  }) || null;
}

function setSlot(value, slot, number) {
  const next = [value[0], value[1], value[2]];
  next[slot] = number;
  return next;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function filledCount(values = []) {
  return values.filter(Boolean).length;
}

function isValidCode(values = []) {
  const filled = values.filter(Boolean);
  return filled.length === 3 && new Set(filled).size === 3;
}

function startingLivesLimit(room, constants) {
  return room.settings?.startingLives || constants.STARTING_LIVES;
}

function winInterceptLimit(room, constants) {
  return room.settings?.winIntercepts || constants.WIN_INTERCEPTS;
}

function displayGuess(values = []) {
  return filledCount(values) ? values.map((value) => value || "?").join("-") : "codigo";
}

function orderedHistory(history = []) {
  return [...history].sort((a, b) => a.round - b.round);
}

function pokemonDbImageUrl(word) {
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

function imageSearchQuery(word, category) {
  const cleanWord = String(word || "").trim();
  if (category === "Filmes") return movieTitleAlias(cleanWord);
  const alias = imageAlias(cleanWord);
  if (category === "Geral" || category === "Famosos") return alias;
  const origin = wordOrigin(alias, category) || wordOrigin(cleanWord, category);
  if (["Anime", "Jogos", "Geek"].includes(category) && origin) return `${alias} ${origin}`;
  const categoryHint = {
    Anime: "anime character",
    Filmes: "movie",
    Jogos: "video game character",
    Geek: "fictional character"
  }[category] || "";
  return `${alias} ${categoryHint}`.trim();
}

function imageAlias(word) {
  return IMAGE_ALIAS[word] || IMAGE_ALIAS[stripAccents(word)] || word;
}

function movieTitleAlias(word) {
  return MOVIE_TITLE_ALIAS[word] || MOVIE_TITLE_ALIAS[stripAccents(word)] || imageAlias(word);
}

function stripAccents(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function siteZoom() {
  const value = Number.parseFloat(window.getComputedStyle(document.body).zoom || "1");
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function guestName() {
  return "Jogador";
}

function filterRoomsByGame(rooms = [], gameId = "code-hack") {
  const expected = String(gameId || "code-hack").trim().toLowerCase();
  return (rooms || []).filter((room) => String(room.gameId || "code-hack").trim().toLowerCase() === expected);
}

function makeRoomClientId() {
  return `room:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
}

function getRoomClientId(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return makeRoomClientId();
  try {
    const cache = JSON.parse(localStorage.getItem("codehack:roomClientIds") || "{}");
    if (!cache[normalizedCode]) {
      cache[normalizedCode] = makeRoomClientId();
      localStorage.setItem("codehack:roomClientIds", JSON.stringify(cache));
    }
    return cache[normalizedCode];
  } catch {
    return makeRoomClientId();
  }
}

function splitGuestDisplayName(name) {
  const value = String(name || guestName()).trim() || guestName();
  if (/^Convidado(?:\s+[A-Z0-9]{3,8})?$/i.test(value)) return { name: guestName(), tag: "" };
  const match = value.match(/^(.*?)\s+(#[A-Z0-9]{4})$/i);
  if (!match) return { name: value, tag: "" };
  return { name: match[1] || guestName(), tag: match[2].toUpperCase() };
}

function rememberSession(room, payload = {}, clientId = getGhostClientId()) {
  try {
    const name = String(payload.name || "").trim();
    const savedName = payload.authToken ? name : splitGuestDisplayName(name).name;
    if (savedName) localStorage.setItem("decrypto:name", JSON.stringify(savedName));
    if (room?.code) localStorage.setItem("decrypto:lastRoomCode", JSON.stringify(room.code));
    if (room?.code && clientId) {
      const cache = JSON.parse(localStorage.getItem("codehack:roomClientIds") || "{}");
      cache[String(room.code).toUpperCase()] = clientId;
      localStorage.setItem("codehack:roomClientIds", JSON.stringify(cache));
    }
    if (room?.code && name) {
      sessionStorage.setItem("codehack:activeRoom", JSON.stringify({
        code: room.code,
        gameId: room.gameId || payload.gameId || "code-hack",
        name,
        clientId
      }));
    }
  } catch {
    // Local cache is a convenience only.
  }
}

function readActiveRoomSession() {
  try {
    return JSON.parse(sessionStorage.getItem("codehack:activeRoom") || "null");
  } catch {
    return null;
  }
}

function clearActiveRoomSession() {
  try {
    sessionStorage.removeItem("codehack:activeRoom");
  } catch {
    // Session cache is best-effort.
  }
}

function getGhostClientId() {
  try {
    const existing = localStorage.getItem("codehack:ghostClientId");
    if (existing) return existing;
    const generated = `ghost:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem("codehack:ghostClientId", generated);
    return generated;
  } catch {
    return `ghost:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
  }
}

function normalizeWordText(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function playConfirmCue() {
  try {
    if (isSoundMuted()) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    gain.connect(context.destination);
    [740, 980].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + 0.12 + index * 0.08);
    });
    window.setTimeout(() => context.close(), 360);
  } catch {
    // Audio feedback is optional; the visual confirmation remains.
  }
}

function useGameSounds(room, playerId) {
  const previousSignature = useRef("");
  useEffect(() => {
    if (!room || !playerId) return;
    const entries = collectConfirmationEntries(room);
    const signature = entries.map((entry) => `${entry.key}:${entry.count}`).join("|");
    if (previousSignature.current) {
      const previous = new Map(previousSignature.current.split("|").filter(Boolean).map((part) => {
        const [key, count] = part.split(":");
        return [key, Number(count)];
      }));
      if (entries.some((entry) => entry.count > (previous.get(entry.key) || 0))) {
        playTone("ready");
      }
    }
    previousSignature.current = signature;
  }, [room, playerId]);
}

function collectConfirmationEntries(room) {
  const entries = [];
  if (room.phase === "playing" && room.current?.turns) {
    TEAMS.forEach((team) => {
      ["team", "intercept"].forEach((kind) => {
        const proposal = room.current?.turns?.[team]?.proposals?.[kind];
        entries.push({ key: `play-${team}-${kind}`, count: proposal?.confirmedBy?.length || 0 });
      });
    });
  }
  if (room.phase === "roundResult") {
    entries.push({ key: "round-result", count: room.current?.resultConfirmedBy?.length || 0 });
  }
  if (room.phase === "tiebreaker" && room.tiebreaker) {
    TEAMS.forEach((team) => entries.push({ key: `tie-${team}`, count: room.tiebreaker[team]?.confirmedBy?.length || 0 }));
  }
  if (room.phase === "gameOver") {
    entries.push({ key: "final", count: room.final?.confirmedBy?.length || 0 });
  }
  return entries;
}

function useResultSounds(result, team, viewerTeam) {
  const playedKey = useRef("");
  useEffect(() => {
    if (!result || team !== viewerTeam) return;
    const key = `${team}-${result.intercepted}-${result.teamCorrect}-${result.code.join("-")}`;
    if (playedKey.current === key) return;
    playedKey.current = key;
    const hasIntercept = Boolean(result.interceptGuess?.length);
    if (hasIntercept) window.setTimeout(() => playTone(result.intercepted ? "intercepted" : "notIntercepted"), 5000);
    if (!result.intercepted) window.setTimeout(() => playTone(result.teamCorrect ? "decryptOk" : "decryptBad"), hasIntercept ? 8500 : 3400);
  }, [result, team, viewerTeam]);
}

function useFinalSounds(room, winner, playerId) {
  const playedKey = useRef("");
  useEffect(() => {
    if (room.phase !== "gameOver" || !winner) return;
    const me = room.players.find((player) => player.id === playerId);
    const key = `${room.final?.reason}-${winner}-${me?.team}`;
    if (playedKey.current === key) return;
    playedKey.current = key;
    playTone(me?.team === winner ? "win" : "lose");
  }, [room, winner, playerId]);
}

function playTone(kind) {
  try {
    if (isSoundMuted()) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const recipes = {
      ready: { volume: 0.025, type: "sine", notes: [[660, 0, 0.07]] },
      intercepted: { volume: 0.1, type: "square", notes: [[190, 0, 0.16], [140, 0.12, 0.2]] },
      notIntercepted: { volume: 0.07, type: "triangle", notes: [[420, 0, 0.12], [560, 0.1, 0.14]] },
      decryptOk: { volume: 0.09, type: "square", notes: [[620, 0, 0.1], [820, 0.1, 0.14]] },
      decryptBad: { volume: 0.08, type: "sawtooth", notes: [[260, 0, 0.12], [210, 0.1, 0.16]] },
      win: { volume: 0.1, type: "square", notes: [[520, 0, 0.12], [680, 0.1, 0.12], [920, 0.2, 0.2]] },
      lose: { volume: 0.08, type: "triangle", notes: [[320, 0, 0.18], [240, 0.15, 0.22]] }
    };
    const recipe = recipes[kind] || recipes.ready;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(recipe.volume, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55);
    gain.connect(context.destination);
    recipe.notes.forEach(([frequency, start, duration]) => {
      const oscillator = context.createOscillator();
      oscillator.type = recipe.type;
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration);
    });
    window.setTimeout(() => context.close(), 800);
  } catch {
    // Sound is a flourish; gameplay and visual feedback continue without it.
  }
}

function isSoundMuted() {
  try {
    return JSON.parse(localStorage.getItem("codehack:soundMuted") || "false") === true;
  } catch {
    return false;
  }
}

function otherTeam(team) {
  return team === "red" ? "blue" : "red";
}

function isSpectatorPlayer(player, room) {
  return Boolean(player && room?.phase !== "lobby" && (player.spectator || !TEAMS.includes(player.team)));
}

function teamLabel(team) {
  if (team === null) return "Espectadores";
  return team === "red" ? "Time Vermelho" : "Time Azul";
}

function teamEventName(team) {
  if (team === "red") return "Time Vermelho";
  if (team === "blue") return "Time Azul";
  return "Espectadores";
}

function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

createRoot(document.getElementById("root")).render(<App />);


