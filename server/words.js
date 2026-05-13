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
const ABSTRACT_GENERAL_WORDS = new Set([
  "Pessoa", "Povo", "Homem", "Mulher", "Crianca", "Bebe", "Amigo", "Familia", "Vizinho",
  "Rosto", "Sorriso", "Riso", "Choro", "Sono", "Sonho", "Medo", "Raiva", "Alegria", "Dor", "Forca",
  "Calor", "Frio", "Claro", "Escuro", "Grande", "Pequeno", "Alto", "Baixo", "Novo", "Velho", "Rapido", "Lento",
  "Limpo", "Sujo", "Cheio", "Vazio", "Doce", "Salgado", "Quente", "Gelado", "Macio", "Duro", "Leve", "Pesado",
  "Aberto", "Fechado", "Longe", "Perto", "Cima", "Meio", "Inicio", "Fim", "Ontem", "Hoje", "Amanha",
  "Manha", "Tarde", "Noite", "Hora", "Minuto", "Semana", "Mes", "Ano", "Numero", "Letra", "Nome",
  "Voz", "Som", "Barulho", "Silencio", "Cor"
]);
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
  "All Might": "All Might",
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
  Tails: "Tails",
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
  CJ: "CJ",
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
  Tracer: "Tracer",
  Reaper: "Reaper",
  Genji: "Genji Shimada",
  Hanzo: "Hanzo",
  "D.Va": "D.Va",
  Winston: "Winston",
  Jinx: "Jinx",
  Vi: "Vi",
  Ahri: "Ahri",
  Yasuo: "Yasuo",
  Lux: "Lux",
  Ekko: "Ekko",
  Ashe: "Ashe",
  Jett: "Jett",
  Phoenix: "Phoenix",
  Sage: "Sage",
  Viper: "Viper",
  Reyna: "Reyna",
  Octane: "Octane",
  Wraith: "Wraith",
  Bloodhound: "Bloodhound",
  Pathfinder: "Pathfinder",
  Kazuya: "Kazuya Mishima",
  Heihachi: "Heihachi Mishima",
  Lili: "Lili",
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

