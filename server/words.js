const GENERAL_SIMPLE = [
  "Casa", "Rua", "Porta", "Mesa", "Cadeira", "Cama", "Sofa", "Janela", "Parede", "Chao",
  "Teto", "Tapete", "Prato", "Copo", "Garrafa", "Colher", "Faca", "Garfo", "Panela", "Fogao",
  "Geladeira", "Pia", "Banho", "Sabao", "Toalha", "Escova", "Pente", "Camisa", "Calca", "Vestido",
  "Sapato", "Meia", "Chapeu", "Bolsa", "Mochila", "Carteira", "Chave", "Moeda", "Nota", "Livro",
  "Caderno", "Caneta", "Lapis", "Borracha", "Papel", "Carta", "Caixa", "Sacola", "Presente", "Relogio",
  "Telefone", "Radio", "Camera", "Tela", "Teclado", "Mouse", "Cabo", "Lampada", "Vela", "Fogo",
  "Agua", "Gelo", "Chuva", "Nuvem", "Sol", "Lua", "Estrela", "Ceu", "Mar", "Rio",
  "Lago", "Praia", "Areia", "Pedra", "Terra", "Barro", "Grama", "Folha", "Flor", "Arvore",
  "Galho", "Raiz", "Fruta", "Banana", "Maca", "Pera", "Uva", "Laranja", "Limao", "Manga",
  "Melancia", "Abacaxi", "Morango", "Coco", "Tomate", "Batata", "Cenoura", "Milho", "Arroz", "Feijao",
  "Macarrao", "Pao", "Queijo", "Leite", "Cafe", "Cha", "Suco", "Bolo", "Doce", "Mel",
  "Sal", "Acucar", "Ovo", "Carne", "Peixe", "Frango", "Sopa", "Pizza", "Sorvete", "Biscoito",
  "Cachorro", "Gato", "Passaro", "Peixe", "Cavalo", "Vaca", "Porco", "Ovelha", "Cabra", "Pato",
  "Galinha", "Coelho", "Rato", "Sapo", "Cobra", "Tartaruga", "Leao", "Tigre", "Urso", "Macaco",
  "Elefante", "Girafa", "Zebra", "Lobo", "Raposa", "Baleia", "Golfinho", "Tubarao", "Formiga", "Abelha",
  "Mosca", "Borboleta", "Aranha", "Carro", "Onibus", "Trem", "Aviao", "Barco", "Navio", "Bicicleta",
  "Moto", "Roda", "Pneu", "Volante", "Freio", "Motor", "Posto", "Ponte", "Tunel", "Estrada",
  "Escola", "Hospital", "Mercado", "Banco", "Padaria", "Farmacia", "Igreja", "Praca", "Parque", "Cinema",
  "Teatro", "Museu", "Loja", "Hotel", "Restaurante", "Cozinha", "Quarto", "Sala", "Banheiro", "Garagem",
  "Jardim", "Piscina", "Portao", "Elevador", "Escada", "Bola", "Boneca", "Carrinho", "Jogo", "Dado",
  "Carta", "Pipa", "Tambor", "Violao", "Piano", "Flauta", "Apito", "Musica", "Danca", "Festa",
  "Time", "Gol", "Rede", "Campo", "Quadra", "Praia", "Onda", "Vento", "Neve", "Montanha",
  "Vale", "Ilha", "Floresta", "Deserto", "Caverna", "Vulcao", "Mapa", "Bussola", "Mala", "Viagem",
  "Cidade", "Aldeia", "Fazenda", "Povo", "Pessoa", "Homem", "Mulher", "Crianca", "Bebe", "Amigo",
  "Familia", "Mae", "Pai", "Irmao", "Avo", "Vizinho", "Doutor", "Professor", "Aluno", "Motorista",
  "Cozinheiro", "Pintor", "Cantor", "Juiz", "Policia", "Bombeiro", "Rei", "Rainha", "Principe", "Princesa",
  "Coroa", "Espada", "Escudo", "Martelo", "Prego", "Serra", "Tesoura", "Cola", "Tinta", "Pincel",
  "Linha", "Agulha", "Botao", "Espelho", "Penteado", "Rosto", "Olho", "Nariz", "Boca", "Dente",
  "Orelha", "Mao", "Dedo", "Braco", "Perna", "Pe", "Cabeca", "Cabelo", "Corpo", "Sorriso",
  "Riso", "Choro", "Sono", "Sonho", "Medo", "Raiva", "Alegria", "Dor", "Forca", "Calor",
  "Frio", "Claro", "Escuro", "Grande", "Pequeno", "Alto", "Baixo", "Novo", "Velho", "Rapido",
  "Lento", "Limpo", "Sujo", "Cheio", "Vazio", "Doce", "Salgado", "Quente", "Gelado", "Macio",
  "Duro", "Leve", "Pesado", "Aberto", "Fechado", "Longe", "Perto", "Cima", "Baixo", "Meio",
  "Inicio", "Fim", "Ontem", "Hoje", "Amanha", "Manha", "Tarde", "Noite", "Hora", "Minuto",
  "Semana", "Mes", "Ano", "Numero", "Letra", "Nome", "Voz", "Som", "Barulho", "Silencio",
  "Cor", "Vermelho", "Azul", "Verde", "Amarelo", "Preto", "Branco", "Rosa", "Roxo", "Cinza",
  "Ouro", "Prata", "Vidro", "Madeira", "Ferro", "Plastico", "Pano", "Couro", "Borracha", "Corda",
  "Balde", "Vassoura", "Esponja", "Lixo", "Cesto", "Remedio", "Curativo", "Planta", "Semente", "Horta",
  "Chapeu", "Guarda chuva", "Travesseiro", "Cobertor", "Cortina", "Almofada", "Mesa", "Banco", "Estante", "Prateleira"
];