const GENERAL_EXTRA = cleanLines(`
Armario
Gaveta
Cabide
Porta retrato
Quadro
Calendario
Agenda
Jornal
Revista
Envelope
Carimbo
Tesouro
Cofre
Cadeado
Corrente
Varal
Pregador
Mangueira
Torneira
Ralo
Balanca
Termometro
Ventilador
Ar condicionado
Aquecedor
Cobertura
Telhado
Tijolo
Cimento
Areia movel
Brita
Porta malas
Para brisa
Farol
Retrovisor
Semaforo
Faixa
Calçada
Esquina
Rotatoria
Viaduto
Beco
Alameda
Trilha
Acampamento
Barraca
Lanterna
Fogueira
Isqueiro
Fosforo
Mergulho
Mascara
Nadadeira
Boia
Ancora
Remo
Veleiro
Canoa
Prancha
Patins
Skate
Raquete
Peteca
Trofeu
Medalha
Apito
Uniforme
Chuteira
Capacete
Luva
Rede de pesca
Aquario
Gaiola
Coleira
Racao
Osso
Ninho
Pena
Bico
Asa
Casco
Chifre
Cauda
Bigode
Melancia
Abobora
Pepino
Alface
Repolho
Cebola
Alho
Pimenta
Canela
Chocolate
Pipoca
Amendoim
Castanha
Iogurte
Manteiga
Geleia
Farinha
Fermento
Hamburguer
Pastel
Coxinha
Esfiha
Tapioca
Crepe
Panqueca
Lasanha
Churrasco
Tempero
Guardanapo
Bandeja
Xicara
Caneca
Jarra
Liquidificador
Batedeira
Forno
Microondas
Chaleira
Escorredor
Peneira
Ralador
Abridor
Rolha
Saca rolha
Fronha
Lençol
Colchao
Berço
Comoda
Criado mudo
Abajur
Interruptor
Tomada
Extensao
Controle remoto
Campainha
Alarme
Fechadura
Dobradiça
Maçaneta
Cortador
Fita adesiva
Grampeador
Clipe
Regua
Compasso
Transferidor
Calculadora
Mochila escolar
Estojo
Apontador
Giz
Lousa
Carteira escolar
Biblioteca
Laboratorio
Quadro negro
Globo
Planeta
Cometa
Foguete
Astronauta
Satélite
Telescopio
Microscopio
Imã
Bateria
Pilhas
Controle
Joystick
Fone
Microfone
Caixa de som
Impressora
Scanner
Roteador
Antena
Relampago
Trovao
Tempestade
Garoa
Orvalho
Geada
Arco iris
Cachoeira
Corredeira
Pântano
Mangue
Penhasco
Planalto
Bosque
Jiboia
Jacare
Coruja
Pinguim
Camelo
Canguru
Hipopotamo
Rinoceronte
Panda
Koala
Esquilo
Lontra
Foca
Pelicano
Gaivota
Pavao
Peru
Ganso
Marreco
Caranguejo
Lagosta
Polvo
Lula
Ostra
Concha
Estrela do mar
Coral
Ourico
Besouro
Grilo
Joaninha
Cupim
Mariposa
Escorpiao
Libelula
Centopéia
Pijama
Casaco
Jaqueta
Blusa
Saia
Bermuda
Shorts
Cinto
Gravata
Cachecol
Luva de frio
Óculos
Relogio de pulso
Brinco
Colar
Pulseira
Anel
Perfume
Shampoo
Condicionador
Desodorante
Creme
Esparadrapo
Seringa
Raio x
Maca
Receita
Vacina
Dentista
Ambulancia
Sirene
Delegacia
Tribunal
Cartorio
Prefeitura
Correio
Estadio
Rodoviaria
Aeroporto
Porto
Shopping
Feira
Quitanda
Açougue
Barbearia
Salão
Academia
Clube
Circo
Zoologico
Aqueduto
Castelo
Cabana
Apartamento
Condominio
Cobertura
Chácara
Sítio
Celeiro
Curral
Pomar
Horta
Girassol
Rosa
Margarida
Orquidea
Cacto
Bambu
Pinheiro
Coqueiro
Palmeira
Samambaia
Musgo
Cogumelo
Madeira
Carvao
Cinza
Argila
Ceramica
Porcelana
Algodao
Lã
Seda
Veludo
Jeans
Zíper
Botina
Sandalia
Chinelo
Tênis
Guarda roupa
Maleta
Carrinho de feira
Carrinho de bebê
Berimbau
Bateria musical
Sanfona
Trompete
Violino
Saxofone
Harpa
Pandeiro
Partitura
Palco
Camarim
Plateia
Ingresso
Bilheteria
Fantasia
Máscara
Balão
Confete
Serpentina
Fogos
Convite
Presépio
Guirlanda
Panetone
Chocolate quente
Limonada
Vitamina
Sanduiche
Torrada
Omelete
Salada
Molho
Sushi
Yakissoba
Risoto
Torta
Pudim
Gelatina
Brigadeiro
Beijinho
Paçoca
Rapadura
Sorveteiro
Pipoqueiro
Carteiro
Pedreiro
Encanador
Eletricista
Jardineiro
Costureira
Fotografo
Garçom
Bibliotecario
Porteiro
Vendedor
Caixa
Agricultor
Pescador
Marinheiro
Piloto
Comissario
Mecânico
Ferreiro
Carpinteiro
Sapateiro
Veterinario
Enfermeiro
Atleta
Treinador
Arbitro
Nadador
Ciclista
Ginasta
Lutador
Corredor
Goleiro
Zagueiro
Atacante
Torcida
Arquibancada
Placar
Tabuleiro
Peão
Dominó
Xadrez
Damas
Quebra cabeça
Ioiô
Boliche
Bilhar
Pescaria
Alvo
Flecha
Arco
Estilingue
Bumerangue
Pião
Carruagem
Trator
Caminhao
Escavadeira
Guindaste
Helicoptero
Balão de ar
Submarino
Jipe
Van
Carroça
Patinete
Teleférico
Metrô
Boné
Viseira
Capuz
Uniforme escolar
Escova de dentes
Pasta de dente
Fio dental
Barbeador
Toalheiro
Saboneteira
Banheira
Vaso
Descarga
Espelho d'agua
Filtro
Bebedouro
Caixa d'agua
Poço
Represa
Canal
Dique
Moinho
Catavento
Biruta
Paraquedas
Escorregador
Balanço
Gangorra
Carrossel
Roda gigante
Montanha russa
Labirinto
Estatua
Fonte
Coreto
Banco de praça
Lixeira
Poste
Placa
Outdoor
Toldo
Vitrine
Provador
Etiqueta
Cabine
Senha
Fila
Carrinho
Cesta
Sacola retornavel
Moedor
Filtro de cafe
Porta copos
Porta malas
Para choque
Macaco
Estepe
Pedal
Corrente de bicicleta
Guidão
Selim
Campainha de bike
Pneu reserva
Óleo
Graxa
Ferradura
Sela
Rédea
Estabulo
Ferramenta
Parafuso
Porca
Alicate
Chave inglesa
Furadeira
Lixa
Capacho
Varanda
Sacada
Quintal
Calha
Rampa
Piso
Azulejo
Rodapé
Persiana
Porta de correr
Grade
Tela mosquiteira
Chaminé
Lareira
Lenha
Vaso sanitario
Escova sanitaria
Pá
Enxada
Regador
Tesourão
Carrinho de mão
Adubo
Espantalho
Irrigador
Colheita
Silo
Arado
`);

const ANIME_EXTRA = cleanLines(`
Ash Ketchum
Misty
Brock
Serena
Yugi Muto
Seto Kaiba
Joey Wheeler
Yami Yugi
Jaden Yuki
Yusei Fudo
Natsu Dragneel
Lucy Heartfilia
Erza Scarlet
Gray Fullbuster
Happy
Meliodas
Elizabeth Liones
Ban
Diane
King
Escanor
Rimuru Tempest
Raphtalia
Naofumi Iwatani
Subaru Natsuki
Emilia
Rem
Ram
Kazuma Sato
Aqua
Megumin
Darkness
Kirito
Asuna Yuuki
Sinon
Eugeo
Yuji Itadori
Ryomen Sukuna
Maki Zenin
Toge Inumaki
Panda
Yuta Okkotsu
Denji
Power
Makima
Kobeni Higashiyama
Pochita
Anya Forger
Loid Forger
Yor Forger
Bond Forger
Frieren
Fern
Stark
Himmel
Maomao
Jinshi
Thorfinn
Askeladd
Canute
Hyakkimaru
Dororo
Senku Ishigami
Taiju Oki
Yuzuriha Ogawa
Kohaku
Shoyo Hinata
Tobio Kageyama
Kei Tsukishima
Tetsuro Kuroo
Kenma Kozume
Kuroko Tetsuya
Taiga Kagami
Seijuro Akashi
Rintaro Okabe
Kurisu Makise
Mayuri Shiina
Holo
Kraft Lawrence
Violet Evergarden
Kousei Arima
Kaori Miyazono
Tohru Honda
Kyo Soma
Yuki Soma
Nana Osaki
Nana Komatsu
Guts
Griffith
Casca
Alucard
Seras Victoria
Integra Hellsing
Motoko Kusanagi
Batou
Nausicaa
San
Chihiro Ogino
Haku
Kiki
Sophie Hatter
Howl Jenkins
Ponyo
Conan Edogawa
Ran Mouri
Kogoro Mouri
Kaito Kid
Toru Amuro
Shinji Matou
Saber
Rin Tohsaka
Shirou Emiya
Archer
Lancer
Mikoto Misaka
Toma Kamijo
Kenshiro
Raoh
Joe Yabuki
Lupin III
Daisuke Jigen
Fujiko Mine
Goemon Ishikawa
Inspector Zenigata
Kenshin Himura
Kaoru Kamiya
Sanosuke Sagara
Shishio Makoto
Yusuke Urameshi
Kazuma Kuwabara
Kurama
Hiei
Toguro
Inuyasha
Kagome Higurashi
Sesshomaru
Kikyo
Kenshin
Sango
Miroku
Shoyo
Kagura
Gintoki Sakata
Shinpachi Shimura
Kagura Gintama
Takasugi Shinsuke
Mugen
Jin
Fuu
Spike Spiegel
Jet Black
Faye Valentine
Ed
Vicious
Renton Thurston
Eureka
Simon
Kamina
Yoko Littner
Nia Teppelin
Ryuko Matoi
Satsuki Kiryuin
Mako Mankanshoku
Akko Kagari
Lotte Jansson
Sucy Manbavaran
Mob
Reigen Arataka
Ritsu Kageyama
Dimple
Kaguya Shinomiya
Miyuki Shirogane
Chika Fujiwara
Ai Hayasaka
Marin Kitagawa
Wakana Gojo
Hitori Gotoh
Nijika Ijichi
Ryo Yamada
Ikuyo Kita
Eikichi Onizuka
Onizuka
Saiki Kusuo
Riki Nendo
Kaidou Shun
Korosensei
Nagisa Shiota
Karma Akabane
Shigeo Kageyama
`);