const ANIME_BASE = [
  "Ninja", "Samurai", "Sensei", "Mecha", "Shinigami", "Alquimista", "Pirata", "Tita", "Demonio", "Espadachim",
  "Dragao", "Chakra", "Ki", "Dojo", "Mangaka", "Idol", "Bento", "Mascote", "Torneio", "Isekai",
  "Kamehameha", "Bankai", "Sharingan", "Rasengan", "Akira", "Totoro", "Goku", "Naruto", "Luffy", "Sailor Moon",
  "Evangelion", "Gundam", "Deku", "Tanjiro", "Nezuko", "Saitama", "Sakura", "Kenshin", "Asuka", "Eren",
  "Mikasa", "Levi", "Vegeta", "Bulma", "Hinata", "Itachi", "Killua", "Gon", "Edward", "Alphonse",
  "Ryuk", "Light", "Spike", "Faye", "Usagi", "Inuyasha", "Kagome", "Yusuke", "Kurama", "Hiei"
];

const MOVIE_BASE = [
  "Matrix", "Titanic", "Avatar", "Alien", "Rocky", "Batman", "Joker", "Gladiador", "Inception", "Tubarão",
  "Jurassic Park", "Star Wars", "Indiana Jones", "Harry Potter", "Senhor dos Aneis", "Vingadores", "Homem Aranha", "Superman", "Godzilla", "King Kong",
  "Poderoso Chefao", "Forrest Gump", "E.T.", "De Volta para o Futuro", "Toy Story", "Shrek", "Frozen", "Procurando Nemo", "Rei Leao", "Coringa",
  "Pantera Negra", "Duna", "Mad Max", "Exterminador", "Predador", "Rambo", "Karate Kid", "Top Gun", "Missao Impossivel", "007",
  "Psicose", "O Iluminado", "It", "Gremlins", "Ghostbusters", "MIB", "Blade Runner", "Tron", "Wall-E", "Up",
  "Ratatouille", "Moana", "Aladdin", "Mulan", "Cinderela", "Pinocchio", "Mary Poppins", "La La Land", "Whiplash", "Parasita"
];