const MOVIE_EXTRA = cleanLines(`
Uma Noite Alucinante
Evil Dead
Army of Darkness
Donnie Darko
Cidade dos Sonhos
Veludo Azul
Eraserhead
Trainspotting
Clube dos Cinco
Conta Comigo
Curtindo a Vida Adoidado
Antes do Amanhecer
Antes do Por do Sol
Antes da Meia Noite
Brilho Eterno de uma Mente sem Lembrancas
Ela
O Lagosta
O Grande Hotel Budapeste
Moonrise Kingdom
Os Excêntricos Tenenbaums
Jojo Rabbit
O Labirinto do Fauno
O Orfanato
O Segredo dos Seus Olhos
Relatos Selvagens
Amores Brutos
Y Tu Mama Tambien
Roma
Filhos da Esperanca
O Hospedeiro
Oldboy
Memorias de um Assassino
Em Chamas
O Profissional
Nikita
Corra
Nos
Hereditario
Midsommar
A Bruxa
O Farol
O Babadook
Corrente do Mal
Rec
O Chamado
O Grito
Jogos Mortais
Premonicao
Atividade Paranormal
Invocacao do Mal
Sobrenatural
Sexto Sentido
Fragmentado
Vidro
Amelie Poulain
Cinema Paradiso
A Vida e Bela
O Carteiro e o Poeta
O Fabuloso Destino de Amelie Poulain
O Artista
O Discurso do Rei
12 Anos de Escravidao
Spotlight
Birdman
Boyhood
Whiplash
O Lado Bom da Vida
Pequena Miss Sunshine
Juno
Lady Bird
Minari
Nomadland
Tudo em Todo Lugar ao Mesmo Tempo
Os Banshees de Inisherin
Aftersun
Vidas Passadas
Anatomia de uma Queda
Zona de Interesse
Os Infiltrados
Ilha do Medo
Cassino
Os Bons Companheiros
Taxi Driver
Touro Indomavel
Scarface
Fogo Contra Fogo
Cães de Aluguel
Pulp Fiction
Jackie Brown
Kill Bill
Bastardos Inglorios
Django Livre
Os Oito Odiados
Era Uma Vez em Hollywood
Fargo
Onde os Fracos Nao Tem Vez
O Grande Lebowski
Bravura Indomita
Arizona Nunca Mais
Sangue Negro
Magnolia
Boogie Nights
O Mestre
Vicio Inerente
Licorice Pizza
Blade Runner 2049
A Chegada
Sicario
Prisioneiros
Incendios
O Homem Duplicado
O Predestinado
Ex Machina
Aniquilacao
Sunshine
Exterminio
Quem Quer Ser um Milionario
127 Horas
O Show de Truman
Gattaca
Contato
Distrito 9
Chappie
Elysium
Moon
Contra o Tempo
Looper
Os 12 Macacos
Brazil
Stalker
Solaris
O Sacrificio
A Fonte da Vida
Requiem para um Sonho
Cisne Negro
O Lutador
Pi
Interestelar
O Grande Truque
Amnesia
Dunkirk
Tenet
Oppenheimer
Batman Begins
Cavaleiro das Trevas
Cavaleiro das Trevas Ressurge
Logan
Kick-Ass
Scott Pilgrim Contra o Mundo
Sin City
Watchmen
V de Vinganca
O Corvo
Hellboy
Constantine
O Mascara
Beetlejuice
Edward Maos de Tesoura
Peixe Grande
Sweeney Todd
A Noiva Cadaver
Coraline
Kubo
ParaNorman
Fantastico Sr Raposo
Ilha dos Cachorros
Akira Kurosawa
Os Sete Samurais
Rashomon
Yojimbo
Harakiri
Ran
Sonhos
O Túmulo dos Vagalumes
Perfect Blue
Paprika
Millennium Actress
Your Name
O Tempo com Voce
A Viagem de Chihiro
Princesa Mononoke
Meu Amigo Totoro
Castelo Animado
Servico de Entregas da Kiki
Nausicaa
`);

const GAME_EXTRA = cleanLines(`
Princess Peach
Bowser
Yoshi
Wario
Waluigi
Rosalina
Ganondorf
Impa
Midna
Zant
Tingle
Mipha
Revali
Urbosa
Daruk
Knuckles the Echidna
Shadow the Hedgehog
Amy Rose
Dr Eggman
Miles Tails Prower
Chun-Li
Cammy White
Guile
Zangief
M Bison
Akuma
Sagat
Liu Kang
Johnny Cage
Sonya Blade
Raiden
Kitana
Mileena
Shao Kahn
Jax Briggs
Tifa Lockhart
Aerith Gainsborough
Barret Wallace
Yuffie Kisaragi
Squall Leonhart
Rinoa Heartilly
Tidus
Yuna
Lightning
Noctis Lucis Caelum
Terra Branford
Cecil Harvey
Kain Highwind
Vivi Ornitier
Roxas
Kairi
Riku
Donald Duck
Goofy
Terra
Aqua
Ventus
Cortana
Arbiter
Marcus Fenix
Dominic Santiago
Commander Shepard
Liara T'Soni
Garrus Vakarian
Tali'Zorah
Morrigan
Alistair
Varric Tethras
Solas
Cassandra Pentaghast
Hawke
Geralt of Rivia
Ciri
Yennefer
Triss Merigold
Dandelion
Vesemir
Joel
Ellie
Abby Anderson
Tommy Miller
Sarah Miller
Nathan Drake
Elena Fisher
Victor Sullivan
Chloe Frazer
Nadine Ross
Arthur Morgan
John Marston
Dutch van der Linde
Sadie Adler
Micah Bell
CJ
Tommy Vercetti
Niko Bellic
Michael De Santa
Franklin Clinton
Trevor Philips
Ezio Auditore
Altair Ibn-La'Ahad
Edward Kenway
Bayek
Kassandra
Eivor
Agent 47
Max Payne
Alan Wake
Jesse Faden
Sam Fisher
Solid Snake
Big Boss
Raiden
Revolver Ocelot
Quiet
Kazuma Kiryu
Goro Majima
Ichiban Kasuga
Ryu Hayabusa
Kasumi
Heihachi Mishima
Kazuya Mishima
Jin Kazama
King
Nina Williams
Lili
Lars Alexandersson
Jill Valentine
Claire Redfield
Ada Wong
Chris Redfield
Albert Wesker
Nemesis
Lady Dimitrescu
Ethan Winters
Leon Kennedy
Rebecca Chambers
Barry Burton
Dante
Vergil
Nero
Lady
Trish
Bayonetta
Jeanne
Kratos
Atreus
Freya
Baldur
Mimir
Senua
Aloy
Sylens
Rost
2B
9S
A2
Emil
Jinx
Vi
Caitlyn
Ahri
Yasuo
Lux
Garen
Teemo
Ekko
Thresh
Jett
Phoenix
Sage
Raze
Viper
Killjoy
Reyna
Tracer
Widowmaker
Mercy
Reaper
Genji
Hanzo
D.Va
Winston
Kirby
Meta Knight
King Dedede
Fox McCloud
Falco Lombardi
Ness
Lucas
Captain Falcon
Marth
Ike
Lucina
Robin
Shulk
Pyra
Mythra
Inkling
Villager
Isabelle
Tom Nook
K K Slider
Steve
Alex
Creeper
Enderman
Herobrine
Sans
Papyrus
Frisk
Undyne
Cuphead
Mugman
Ms Chalice
Hollow Knight
Hornet
Shovel Knight
Ori
Shantae
Rayman
Rabbid
Crash Bandicoot
Coco Bandicoot
Dr Neo Cortex
Spyro
Sly Cooper
Ratchet
Clank
Jak
Daxter
Cole MacGrath
Sackboy
`);

const GEEK_EXTRA = cleanLines(`
Batgirl
Nightwing
Red Hood
Raven
Starfire
Beast Boy
Deathstroke
Riddler
Penguin
Two-Face
Poison Ivy
Scarecrow
Bane
Green Arrow
Black Canary
Martian Manhunter
Shazam
Lex Luthor
Darkseid
Doctor Fate
Zatanna
Constantine
Swamp Thing
Blue Beetle
Static Shock
Moon Knight
Daredevil
Punisher
Jessica Jones
Luke Cage
Iron Fist
Ms Marvel
She-Hulk
Hawkeye
Kate Bishop
Vision
Ant-Man
Wasp
Falcon
Winter Soldier
Nick Fury
Professor X
Magneto
Cyclops
Jean Grey
Storm
Rogue
Gambit
Beast
Mystique
Venom
Carnage
Green Goblin
Doctor Octopus
Mysterio
Miles Morales
Gwen Stacy
Star-Lord
Gamora
Rocket Raccoon
Groot
Drax
Nebula
Blade
Spawn
Hellboy
Invincible
Omni-Man
Atom Eve
Rick Sanchez
Morty Smith
Summer Smith
Beth Smith
Jerry Smith
Bender
Fry
Leela
Professor Farnsworth
Homer Simpson
Marge Simpson
Bart Simpson
Lisa Simpson
Maggie Simpson
Peter Griffin
Stewie Griffin
Brian Griffin
Lois Griffin
Stan Smith
Roger Smith
Bob Belcher
Tina Belcher
Louise Belcher
Finn
Jake
Princess Bubblegum
Marceline
Ice King
Steven Universe
Garnet
Pearl
Amethyst
Rick Grimes
Daryl Dixon
Negan
Walter White
Jesse Pinkman
Saul Goodman
Gus Fring
Dexter Morgan
Tony Soprano
Don Draper
Daenerys Targaryen
Jon Snow
Tyrion Lannister
Arya Stark
Cersei Lannister
Sansa Stark
The Mandalorian
Din Djarin
Boba Fett
Mace Windu
Qui-Gon Jinn
Kylo Ren
Rey
Finn Star Wars
Poe Dameron
Lando Calrissian
Padme Amidala
Anakin Skywalker
R2-D2
C-3PO
BB-8
Worf
Geordi La Forge
William Riker
Seven of Nine
Kathryn Janeway
Benjamin Sisko
James Holden
Naomi Nagata
Amos Burton
Chrisjen Avasarala
Paul Atreides
Chani
Lady Jessica
Baron Harkonnen
Dracula
Frankenstein
Wolfman
Buffy Summers
Spike
Angel
Xena
Hercules
Geralt of Rivia
Yennefer
Jaskier
The Doctor
Amy Pond
Clara Oswald
Donna Noble
Sarah Connor
T-800
Ellen Ripley
Newt
Predator
Robocop
Neo
Trinity
Morpheus
Agent Smith
`);