const GAME_BASE = [
  "Mario", "Luigi", "Zelda", "Link", "Sonic", "Pac-Man", "Tetris", "Minecraft", "Fortnite", "Roblox",
  "Pokemon", "Pikachu", "Street Fighter", "Ryu", "Ken", "Mortal Kombat", "Sub-Zero", "Scorpion", "Donkey Kong", "Kirby",
  "Mega Man", "Metroid", "Samus", "Final Fantasy", "Cloud", "Sephiroth", "Kingdom Hearts", "Sora", "Crash", "Spyro",
  "Halo", "Master Chief", "Doom", "Doomguy", "Portal", "GLaDOS", "Half-Life", "Gordon Freeman", "The Sims", "SimCity",
  "GTA", "Red Dead", "Kratos", "God of War", "Uncharted", "Nathan Drake", "Lara Croft", "Tomb Raider", "Resident Evil", "Leon",
  "League of Legends", "Minecraft Creeper", "Among Us", "Fall Guys", "Overwatch", "Tracer", "D.Va", "Valorant", "Counter Strike", "Elden Ring"
];

const ANIME_CHARACTER_BANK = cleanLines(`
Goku
Vegeta
Gohan
Piccolo
Bulma
Freeza
Cell
Majin Boo
Kuririn
Trunks
Naruto
Sasuke
Sakura
Kakashi
Hinata
Itachi
Madara
Jiraiya
Gaara
Rock Lee
Luffy
Zoro
Nami
Sanji
Usopp
Chopper
Robin
Franky
Brook
Shanks
Ichigo
Rukia
Orihime
Uryu
Renji
Byakuya
Aizen
Kenpachi
Hitsugaya
Yoruichi
Saitama
Genos
Tatsumaki
King
Mumen Rider
Garou
Deku
Bakugo
Uraraka
Todoroki
All Might
Shigaraki
Tanjiro
Nezuko
Zenitsu
Inosuke
Giyu
Rengoku
Muzan
Shinobu
Eren
Mikasa
Armin
Levi
Erwin
Hange
Reiner
Annie
Light
L
Ryuk
Misa
Near
Mello
Edward Elric
Alphonse Elric
Winry
Mustang
Scar
Armstrong
Gon
Killua
Kurapika
Leorio
Hisoka
Meruem
Netero
Yusuke
Kuwabara
Kurama
Hiei
Inuyasha
Kagome
Sesshomaru
Kikyo
Miroku
Sango
Usagi
Ami
Rei
Makoto
Minako
Mamoru
Shinji
Rei Ayanami
Asuka
Misato
Kaworu
Spike Spiegel
Faye Valentine
Jet Black
Vicious
Kaneda
Tetsuo
Totoro
Ashitaka
San
Chihiro
Haku
Howl
Sophie
Kiki
Ponyo
Kenshin
Kaoru
Sanosuke
Makoto Shishio
Senku
Tsukasa
Soma Yukihira
Erina Nakiri
Rimuru
Subaru
Rem
Emilia
Kirito
Asuna
Yuji Itadori
Megumi
Nobara
Gojo
Sukuna
Yuta
Denji
Power
Makima
Aki
Anya Forger
Loid Forger
Yor Forger
Vash
Motoko Kusanagi
Lelouch
Suzaku
Gintoki
Kagura
Mob
Reigen
Thorfinn
Askeladd
Boji
Kage
`);