const FAMOUS_EXTRA = cleanLines(`
Machado de Assis
Clarice Lispector
Jorge Amado
Cecilia Meireles
Carlos Drummond de Andrade
Graciliano Ramos
Ariano Suassuna
Paulo Freire
Milton Santos
Oswaldo Cruz
Carlos Chagas
Santos Dumont
Chico Xavier
Irma Dulce
Lina Bo Bardi
Oscar Niemeyer
Burle Marx
Tarsila do Amaral
Anita Malfatti
Candido Portinari
Di Cavalcanti
Tom Jobim
Vinicius de Moraes
Elis Regina
Gal Costa
Maria Bethania
Caetano Veloso
Gilberto Gil
Chico Buarque
Milton Nascimento
Tim Maia
Raul Seixas
Rita Lee
Cazuza
Renato Russo
Marisa Monte
Ivete Sangalo
Daniela Mercury
Alcione
Beth Carvalho
Cartola
Nelson Cavaquinho
Noel Rosa
Pixinguinha
Luiz Gonzaga
Dominguinhos
Chacrinha
Hebe Camargo
Silvio Santos
Faustao
Xuxa
Pelé
Garrincha
Zico
Romario
Ronaldo Fenomeno
Ronaldinho Gaucho
Marta
Ayrton Senna
Nelson Piquet
Emerson Fittipaldi
Guga Kuerten
Oscar Schmidt
Hortencia
Daiane dos Santos
Rebeca Andrade
Rayssa Leal
Italo Ferreira
Medina
Ana Marcela Cunha
Fernanda Montenegro
Paulo Autran
Grande Otelo
Oscarito
Regina Duarte
Tony Ramos
Gloria Pires
Lazaro Ramos
Taís Araujo
Selton Mello
Wagner Moura
Alice Braga
Rodrigo Santoro
Sonia Braga
Fernanda Torres
Jô Soares
Millôr Fernandes
Luis Fernando Verissimo
Ziraldo
Mauricio de Sousa
Monteiro Lobato
Ruth Rocha
Ana Maria Braga
Palmirinha
Claude Troisgros
Alex Atala
Helena Rizzo
Padre Cicero
Lampiao
Maria Bonita
Zumbi dos Palmares
Dandara
Tiradentes
Dom Pedro I
Dom Pedro II
Princesa Isabel
Getulio Vargas
Juscelino Kubitschek
Tancredo Neves
Ulysses Guimaraes
Marechal Rondon
Anita Garibaldi
Chiquinha Gonzaga
Nise da Silveira
Bertha Lutz
Leila Diniz
Marielle Franco
Einstein
Marie Curie
Isaac Newton
Charles Darwin
Stephen Hawking
Nikola Tesla
Alan Turing
Ada Lovelace
Galileu Galilei
Leonardo da Vinci
Michelangelo
Mozart
Beethoven
Frida Kahlo
Pablo Picasso
Nelson Mandela
Martin Luther King
Mahatma Gandhi
Madre Teresa
Malala Yousafzai
Barack Obama
Michael Jackson
Madonna
Beyonce
Elvis Presley
Freddie Mercury
The Beatles
Bob Marley
Muhammad Ali
Usain Bolt
Serena Williams
Michael Jordan
Messi
Cristiano Ronaldo
Neymar
`);