const MOVIE_TITLE_BANK = cleanLines(`
Matrix
Titanic
Avatar
Alien
Rocky
Batman
Joker
Gladiador
Inception
Tubarao
Jurassic Park
Star Wars
Indiana Jones
Harry Potter
Senhor dos Aneis
Vingadores
Homem Aranha
Superman
Godzilla
King Kong
Poderoso Chefao
Forrest Gump
E.T.
De Volta para o Futuro
Toy Story
Shrek
Frozen
Procurando Nemo
Rei Leao
Coringa
Pantera Negra
Duna
Mad Max
Exterminador
Predador
Rambo
Karate Kid
Top Gun
Missao Impossivel
007
Psicose
O Iluminado
It
Ghostbusters
MIB
Blade Runner
Tron
Wall-E
Up
Ratatouille
Moana
Aladdin
Mulan
Cinderela
Pinocchio
Mary Poppins
La La Land
Whiplash
Parasita
Interestelar
Gravidade
Perdido em Marte
Oppenheimer
Barbie
Clube da Luta
Pulp Fiction
Kill Bill
Django Livre
Bastardos Inglorios
Os Bons Companheiros
Scarface
Taxi Driver
Cidade de Deus
Tropa de Elite
Central do Brasil
Auto da Compadecida
Labirinto do Fauno
Amelie
Cinema Paradiso
Como Treinar o seu Dragao
Kung Fu Panda
Madagascar
Era do Gelo
Monstros S.A.
Os Incriveis
Divertida Mente
Viva
Soul
Luca
Valente
Carros
Raya
Encanto
Enrolados
Detona Ralph
Zootopia
Lilo e Stitch
Tarzan
Hercules
Bela e a Fera
Pequena Sereia
Branca de Neve
Alice no Pais das Maravilhas
Peter Pan
Dumbo
Bambi
Fantasia
Planeta dos Macacos
Silencio dos Inocentes
Seven
Garota Exemplar
Sexto Sentido
Fragmentado
Corra
Nos
Hereditario
Midsommar
Invocacao do Mal
Annabelle
Atividade Paranormal
Halloween
Sexta Feira 13
Pesadelo
Panico
Jogos Mortais
O Chamado
A Bruxa
O Exorcista
Dracula
Frankenstein
Casablanca
Cidadao Kane
Cantando na Chuva
Magico de Oz
E o Vento Levou
Ben Hur
Lawrence da Arabia
Apocalypse Now
Platoon
Nascido para Matar
Resgate do Soldado Ryan
Coracao Valente
`);

const GAME_CHARACTER_BANK = cleanLines(`
Mario
Luigi
Peach
Bowser
Yoshi
Toad
Wario
Donkey Kong
Diddy Kong
Link
Zelda
Ganondorf
Impa
Midna
Sonic
Tails
Knuckles
Amy Rose
Dr Eggman
Shadow
Pac-Man
Kirby
Meta Knight
King Dedede
Samus
Ridley
Mega Man
Dr Wily
Zero
Ryu
Ken
Chun-Li
Guile
Cammy
M Bison
Akuma
Sub-Zero
Scorpion
Raiden
Liu Kang
Kitana
Johnny Cage
Cloud
Sephiroth
Tifa
Aerith
Squall
Lightning
Noctis
Sora
Riku
Kairi
Crash
Coco
Neo Cortex
Spyro
Master Chief
Cortana
Arbiter
Doomguy
Gordon Freeman
GLaDOS
Chell
Alyx Vance
Kratos
Atreus
Nathan Drake
Elena Fisher
Sully
Lara Croft
Leon Kennedy
Jill Valentine
Chris Redfield
Claire Redfield
Ada Wong
Albert Wesker
Nemesis
Solid Snake
Big Boss
Pyramid Head
James Sunderland
Geralt
Ciri
Yennefer
Triss
Arthur Morgan
John Marston
Dutch
Trevor
CJ
Tommy Vercetti
Niko Bellic
Franklin
Michael De Santa
Ezio
Altair
Bayek
Kassandra
Eivor
Agent 47
Max Payne
Alan Wake
Marcus Fenix
Cole Train
Joel
Ellie
Abby
Sackboy
Ratchet
Clank
Jak
Daxter
Sly Cooper
Banjo
Kazooie
Conker
Fox McCloud
Captain Falcon
Ness
Lucas
Marth
Ike
Pit
Palutena
Villager
Isabelle
Inkling
Steve
Alex
Creeper
Enderman
Sans
Papyrus
Frisk
Cuphead
Mugman
Freddy Fazbear
Tracer
Mercy
Reaper
Genji
Hanzo
D.Va
Winston
Jinx
Vi
Ahri
Yasuo
Lux
Teemo
Ekko
Ashe
Raze
Jett
Phoenix
Sage
Viper
Reyna
Octane
Wraith
Bloodhound
Pathfinder
Ryu Hayabusa
Kazuya
Jin Kazama
Heihachi
Lili
King
Kazuma Kiryu
Goro Majima
Ichiban Kasuga
2B
9S
Aloy
Senua
Corvo Attano
Emily Kaldwin
Booker DeWitt
Elizabeth
Big Daddy
Isaac Clarke
Commander Shepard
Liara
Garrus
Tali
Morrigan
Varric
Solas
`);

const GEEK_BANK = cleanLines(`
Batman
Superman
Mulher Maravilha
Flash
Aquaman
Cyborg
Lanterna Verde
Coringa
Arlequina
Charada
Pinguim
Mulher Gato
Robin
Asa Noturna
Batgirl
Homem Aranha
Homem de Ferro
Capitao America
Thor
Hulk
Viúva Negra
Gaviao Arqueiro
Doutor Estranho
Pantera Negra
Wolverine
Deadpool
Professor Xavier
Magneto
Tempestade
Ciclope
Jean Grey
Vampira
Gambit
Demolidor
Justiceiro
Venom
Thanos
Loki
Wanda Maximoff
Visao
Nick Fury
Blade
Motoqueiro Fantasma
Senhor das Estrelas
Gamora
Groot
Rocket Raccoon
Drax
Homelander
Billy Butcher
Starlight
Eleven
Mike Wheeler
Dustin Henderson
Lucas Sinclair
Will Byers
Max Mayfield
Hopper
Wednesday Addams
Wandinha
Morticia Addams
Gomez Addams
Tio Chico
Sherlock Holmes
John Watson
Doctor Who
Dalek
Darth Vader
Luke Skywalker
Leia Organa
Han Solo
Chewbacca
Yoda
Obi-Wan Kenobi
Ahsoka Tano
Mandaloriano
Grogu
Spock
Capitao Kirk
Jean-Luc Picard
Data
Frodo
Samwise Gamgee
Gandalf
Aragorn
Legolas
Gimli
Gollum
Bilbo
Harry Potter
Hermione Granger
Ron Weasley
Dumbledore
Voldemort
Severus Snape
Hagrid
Draco Malfoy
Geralt de Rivia
Ciri
Yennefer
Rick Sanchez
Morty Smith
Homer Simpson
Bart Simpson
Lisa Simpson
Marge Simpson
Bob Esponja
Patrick Estrela
Lula Molusco
Sandy Bochechas
Finn
Jake
Princesa Jujuba
Marceline
Steven Universo
Garnet
Ametista
Perola
Dexter
Johnny Bravo
Ben 10
Mutano
Ravena
Estelar
Robin
Kim Possible
Shego
Phineas
Ferb
Perry
Mabel Pines
Dipper Pines
Bill Cipher
Aang
Katara
Sokka
Zuko
Toph
Korra
`);

const FAMOUS_BANK = cleanLines(`
Albert Einstein
Isaac Newton
Marie Curie
Charles Darwin
Galileu Galilei
Nikola Tesla
Stephen Hawking
Ada Lovelace
Alan Turing
Santos Dumont
Machado de Assis
Clarice Lispector
Carlos Drummond de Andrade
Jorge Amado
Monteiro Lobato
Cecilia Meireles
Ariano Suassuna
Paulo Freire
Oscar Niemeyer
Tarsila do Amaral
Anita Malfatti
Candido Portinari
Pelé
Garrincha
Zico
Ronaldo Fenomeno
Ronaldinho Gaucho
Romario
Neymar
Marta
Ayrton Senna
Emerson Fittipaldi
Gustavo Kuerten
Rebeca Andrade
Rayssa Leal
Zeca Pagodinho
Caetano Veloso
Gilberto Gil
Chico Buarque
Milton Nascimento
Elis Regina
Gal Costa
Maria Bethania
Rita Lee
Tim Maia
Jorge Ben Jor
Cartola
Pixinguinha
Tom Jobim
Vinicius de Moraes
Anitta
Ivete Sangalo
Marilia Mendonca
Xuxa
Silvio Santos
Faustao
Gloria Maria
Jô Soares
Fernanda Montenegro
Tony Ramos
Lazaro Ramos
Taís Araujo
Paulo Gustavo
Chico Anysio
Renato Aragao
Grande Otelo
Carmen Miranda
Lula
Getulio Vargas
Juscelino Kubitschek
Dom Pedro II
Princesa Isabel
Tiradentes
Zumbi dos Palmares
Dandara
Maria Quiteria
Marechal Deodoro
Nelson Mandela
Martin Luther King
Mahatma Gandhi
Abraham Lincoln
Napoleao Bonaparte
Cleopatra
Julio Cesar
Leonardo da Vinci
Michelangelo
William Shakespeare
Mozart
Beethoven
Frida Kahlo
Pablo Picasso
Salvador Dali
Madonna
Michael Jackson
Elvis Presley
Beyonce
Taylor Swift
Lady Gaga
Freddie Mercury
Bob Marley
Oprah Winfrey
Barack Obama
Steve Jobs
Bill Gates
Elon Musk
Ney Matogrosso
Padre Cicero
Irmã Dulce
Chacrinha
Hebe Camargo
`);