const POKEMON_EXTRA = cleanLines(`
Slaking
Nincada
Ninjask
Shedinja
Whismur
Loudred
Exploud
Makuhita
Hariyama
Azurill
Nosepass
Skitty
Delcatty
Sableye
Mawile
Aron
Lairon
Aggron
Meditite
Medicham
Electrike
Manectric
Plusle
Minun
Volbeat
Illumise
Roselia
Gulpin
Swalot
Carvanha
Sharpedo
Wailmer
Wailord
Numel
Camerupt
Torkoal
Spoink
Grumpig
Spinda
Trapinch
Vibrava
Flygon
Cacnea
Cacturne
Swablu
Altaria
Zangoose
Seviper
Lunatone
Solrock
Barboach
Whiscash
Corphish
Crawdaunt
Baltoy
Claydol
Lileep
Cradily
Anorith
Armaldo
Feebas
Milotic
Castform
Kecleon
Shuppet
Banette
Duskull
Dusclops
Tropius
Chimecho
Absol
Wynaut
Snorunt
Glalie
Spheal
Sealeo
Walrein
Clamperl
Huntail
Gorebyss
Relicanth
Luvdisc
Bagon
Shelgon
Salamence
Beldum
Metang
Metagross
Regirock
Regice
Registeel
Latias
Latios
Kyogre
Groudon
Rayquaza
Jirachi
Deoxys
Turtwig
Grotle
Torterra
Chimchar
Monferno
Infernape
Piplup
Prinplup
Empoleon
Starly
Staravia
Staraptor
Bidoof
Bibarel
Kricketot
Kricketune
Shinx
Luxio
Luxray
Budew
Roserade
Cranidos
Rampardos
Shieldon
Bastiodon
Burmy
Wormadam
Mothim
Combee
Vespiquen
Pachirisu
Buizel
Floatzel
Cherubi
Cherrim
Shellos
Gastrodon
Ambipom
Drifloon
Drifblim
Buneary
Lopunny
Mismagius
Honchkrow
Glameow
Purugly
Chingling
Stunky
Skuntank
Bronzor
Bronzong
Bonsly
Mime Jr
Happiny
Chatot
Spiritomb
Gible
Gabite
Garchomp
Munchlax
Riolu
Lucario
Hippopotas
Hippowdon
Skorupi
Drapion
Croagunk
Toxicroak
Carnivine
Finneon
Lumineon
Mantyke
Snover
Abomasnow
Weavile
Magnezone
Lickilicky
Rhyperior
Tangrowth
Electivire
Magmortar
Togekiss
Yanmega
Leafeon
Glaceon
Gliscor
Mamoswine
Porygon-Z
Gallade
Probopass
Dusknoir
Froslass
Rotom
Uxie
Mesprit
Azelf
Dialga
Palkia
Heatran
Regigigas
Giratina
Cresselia
Phione
Manaphy
Darkrai
Shaymin
Arceus
Victini
Snivy
Servine
Serperior
Tepig
Pignite
Emboar
Oshawott
Dewott
Samurott
Patrat
Watchog
Lillipup
Herdier
Stoutland
Purrloin
Liepard
Pansage
Simisage
Pansear
Simisear
Panpour
Simipour
Munna
Musharna
Pidove
Tranquill
Unfezant
Blitzle
Zebstrika
Roggenrola
Boldore
Gigalith
Woobat
Swoobat
Drilbur
Excadrill
Audino
Timburr
Gurdurr
Conkeldurr
Tympole
Palpitoad
Seismitoad
Throh
Sawk
Sewaddle
Swadloon
Leavanny
Venipede
Whirlipede
Scolipede
Cottonee
Whimsicott
Petilil
Lilligant
Basculin
Sandile
Krokorok
Krookodile
Darumaka
Darmanitan
Maractus
Dwebble
Crustle
Scraggy
Scrafty
Sigilyph
Yamask
Cofagrigus
Tirtouga
Carracosta
Archen
Archeops
Trubbish
Garbodor
Zorua
Zoroark
Minccino
Cinccino
Gothita
Gothorita
Gothitelle
Solosis
Duosion
Reuniclus
Ducklett
Swanna
Vanillite
Vanillish
Vanilluxe
Deerling
Sawsbuck
Emolga
Karrablast
Escavalier
Foongus
Amoonguss
Frillish
Jellicent
Alomomola
Joltik
Galvantula
Ferroseed
Ferrothorn
Klink
Klang
Klinklang
Tynamo
Eelektrik
Eelektross
Elgyem
Beheeyem
Litwick
Lampent
Chandelure
Axew
Fraxure
Haxorus
Cubchoo
Beartic
Cryogonal
Shelmet
Accelgor
Stunfisk
Mienfoo
Mienshao
Druddigon
Golett
Golurk
Pawniard
Bisharp
Bouffalant
Rufflet
Braviary
Vullaby
Mandibuzz
Heatmor
Durant
Deino
Zweilous
Hydreigon
Larvesta
Volcarona
Cobalion
Terrakion
Virizion
Tornadus
Thundurus
Reshiram
Zekrom
Landorus
Kyurem
Keldeo
Meloetta
Genesect
`);