const POKEMON_NAMES = [
  "Pikachu", "Charizard", "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Squirtle", "Wartortle", "Blastoise",
  "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata",
  "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Raichu", "Sandshrew", "Sandslash", "Nidoran", "Nidorina",
  "Nidoqueen", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat",
  "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio",
  "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl",
  "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel",
  "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite",
  "Magneton", "Farfetchd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster",
  "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode",
  "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn",
  "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie",
  "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras",
  "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops",
  "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew",
  "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret",
  "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn",
  "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos",
  "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern",
  "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown",
  "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish",
  "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine",
  "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy",
  "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank",
  "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh", "Celebi",
  "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Poochyena",
  "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad", "Lombre",
  "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia",
  "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask",
  "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty", "Delcatty"
];

const GENERATED_MODIFIERS = /\s+(Classico|Neon|Secreto|Perdido|Lendario|Digital)$/i;
const CHARACTER_FULL_NAMES = new Map(Object.entries({
  Goku: "Son Goku",
  Gohan: "Son Gohan",
  Vegeta: "Vegeta",
  Piccolo: "Piccolo",
  Bulma: "Bulma Brief",
  Freeza: "Freeza",
  Kuririn: "Kuririn",
  Trunks: "Trunks Brief",
  Naruto: "Naruto Uzumaki",
  Sasuke: "Sasuke Uchiha",
  Sakura: "Sakura Haruno",
  Kakashi: "Kakashi Hatake",
  Hinata: "Hinata Hyuga",
  Itachi: "Itachi Uchiha",
  Madara: "Madara Uchiha",
  Jiraiya: "Jiraiya",
  Gaara: "Gaara",
  Luffy: "Monkey D. Luffy",
  Zoro: "Roronoa Zoro",
  Nami: "Nami",
  Sanji: "Vinsmoke Sanji",
  Usopp: "Usopp",
  Chopper: "Tony Tony Chopper",
  Robin: "Nico Robin",
  Franky: "Franky",
  Brook: "Brook",
  Shanks: "Shanks",
  Ichigo: "Ichigo Kurosaki",
  Rukia: "Rukia Kuchiki",
  Orihime: "Orihime Inoue",
  Uryu: "Uryu Ishida",
  Renji: "Renji Abarai",
  Byakuya: "Byakuya Kuchiki",
  Aizen: "Sosuke Aizen",
  Kenpachi: "Kenpachi Zaraki",
  Hitsugaya: "Toshiro Hitsugaya",
  Yoruichi: "Yoruichi Shihoin",
  Saitama: "Saitama",
  Genos: "Genos",
  Tatsumaki: "Tatsumaki",
  "Mumen Rider": "Mumen Rider",
  Garou: "Garou",
  Deku: "Izuku Midoriya",
  Bakugo: "Katsuki Bakugo",
  Uraraka: "Ochaco Uraraka",
  Todoroki: "Shoto Todoroki",
  "All Might": "Toshinori Yagi",
  Shigaraki: "Tomura Shigaraki",
  Tanjiro: "Tanjiro Kamado",
  Nezuko: "Nezuko Kamado",
  Zenitsu: "Zenitsu Agatsuma",
  Inosuke: "Inosuke Hashibira",
  Giyu: "Giyu Tomioka",
  Rengoku: "Kyojuro Rengoku",
  Muzan: "Muzan Kibutsuji",
  Shinobu: "Shinobu Kocho",
  Eren: "Eren Yeager",
  Mikasa: "Mikasa Ackerman",
  Armin: "Armin Arlert",
  Levi: "Levi Ackerman",
  Erwin: "Erwin Smith",
  Reiner: "Reiner Braun",
  Annie: "Annie Leonhart",
  Light: "Light Yagami",
  L: "L Lawliet",
  Misa: "Misa Amane",
  Edward: "Edward Elric",
  Winry: "Winry Rockbell",
  Mustang: "Roy Mustang",
  Armstrong: "Alex Louis Armstrong",
  Gon: "Gon Freecss",
  Killua: "Killua Zoldyck",
  Kurapika: "Kurapika",
  Leorio: "Leorio Paradinight",
  Hisoka: "Hisoka Morow",
  Yusuke: "Yusuke Urameshi",
  Kuwabara: "Kazuma Kuwabara",
  Kagome: "Kagome Higurashi",
  Usagi: "Usagi Tsukino",
  Ami: "Ami Mizuno",
  Rei: "Rei Hino",
  Makoto: "Makoto Kino",
  Minako: "Minako Aino",
  Mamoru: "Mamoru Chiba",
  Shinji: "Shinji Ikari",
  Asuka: "Asuka Langley Soryu",
  Misato: "Misato Katsuragi",
  Kaworu: "Kaworu Nagisa",
  Kaneda: "Shotaro Kaneda",
  Tetsuo: "Tetsuo Shima",
  Chihiro: "Chihiro Ogino",
  Kiki: "Kiki",
  Kenshin: "Kenshin Himura",
  Kaoru: "Kaoru Kamiya",
  Sanosuke: "Sanosuke Sagara",
  Senku: "Senku Ishigami",
  Tsukasa: "Tsukasa Shishio",
  Rimuru: "Rimuru Tempest",
  Subaru: "Subaru Natsuki",
  Kirito: "Kazuto Kirigaya",
  Asuna: "Asuna Yuuki",
  Megumi: "Megumi Fushiguro",
  Nobara: "Nobara Kugisaki",
  Gojo: "Satoru Gojo",
  Yuta: "Yuta Okkotsu",
  Aki: "Aki Hayakawa",
  Vash: "Vash the Stampede",
  Lelouch: "Lelouch Lamperouge",
  Suzaku: "Suzaku Kururugi",
  Gintoki: "Gintoki Sakata",
  Kagura: "Kagura",
  Mob: "Shigeo Kageyama",
  Reigen: "Arataka Reigen",
  Thorfinn: "Thorfinn",
  Mario: "Mario",
  Luigi: "Luigi",
  Peach: "Princess Peach",
  Bowser: "Bowser",
  Yoshi: "Yoshi",
  Toad: "Toad",
  Wario: "Wario",
  Link: "Link",
  Zelda: "Princess Zelda",
  Ganondorf: "Ganondorf",
  Sonic: "Sonic",
  Tails: "Miles Tails Prower",
  Knuckles: "Knuckles the Echidna",
  "Amy Rose": "Amy Rose",
  Shadow: "Shadow the Hedgehog",
  Samus: "Samus Aran",
  "Mega Man": "Mega Man",
  "Dr Wily": "Dr Wily",
  "Chun-Li": "Chun-Li",
  "M Bison": "M Bison",
  "Liu Kang": "Liu Kang",
  Kitana: "Kitana",
  "Johnny Cage": "Johnny Cage",
  Cloud: "Cloud Strife",
  Sephiroth: "Sephiroth",
  Tifa: "Tifa Lockhart",
  Aerith: "Aerith Gainsborough",
  Squall: "Squall Leonhart",
  Lightning: "Lightning Farron",
  Noctis: "Noctis Lucis Caelum",
  Sora: "Sora",
  Riku: "Riku",
  Kairi: "Kairi",
  Crash: "Crash Bandicoot",
  Coco: "Coco Bandicoot",
  Spyro: "Spyro",
  "Master Chief": "Master Chief",
  "Gordon Freeman": "Gordon Freeman",
  Chell: "Chell",
  Kratos: "Kratos",
  Atreus: "Atreus",
  Sully: "Victor Sullivan",
  "Solid Snake": "Solid Snake",
  "Big Boss": "Big Boss",
  Geralt: "Geralt of Rivia",
  Ciri: "Cirilla Fiona Elen Riannon",
  Triss: "Triss Merigold",
  Dutch: "Dutch van der Linde",
  Trevor: "Trevor Philips",
  CJ: "Carl Johnson",
  Franklin: "Franklin Clinton",
  Ezio: "Ezio Auditore",
  Altair: "Altair Ibn-La'Ahad",
  Bayek: "Bayek of Siwa",
  Sackboy: "Sackboy",
  Ratchet: "Ratchet",
  Clank: "Clank",
  Jak: "Jak",
  Daxter: "Daxter",
  Banjo: "Banjo",
  Kazooie: "Kazooie",
  Ness: "Ness",
  Lucas: "Lucas",
  Marth: "Marth",
  Ike: "Ike",
  Pit: "Pit",
  Palutena: "Palutena",
  Steve: "Steve",
  Alex: "Alex",
  Sans: "Sans",
  Papyrus: "Papyrus",
  Frisk: "Frisk",
  Cuphead: "Cuphead",
  Mugman: "Mugman",
  Tracer: "Lena Oxton",
  Reaper: "Gabriel Reyes",
  Genji: "Genji Shimada",
  Hanzo: "Hanzo Shimada",
  "D.Va": "Hana Song",
  Winston: "Winston",
  Jinx: "Jinx",
  Vi: "Vi",
  Ahri: "Ahri",
  Yasuo: "Yasuo",
  Lux: "Luxanna Crownguard",
  Ekko: "Ekko",
  Ashe: "Ashe",
  Jett: "Jett",
  Phoenix: "Phoenix",
  Sage: "Sage",
  Viper: "Viper",
  Reyna: "Reyna",
  Octane: "Octavio Silva",
  Wraith: "Renee Blasey",
  Bloodhound: "Bloodhound",
  Pathfinder: "Pathfinder",
  Kazuya: "Kazuya Mishima",
  Heihachi: "Heihachi Mishima",
  Lili: "Emilie De Rochefort",
  King: "King",
  Aloy: "Aloy",
  Senua: "Senua",
  Elizabeth: "Elizabeth",
  Liara: "Liara T'Soni",
  Garrus: "Garrus Vakarian",
  Tali: "Tali'Zorah",
  Morrigan: "Morrigan",
  Varric: "Varric Tethras",
  Solas: "Solas"
}));

function cleanLines(text) {
  return text.split("\n").map((word) => word.trim()).filter(Boolean);
}

function cleanBank(words) {
  return [...new Set(words.map((word) => word.replace(GENERATED_MODIFIERS, "").trim()).filter(Boolean))];
}

function characterBank(words) {
  return cleanBank(words).map((word) => CHARACTER_FULL_NAMES.get(word) || word);
}

export const WORD_BANKS = {
  Geral: [...new Set(GENERAL_SIMPLE)],
  Anime: characterBank(ANIME_CHARACTER_BANK),
  Pokemon: POKEMON_NAMES,
  Filmes: cleanBank(MOVIE_TITLE_BANK),
  Jogos: characterBank(GAME_CHARACTER_BANK),
  Geek: cleanBank(GEEK_BANK),
  Famosos: cleanBank(FAMOUS_BANK)
};