const ANIME_MORE = cleanLines(`
Kiyotaka Ayanokoji
Suzune Horikita
Hachiman Hikigaya
Yukino Yukinoshita
Mai Sakurajima
Sakuta Azusagawa
Tomoya Okazaki
Nagisa Furukawa
Rikka Takanashi
Yuuta Togashi
`);

const GAME_MORE = cleanLines(`
Malenia
Radahn
Ranni
Melina
Tarnished
Solaire
Artorias
Ornstein
Siegward
Lady Maria
Gehrman
Hunter
Sekiro
Isshin Ashina
Kuro
Genichiro Ashina
The Penitent One
Doom Slayer
Isabelle
Tommy Angelo
Vito Scaletta
Clementine
Lee Everett
Bigby Wolf
Faith
Faith Connors
Commander Keen
Duke Nukem
Cal Kestis
Merrin
BD-1
Kyle Katarn
Revan
Bastila Shan
HK-47
Guybrush Threepwood
LeChuck
Elaine Marley
Manny Calavera
Razputin Aquato
Conker
Banjo
Kazooie
Joanna Dark
Eddie Riggs
Juliet Starling
Travis Touchdown
Henry Stickmin
Hat Kid
Madeline
Theo
Celeste
Peppino Spaghetti
Commander Video
Isaac Clarke
Nicole Brennan
Ellis
Coach
Nick Left 4 Dead
Zoey
Francis
Bill Overbeck
Pyramid Head
Heather Mason
James Sunderland
Alessa Gillespie
Aya Brea
Alex Mercer
Cole Phelps
Booker DeWitt
Elizabeth
Corvo Attano
Emily Kaldwin
Daud
Garrett
Faith Seed
Joseph Seed
Vaas Montenegro
Pagan Min
Handsome Jack
Tiny Tina
Claptrap
Moxxi
Lilith Borderlands
Rhys Strongfork
`);

const FAMOUS_MORE = cleanLines(`
Zeca Pagodinho
Seu Jorge
Jorge Ben Jor
Djavan
Ney Matogrosso
Elza Soares
Elba Ramalho
Fagner
Belchior
Zé Ramalho
Adoniran Barbosa
Maysa
Clara Nunes
Nara Leao
Joao Gilberto
Astrud Gilberto
Hermeto Pascoal
Egberto Gismonti
Rogério Ceni
Marcos
Cafu
Roberto Carlos
Rivaldo
Kaka
Formiga
Cristiane
Falcao
Eder Jofre
Popó
Anderson Silva
Amanda Nunes
José Aldo
Hugo Calderano
Thiago Braz
Maurren Maggi
Cesar Cielo
Bruno Gagliasso
Camila Pitanga
Matheus Nachtergaele
Marco Nanini
Miguel Falabella
Arlete Salles
Marieta Severo
Fernanda Young
Antonia Pellegrino
Dercy Gonçalves
Mazzaropi
Carmen Miranda
`);

export const WORD_BANKS = {
  Geral: cleanBank([...GENERAL_SIMPLE, ...GENERAL_EXTRA]).filter((word) => !ABSTRACT_GENERAL_WORDS.has(word)),
  Anime: characterBank([...ANIME_CHARACTER_BANK, ...ANIME_EXTRA, ...ANIME_MORE]),
  Pokemon: cleanBank([...POKEMON_NAMES, ...POKEMON_EXTRA]),
  Filmes: cleanBank([...MOVIE_TITLE_BANK, ...MOVIE_EXTRA]),
  Jogos: characterBank([...GAME_CHARACTER_BANK, ...GAME_EXTRA, ...GAME_MORE]),
  Geek: cleanBank([...GEEK_BANK, ...GEEK_EXTRA]),
  Famosos: cleanBank([...FAMOUS_BANK, ...FAMOUS_EXTRA, ...FAMOUS_MORE])
};
