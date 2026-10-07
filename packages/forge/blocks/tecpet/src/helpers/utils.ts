export const levenshtein = (a: string, b: string) => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1, // inserção
          matrix[i - 1][j] + 1, // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const normalize = (s: string) =>
  s
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const similarityScore = (a: string, b: string) => {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;

  const distance = levenshtein(a, b);

  return 1 - distance / maxLen; // score entre 0 e 1
};

// Melhor similaridade entre o termo e um candidato, comparando o texto completo
// e também cada palavra isolada (ex.: input "golden" contra "golden retriever").
const bestSimilarity = (termNorm: string, candidateNorm: string) => {
  if (!termNorm || !candidateNorm) return 0;

  const words = candidateNorm.split(" ").filter(Boolean);

  return Math.max(
    similarityScore(termNorm, candidateNorm),
    ...words.map((w) => similarityScore(termNorm, w)),
  );
};

export type RecognizedBreed = { name: string; matches: string[] };

// Dicionário de raças reconhecidas (grafia correta) + os erros de grafia mais
// comuns de cada uma. Usado como 1ª etapa: normaliza o texto digitado pelo
// cliente para o nome canônico da raça antes de buscar na base da loja.
export const RECOGNIZED_BREEDS: RecognizedBreed[] = [
  {
    name: "Affenpinscher",
    matches: ["Afenpinscher", "Affen Pinscher", "Afempinscher"],
  },
  {
    name: "Airedale Terrier",
    matches: ["Airedale", "Airdale Terrier", "Aredale Terrier"],
  },
  {
    name: "Akita",
    matches: ["Aquita", "Akyta", "Akita Inu"],
  },
  {
    name: "Akita Americano",
    matches: ["Aquita Americano", "Akita American"],
  },
  {
    name: "Alano Espanhol",
    matches: ["Alano Español", "Alano Espanol"],
  },
  {
    name: "Alaskan Klee Kai",
    matches: ["Alaska Klee Kai", "Alaskan Kleekai", "Klee Kai"],
  },
  {
    name: "American Bully",
    matches: [
      "American Buly",
      "Americam Bully",
      "Americanbully",
      "Americam Buly",
    ],
  },
  {
    name: "American Pit Bull Terrier",
    matches: ["Pit Bull", "Pitbull", "Pit Bul", "Pibull", "Pitbul"],
  },
  {
    name: "American Staffordshire Terrier",
    matches: [
      "Staffordshire Terrier",
      "Stafordshire Terrier",
      "American Stafford",
    ],
  },
  {
    name: "Australian Cattle Dog",
    matches: [
      "Blue Heeler",
      "Blue Heller",
      "Blue Hiller",
      "Red Heeler",
      "Australian Catle Dog",
      "Boiadeiro Australiano",
    ],
  },
  {
    name: "Australian Silky Terrier",
    matches: ["Silky Terrier", "Australian Silk Terrier"],
  },
  {
    name: "Barbado da Terceira",
    matches: [],
  },
  {
    name: "Basenji",
    matches: ["Basenge", "Basengi", "Bazenji"],
  },
  {
    name: "Basset Artesiano Normando",
    matches: ["Basset Artesiano", "Basset Normando"],
  },
  {
    name: "Basset Azul da Gasconha",
    matches: [],
  },
  {
    name: "Basset Fulvo da Bretanha",
    matches: [],
  },
  {
    name: "Basset Hound",
    matches: ["Basset Round", "Baset Hound", "Bassê Hound", "Bassethound"],
  },
  {
    name: "Beagle",
    matches: ["Bigle", "Beagol", "Bigol", "Beagle"],
  },
  {
    name: "Bearded Collie",
    matches: ["Collie Barbudo", "Bearded Coli"],
  },
  {
    name: "Bedlington Terrier",
    matches: ["Bedligton Terrier", "Bedlinton Terrier"],
  },
  {
    name: "Bichon Bolonhês",
    matches: ["Bichon Bolones", "Bichon Bolonhes"],
  },
  {
    name: "Bichon Frisé",
    matches: ["Bichon Frise", "Bichon Frisê", "Bixon Frise", "Buchon Frise"],
  },
  {
    name: "Bichon Havanês",
    matches: ["Bichon Havanes", "Bixon Havanes"],
  },
  {
    name: "Biewer Terrier",
    matches: ["Biwer Terrier", "Biewer Yorkshire", "Bewer Terrier"],
  },
  {
    name: "Bloodhound",
    matches: ["Blood Hound", "Bludhound", "Blodhound"],
  },
  {
    name: "Boerboel",
    matches: ["Boer Boel", "Borbel", "Boerbel"],
  },
  {
    name: "Boiadeiro de Appenzell",
    matches: ["Boieiro de Appenzell", "Appenzell"],
  },
  {
    name: "Boiadeiro de Berna",
    matches: [
      "Bernese",
      "Boiadeiro Bernês",
      "Bouvier Bernois",
      "Boiadeiro de Berna",
    ],
  },
  {
    name: "Boiadeiro de Entlebuch",
    matches: ["Boieiro de Entlebuch", "Boiadeiro Enterbuch", "Entlebucher"],
  },
  {
    name: "Boiadeiro de Flandres",
    matches: ["Boieiro de Flandres", "Bouvier des Flandres"],
  },
  {
    name: "Border Collie",
    matches: ["Boder Collie", "Border Coli", "Border Colie", "Bordercollie"],
  },
  {
    name: "Border Terrier",
    matches: ["Boder Terrier"],
  },
  {
    name: "Borzoi",
    matches: ["Galgo Russo", "Borzói", "Borzzoi"],
  },
  {
    name: "Boston Terrier",
    matches: ["Boston Terier", "Bóston Terrier"],
  },
  {
    name: "Boxer",
    matches: ["Bóxer", "Boxe", "Boxxer"],
  },
  {
    name: "Braco Alemão de Pêlo Curto",
    matches: ["Braco Alemao", "Braco Alemão"],
  },
  {
    name: "Braco Alemão de Pêlo Duro",
    matches: ["Deutscher Drahthaar", "Braco Alemão Pelo Duro"],
  },
  {
    name: "Braco de Auvergne",
    matches: [],
  },
  {
    name: "Braco Italiano",
    matches: ["Bracco Italiano"],
  },
  {
    name: "Braco Tirolês",
    matches: ["Braco Tiroles"],
  },
  {
    name: "Bull Terrier",
    matches: ["Bull Terier", "Bul Terrier", "Bullterrier"],
  },
  {
    name: "Bull Terrier Miniatura",
    matches: ["Mini Bull Terrier", "Bull Terrier Mini"],
  },
  {
    name: "Bulldog Americano",
    matches: ["Buldog Americano", "Buldogue Americano", "Bull Dog Americano"],
  },
  {
    name: "Bulldog Campeiro",
    matches: ["Buldogue Campeiro", "Buldog Campeiro"],
  },
  {
    name: "Bulldog Francês",
    matches: [
      "Buldog Frances",
      "Bulldog Frances",
      "Buldogue Francês",
      "Bull Dog Frances",
    ],
  },
  {
    name: "Bulldog Inglês",
    matches: [
      "Buldog Ingles",
      "Bulldog Ingles",
      "Buldogue Inglês",
      "Buldoog",
      "Bull Dog Ingles",
    ],
  },
  {
    name: "Bullmastiff",
    matches: ["Bull Mastiff", "Bull Mastif", "Bulmastiff", "Bull Mastife"],
  },
  {
    name: "Cairn Terrier",
    matches: ["Cain Terrier", "Cairn Terier", "Kairn Terrier"],
  },
  {
    name: "Cane Corso",
    matches: ["Canecorso", "Cani Corso", "Cane Curso", "Caneco Corso"],
  },
  {
    name: "Cão d'Água Americano",
    matches: ["Cao d'Agua Americano"],
  },
  {
    name: "Cão d'Água Espanhol",
    matches: ["Cao d'Agua Espanhol"],
  },
  {
    name: "Cão d'Água Frisão",
    matches: ["Cao d'Agua Frisao", "Frisão"],
  },
  {
    name: "Cão d'Água Português",
    matches: ["Cao d'Agua Portugues"],
  },
  {
    name: "Cão da Carolina",
    matches: ["Cao da Carolina"],
  },
  {
    name: "Cão da Serra da Estrela",
    matches: ["Cao da Serra da Estrela", "Serra da Estrela"],
  },
  {
    name: "Cão de Artois",
    matches: [],
  },
  {
    name: "Cão de Canaã",
    matches: ["Cao de Canaa", "Cão de Canaa"],
  },
  {
    name: "Cão de Castro Laboreiro",
    matches: ["Castro Laboreiro"],
  },
  {
    name: "Cão de Crista Chinês",
    matches: ["Chinese Crested", "Crista Chines", "Cao de Crista Chines"],
  },
  {
    name: "Cão de Fila de São Miguel",
    matches: ["Fila de Sao Miguel"],
  },
  {
    name: "Cão de Gado Transmontano",
    matches: [],
  },
  {
    name: "Cão de Lontra",
    matches: ["Otterhound", "Cao de Lontra"],
  },
  {
    name: "Cão de Montanha dos Pireneus",
    matches: [
      "Cão dos Pireneus",
      "Montanha dos Pireneus",
      "Cao da Montanha dos Pirineus",
    ],
  },
  {
    name: "Cão do Ariège",
    matches: [],
  },
  {
    name: "Cão do Atlas",
    matches: [],
  },
  {
    name: "Cão do Faraó",
    matches: ["Cao do Farao", "Cão do Farao"],
  },
  {
    name: "Cão Leopardo da Catahoula",
    matches: ["Catahoula"],
  },
  {
    name: "Cão Lobo Checoslovaco",
    matches: [
      "Cao Lobo Checoslovaco",
      "Lobo Checoslovaco",
      "Cão Lobo Tchecoslovaco",
    ],
  },
  {
    name: "Cavalier King Charles Spaniel",
    matches: [
      "Cavalier King Charles",
      "Cavaler King Charles",
      "Cavalier King Charlie",
      "King Charles Spaniel",
    ],
  },
  {
    name: "Chesapeake Bay Retriever",
    matches: ["Chesapeake Retriever"],
  },
  {
    name: "Chihuahua",
    matches: [
      "Chiuaua",
      "Chihuaua",
      "Chiuauá",
      "Xiuaua",
      "Chuhuahua",
      "Chiwawa",
    ],
  },
  {
    name: "Chow Chow",
    matches: ["Chowchow", "Chau Chau", "Xau Xau", "Chow-Chow", "Tchau Tchau"],
  },
  {
    name: "Cimarrón Uruguaio",
    matches: ["Cimarron Uruguaio", "Cimarron", "Cimarrão", "Cimarron Uruguayo"],
  },
  {
    name: "Cirneco do Etna",
    matches: ["Cirneco dell'Etna"],
  },
  {
    name: "Clumber Spaniel",
    matches: ["Clamber Spaniel"],
  },
  {
    name: "Cocker Spaniel Americano",
    matches: ["Coker Spaniel Americano", "Cocker Americano"],
  },
  {
    name: "Cocker Spaniel Inglês",
    matches: ["Coker Spaniel Ingles", "Cocker Ingles", "Cocker Spagnel"],
  },
  {
    name: "Collie",
    matches: ["Colie", "Cólie", "Coley"],
  },
  {
    name: "Coonhound Preto e Branco",
    matches: ["Coonhound"],
  },
  {
    name: "Coton de Tulear",
    matches: ["Coton de Tuléar", "Cotton de Tulear", "Coton Tulear"],
  },
  {
    name: "Curly-Coated Retriever",
    matches: ["Curly Coated Retriever", "Retriever Pelo Encaracolado"],
  },
  {
    name: "Cuvac Eslovaco",
    matches: [],
  },
  {
    name: "Dachsbracke",
    matches: [],
  },
  {
    name: "Dachshund",
    matches: [
      "Daschund",
      "Dachsund",
      "Dachshound",
      "Dashound",
      "Dacshund",
      "Teckel",
      "Salsicha",
      "Dachound",
    ],
  },
  {
    name: "Dálmata",
    matches: ["Dalmata", "Dalmatian", "Dálmato", "Dalmácio"],
  },
  {
    name: "Dandie Dinmont Terrier",
    matches: ["Dandie Dinmont"],
  },
  {
    name: "Deerhound",
    matches: ["Deer Hound", "Dirhound"],
  },
  {
    name: "Doberman",
    matches: ["Dobermann", "Doberma", "Dobberman", "Doberman Pinscher"],
  },
  {
    name: "Dogo Argentino",
    matches: ["Dogue Argentino", "Dogo Argentin", "Dogo Argetino"],
  },
  {
    name: "Dogue Alemão",
    matches: ["Dogue Alemao", "Dog Alemão", "Dogue Aleman"],
  },
  {
    name: "Dogue Brasileiro",
    matches: ["Dogue Brasileiro"],
  },
  {
    name: "Dogue Canário",
    matches: ["Dogue Canario", "Presa Canario", "Dogo Canario"],
  },
  {
    name: "Dogue de Bordeaux",
    matches: [
      "Dogue de Bordeux",
      "Dogue de Bordéus",
      "Dog Bordeaux",
      "Dogue Bordeaux",
    ],
  },
  {
    name: "Drever",
    matches: [],
  },
  {
    name: "Elkhound Norueguês",
    matches: ["Elkhound Noruegues"],
  },
  {
    name: "Epagneul Breton",
    matches: ["Spaniel Bretão", "Epagnoul Breton", "Epagneul Bretão"],
  },
  {
    name: "Esquimó Americano",
    matches: ["American Eskimo Dog", "Esquimo Americano", "Eskimo Americano"],
  },
  {
    name: "Eurasier",
    matches: ["Eurasie", "Eurásia"],
  },
  {
    name: "Field Spaniel",
    matches: [],
  },
  {
    name: "Fila Brasileiro",
    matches: ["Fila", "Filla Brasileiro", "Fila Brasileira"],
  },
  {
    name: "Flat-Coated Retriever",
    matches: ["Flat Coated Retriever", "Flat Retriever"],
  },
  {
    name: "Fox Paulistinha",
    matches: ["Foxinho Paulistinha", "Fox Paulista", "Terrier Brasileiro"],
  },
  {
    name: "Fox Terrier",
    matches: ["Foxterrier", "Fox Terier", "Fox Terrir"],
  },
  {
    name: "Foxhound Americano",
    matches: ["Fox Hound Americano"],
  },
  {
    name: "Foxhound Inglês",
    matches: ["Fox Hound Ingles", "Foxhound Ingles"],
  },
  {
    name: "Galgo Afegão",
    matches: ["Afghan Hound", "Galgo Afegao", "Galgo Afgão"],
  },
  {
    name: "Galgo Espanhol",
    matches: ["Galgo Espanol"],
  },
  {
    name: "Galgo Italiano",
    matches: ["Greyhound Italiano", "Italian Greyhound", "Galguinho Italiano"],
  },
  {
    name: "Glen of Imaal Terrier",
    matches: [],
  },
  {
    name: "Golden Retriever",
    matches: [
      "Golden Retriver",
      "Golden Retreiver",
      "Golden Retiviver",
      "Goden Retriever",
      "Golden Retrivier",
      "Golden",
    ],
  },
  {
    name: "Grande Basset Grifo da Vendéia",
    matches: ["Grande Basset Grifo da Vendeia"],
  },
  {
    name: "Grande Boiadeiro Suíço",
    matches: ["Grande Boieiro Suico", "Boiadeiro Suíço"],
  },
  {
    name: "Grande Gascão Saintongeois",
    matches: [],
  },
  {
    name: "Grande Grifo da Vendéia",
    matches: ["Grande Grifo da Vendeia"],
  },
  {
    name: "Greyhound",
    matches: ["Galgo Inglês", "Grey Hound", "Grayhound", "Greihound"],
  },
  {
    name: "Griffon de Apontar",
    matches: ["Grifo de Apontar"],
  },
  {
    name: "Griffon de Bruxelas",
    matches: ["Grifon de Bruxelas", "Grifo de Bruxelas", "Griffon Bruxelas"],
  },
  {
    name: "Grifo Nivernais",
    matches: [],
  },
  {
    name: "Hamiltonstövare",
    matches: ["Hamiltonstovare", "Hamilton Stovare"],
  },
  {
    name: "Harrier",
    matches: ["Harier", "Harrer"],
  },
  {
    name: "Hovawart",
    matches: ["Hovawarte", "Hovaward"],
  },
  {
    name: "Husky Siberiano",
    matches: [
      "Husk Siberiano",
      "Rusky Siberiano",
      "Husky Siberano",
      "Haski Siberiano",
      "Husky",
    ],
  },
  {
    name: "Jack Russell Terrier",
    matches: [
      "Jack Russel Terrier",
      "Jack Russel",
      "Jack Hassel",
      "Jack Russell",
      "Jek Russel",
    ],
  },
  {
    name: "Japanese Chin",
    matches: [
      "Japan Chin",
      "Spaniel Japonês",
      "Chin Japones",
      "Japanese Chinn",
    ],
  },
  {
    name: "Kai Ken",
    matches: ["Kai ken", "Kaiken"],
  },
  {
    name: "Keeshond",
    matches: ["Keeshund", "Keshond", "Wolfsspitz", "Quishond"],
  },
  {
    name: "Kelpie Australiano",
    matches: ["Kelpie", "Pastor Kelpie", "Australian Kelpie"],
  },
  {
    name: "Kerry Blue Terrier",
    matches: ["Kerry Blue", "Keri Blue Terrier"],
  },
  {
    name: "Komondor",
    matches: ["Komodor", "Comondor"],
  },
  {
    name: "Kuvasz",
    matches: ["Kuvac", "Kuvas", "Cuvasz"],
  },
  {
    name: "Labrador Retriever",
    matches: ["Labrador", "Labrado", "Labrador Retriver", "Labradô"],
  },
  {
    name: "Lakeland Terrier",
    matches: ["Lakland Terrier"],
  },
  {
    name: "Lhasa Apso",
    matches: [
      "Lhasa Apso",
      "Lasa Apso",
      "Laza Apso",
      "Lhasaapso",
      "Lhasa Aspo",
      "Lhasa",
    ],
  },
  {
    name: "Leão da Rodésia",
    matches: ["Rhodesian Ridgeback", "Leao da Rodesia", "Rodesian Ridgeback"],
  },
  {
    name: "Leonberger",
    matches: ["Leon Berger", "Leomberger", "Leonberg"],
  },
  {
    name: "Lulu da Pomerânia",
    matches: [
      "Lulu da Pomerania",
      "Lulu da Pomeranha",
      "Spitz Alemão Anão",
      "Pomeranian",
      "Lulu Pomerania",
    ],
  },
  {
    name: "Malamute do Alasca",
    matches: ["Malamute", "Malamute do Alaska", "Malamut", "Alaskan Malamute"],
  },
  {
    name: "Maltês",
    matches: ["Maltes", "Maltês", "Malteus", "Maltese", "Bichon Maltês"],
  },
  {
    name: "Manchester Terrier",
    matches: ["Manchester Terier", "Manchaster Terrier"],
  },
  {
    name: "Mastim Espanhol",
    matches: ["Mastim Espanol", "Mastiff Espanhol"],
  },
  {
    name: "Mastim Inglês",
    matches: ["Mastiff", "Mastim Ingles", "Mastife Ingles"],
  },
  {
    name: "Mastim Napolitano",
    matches: ["Mastiff Napolitano", "Mastim Napolitan"],
  },
  {
    name: "Mastim Tibetano",
    matches: ["Mastiff Tibetano", "Mastim Tibetan"],
  },
  {
    name: "Mini Pastor Americano",
    matches: ["Mini Pastor Americano", "Pastor Americano Miniatura"],
  },
  {
    name: "Norfolk Terrier",
    matches: ["Norfok Terrier"],
  },
  {
    name: "Norwich Terrier",
    matches: ["Norwick Terrier", "Norwitch Terrier"],
  },
  {
    name: "Nova Scotia Duck Tolling Retriever",
    matches: ["Nova Scotia Retriever", "Toller"],
  },
  {
    name: "Old English Sheepdog",
    matches: ["Bobtail", "Old English Sheep Dog", "Sheepdog Ingles"],
  },
  {
    name: "Ovelheiro Gaúcho",
    matches: ["Ovelheiro Gaucho"],
  },
  {
    name: "Papillon",
    matches: ["Papilon", "Papillón", "Papyon", "Papilhon"],
  },
  {
    name: "Pastor Alemão",
    matches: ["Pastor Alemao", "Pastor Alemã", "Pastor Aleman", "Pasto Alemão"],
  },
  {
    name: "Pastor Australiano",
    matches: ["Australian Shepherd", "Pastor Australiando"],
  },
  {
    name: "Pastor Belga",
    matches: [
      "Pastor Belga Malinois",
      "Pastor Belga Tervuren",
      "Malinois",
      "Pastor Belga Groenendael",
    ],
  },
  {
    name: "Pastor Bergamasco",
    matches: ["Bergamasco"],
  },
  {
    name: "Pastor Branco Suíço",
    matches: ["Pastor Suico", "Pastor Branco Suico", "Pastor Suíço"],
  },
  {
    name: "Pastor Catalão",
    matches: ["Pastor Catalao", "Pastor Catalán"],
  },
  {
    name: "Pastor da Mantiqueira",
    matches: [],
  },
  {
    name: "Pastor da Picardia",
    matches: [],
  },
  {
    name: "Pastor de Anatólia",
    matches: ["Pastor de Anatolia", "Anatolian Shepherd"],
  },
  {
    name: "Pastor de Beauce",
    matches: ["Beauceron"],
  },
  {
    name: "Pastor de Brie",
    matches: ["Briard"],
  },
  {
    name: "Pastor de Shetland",
    matches: ["Shetland Sheepdog", "Pastor Shetland", "Sheltie"],
  },
  {
    name: "Pastor do Cáucaso",
    matches: ["Pastor do Caucaso", "Caucasian Shepherd"],
  },
  {
    name: "Pastor dos Pireneus",
    matches: ["Pastor dos Pirineus"],
  },
  {
    name: "Pastor Holandês",
    matches: ["Pastor Holandes", "Dutch Shepherd"],
  },
  {
    name: "Pastor Maremano Abruzês",
    matches: ["Pastor Maremano Abruzes", "Pastor dos Abruzzos", "Maremma"],
  },
  {
    name: "Pastor Polaco de Tatra",
    matches: [],
  },
  {
    name: "Pastor Polonês da Planície",
    matches: ["Pastor Polones da Planicie"],
  },
  {
    name: "Pelado Mexicano",
    matches: ["Xoloitzcuintle", "Pelado Mexicano", "Xolo"],
  },
  {
    name: "Pequeno Basset Grifo da Vendéia",
    matches: ["Pequeno Basset Grifo da Vendeia"],
  },
  {
    name: "Pequeno Cão Leão",
    matches: ["Löwchen", "Lowchen", "Pequeno Cao Leao"],
  },
  {
    name: "Pequinês",
    matches: ["Pequines", "Pekines", "Pequinez", "Pequim", "Pekingese"],
  },
  {
    name: "Perdigueiro Português",
    matches: ["Perdigueiro Portugues"],
  },
  {
    name: "Perdiguero de Burgos",
    matches: ["Perdigueiro de Burgos"],
  },
  {
    name: "Pinscher",
    matches: ["Pincher", "Pinsher", "Pintcher", "Pincher Alemão", "Pinsche"],
  },
  {
    name: "Pinscher Miniatura",
    matches: [
      "Pincher Miniatura",
      "Pinsher Miniatura",
      "Mini Pinscher",
      "Pincher Mini",
    ],
  },
  {
    name: "Plott Hound",
    matches: ["Plott", "Plot Hound"],
  },
  {
    name: "Podenco Andaluz",
    matches: ["Podengo Andaluz"],
  },
  {
    name: "Podengo Canário",
    matches: ["Podengo Canario"],
  },
  {
    name: "Podengo Ibicenco",
    matches: ["Podenco Ibicenco"],
  },
  {
    name: "Podengo Português",
    matches: ["Podengo Portugues", "Podenco Portugues"],
  },
  {
    name: "Pointer Inglês",
    matches: ["Pointer", "Pointer Ingles", "Ponter"],
  },
  {
    name: "Poodle",
    matches: [
      "Pudle",
      "Pudel",
      "Poodel",
      "Puddle",
      "Pulde",
      "Caniche",
      "Poddle",
    ],
  },
  {
    name: "Prazsky Krysarik",
    matches: [],
  },
  {
    name: "Pudelpointer",
    matches: [],
  },
  {
    name: "Pug",
    matches: ["Pugue", "Pag", "Pugy"],
  },
  {
    name: "Puli",
    matches: ["Pulli", "Puly"],
  },
  {
    name: "Rafeiro do Alentejo",
    matches: ["Rafeiro Alentejano"],
  },
  {
    name: "Ratonero Bodeguero Andaluz",
    matches: ["Ratonero Andaluz"],
  },
  {
    name: "Rottweiler",
    matches: [
      "Rotweiler",
      "Rottweiller",
      "Rotwailer",
      "Rotvailer",
      "Roteweiler",
      "Rotwiler",
      "Rottwailer",
    ],
  },
  {
    name: "Sabujo Espanhol",
    matches: ["Sabujo Espanol"],
  },
  {
    name: "Saluki",
    matches: ["Saluqui", "Salúki", "Saluky"],
  },
  {
    name: "Samoieda",
    matches: ["Samoiedo", "Samoeida", "Samoyeda", "Samoyed", "Samueida"],
  },
  {
    name: "São Bernardo",
    matches: ["Sao Bernardo", "São Bernado", "Saint Bernard", "Sambernardo"],
  },
  {
    name: "Schipperke",
    matches: ["Schiperke", "Skiperke"],
  },
  {
    name: "Schnauzer",
    matches: [
      "Schnauser",
      "Snauzer",
      "Esnauzer",
      "Schinauzer",
      "Xnauzer",
      "Schnouzer",
      "Snauser",
    ],
  },
  {
    name: "Scottish Terrier",
    matches: ["Terrier Escoces", "Scotish Terrier", "Scottish Terier"],
  },
  {
    name: "Sealyham Terrier",
    matches: [],
  },
  {
    name: "Serra de Aires",
    matches: ["Serra D'Aires", "Cão da Serra de Aires"],
  },
  {
    name: "Setter Gordon",
    matches: ["Seter Gordon"],
  },
  {
    name: "Setter Inglês",
    matches: ["Seter Ingles", "Setter Ingles"],
  },
  {
    name: "Setter Irlandês",
    matches: ["Seter Irlandes", "Setter Irlandes"],
  },
  {
    name: "Shar Pei",
    matches: ["Shar-pei", "Shar pei", "Sharpei", "Char Pei", "Xarpei"],
  },
  {
    name: "Shiba Inu",
    matches: ["Shiba", "Shiba-inu", "Xiba Inu", "Shibainu"],
  },
  {
    name: "Shih Tzu",
    matches: [
      "Shitzu",
      "Shih-tzu",
      "Shihtzu",
      "Chitzu",
      "Shitsu",
      "Chi Tzu",
      "Shih tzu",
      "Shih-zu",
      "Chitsu",
      "Cheetos",
    ],
  },
  {
    name: "Skye Terrier",
    matches: ["Sky Terrier"],
  },
  {
    name: "Slougui",
    matches: ["Sloughi"],
  },
  {
    name: "Soft Coated Wheaten Terrier",
    matches: ["Wheaten Terrier"],
  },
  {
    name: "Spaniel d'Água Irlandês",
    matches: ["Spaniel d'Agua Irlandes", "Irish Water Spaniel"],
  },
  {
    name: "Spaniel do Tibete",
    matches: ["Tibetan Spaniel", "Spaniel Tibetano"],
  },
  {
    name: "Spinone Italiano",
    matches: ["Spinone", "Espinone Italiano"],
  },
  {
    name: "Spitz Alemão",
    matches: [
      "Spitz Alemao",
      "Spits Alemão",
      "Espitz Alemão",
      "Spitz Aleman",
      "Spitz",
    ],
  },
  {
    name: "Spitz Finlandês",
    matches: ["Spitz Finlandes", "Spits Finlandes"],
  },
  {
    name: "Spitz Japonês",
    matches: ["Spitz Japones", "Spits Japones", "Espitz Japones"],
  },
  {
    name: "Springer Spaniel Galês",
    matches: ["Springer Spaniel de Gales", "Welsh Springer Spaniel"],
  },
  {
    name: "Springer Spaniel Inglês",
    matches: ["Springer Spaniel Ingles", "Springer Ingles", "Springer Spagnel"],
  },
  {
    name: "Staffordshire Bull Terrier",
    matches: ["Stafford Bull Terrier", "Staffordshire", "Stafford Bull"],
  },
  {
    name: "Sussex Spaniel",
    matches: ["Sussex Spagnel"],
  },
  {
    name: "Terra Nova",
    matches: ["Terranova", "Terra-Nova", "Terra Nova", "Newfoundland"],
  },
  {
    name: "Terrier Alemão de Caça",
    matches: ["Terrier Alemao de Caca", "Jagdterrier"],
  },
  {
    name: "Terrier Australiano",
    matches: ["Australian Terrier"],
  },
  {
    name: "Terrier Irlandês",
    matches: ["Terrier Irlandes", "Irish Terrier"],
  },
  {
    name: "Terrier Miniatura Preto e Castanho",
    matches: ["English Toy Terrier"],
  },
  {
    name: "Terrier Preto da Rússia",
    matches: ["Terrier Preto da Russia", "Black Russian Terrier"],
  },
  {
    name: "Terrier Tibetano",
    matches: ["Tibetan Terrier", "Terrier Tibetan"],
  },
  {
    name: "Tosa Inu",
    matches: ["Tosa inu", "Tossa Inu", "Tosa-inu"],
  },
  {
    name: "Veadeiro Pampeano",
    matches: [],
  },
  {
    name: "Vizsla",
    matches: ["Vizla", "Visla", "Vizsra", "Vísla", "Braco Húngaro"],
  },
  {
    name: "Volpino Italiano",
    matches: ["Vulpino Italiano", "Volpino"],
  },
  {
    name: "Weimaraner",
    matches: [
      "Wimaraner",
      "Veimaraner",
      "Weimaramer",
      "Waimaraner",
      "Weimaramer",
    ],
  },
  {
    name: "Welsh Corgi Cardigan",
    matches: ["Corgi Cardigan", "Welsh Corgi"],
  },
  {
    name: "Welsh Corgi Pembroke",
    matches: ["Corgi Pembroke", "Corgi", "Welsh Corgi"],
  },
  {
    name: "Welsh Terrier",
    matches: ["Welsh Terier"],
  },
  {
    name: "West Highland White Terrier",
    matches: ["West Highland Terrier", "Westie", "West Higland White Terrier"],
  },
  {
    name: "Whippet",
    matches: ["Whipet", "Wippet", "Whippett", "Uipet"],
  },
  {
    name: "Wolfhound Irlandês",
    matches: ["Wolfhound Irlandes", "Irish Wolfhound"],
  },
  {
    name: "Yorkshire Terrier",
    matches: [
      "Yorkshire",
      "Yorkshaire",
      "Iorkshire",
      "Yorkichair",
      "York",
      "Yorky",
      "Yorkshire Terrier",
      "Yorkshire Terier",
      "Iorquixaier",
    ],
  },
  {
    name: "Goldendoodle",
    matches: ["Golden Doodle", "GoldenDoodle", "Golden doodle"],
  },
  {
    name: "Labradoodle",
    matches: ["Labradodle", "Labra Doodle", "Labradudle"],
  },
  {
    name: "Bernedoodle",
    matches: ["Bernedodle", "Berne Doodle"],
  },
  {
    name: "Aussiedoodle",
    matches: ["Aussie Doodle", "Ausidoodle"],
  },
  {
    name: "Cavapoo",
    matches: ["Cava Poo", "Cavapu"],
  },
  {
    name: "Cavachon",
    matches: ["Cava Chon"],
  },
  {
    name: "Cockapoo",
    matches: ["Cocapoo", "Cocker Poo", "Cocapu"],
  },
  {
    name: "Maltipoo",
    matches: ["Maltepoo", "Malti Poo", "Maltipu", "Maltepo"],
  },
  {
    name: "Morkie",
    matches: ["Morkey", "Mork"],
  },
  {
    name: "Shorkie",
    matches: ["Shorky", "Shorkey"],
  },
  {
    name: "Yorkiepoo",
    matches: ["Yorkie Poo", "Yorkipoo"],
  },
  {
    name: "Pomsky",
    matches: ["Pomski", "Ponsky", "Pomsk"],
  },
  {
    name: "Kyi-Leo",
    matches: ["Kyi leo", "Kyleo"],
  },
  {
    name: "Exotic Bully",
    matches: ["Exotic Buly", "Exótic Bully"],
  },
  // SRD (sem raça definida): o que o cliente costuma responder quando o pet não
  // tem raça (ou ele não sabe qual é) + os nomes que as lojas usam para cadastrar
  // SRD. Reconhecido como "SRD", a busca na base da loja encontra o SRD da
  // espécie informada (ex.: "SRD" para cão, "SRD - Gato" para gato).
  // Nomes de loja que citam uma raça de exemplo (ex.: "SRD - Grande Pelo Curto
  // (Ex: Dálmata)") entram sem o exemplo — com ele, "Dálmata" seria reconhecido
  // como SRD.
  {
    name: "SRD",
    matches: [
      // Respostas comuns do cliente
      "Vira lata",
      "Vira-lata",
      "Viralata",
      "Vira latas",
      "Viralatinha",
      "Vira latinha",
      "Sem raça definida",
      "Sem raça",
      "Mestiço",
      "Mestiça",
      "Misturado",
      "Misturada",
      "Não sei",
      "Não sei a raça",
      "Não tem raça",

      // Nomes de SRD cadastrados pelas lojas — cães
      "SRD - Sem Raça Definida",
      "SRD (35-50cm ou até 20 KG)",
      "SRD (50-60cm ou até 40KG)",
      "SRD (acima 60cm ou acima de 40KG)",
      "SRD (até 35cm ou até 10KG)",
      "SRD (Até 5KG)",
      "SRD Médio",
      "SRD - Médio",
      "SRD - Sem Raça Definida (ACIMA 60CM)",
      "SRD - Sem Raça Definida (ATÉ 35 CM)",
      "SRD - Grande",
      "SRD - Pequeno",
      "SRD - Sem Raça Definida (35 A 45 CM)",
      "SRD - Sem Raça Definida (45 A 60CM)",
      "SRD pequeno",
      "SRD filhote",
      "SRD filhote P",
      "SRD - Sem Raça Definida P",
      "SRD Grande",
      "SRD - Sem Raça Definida G",
      "SRD - Sem Raça Definida Grande",
      "SRD - Sem Raça Definida M",
      "SRD - Sem Raça Definida Médio",
      "SRD G",
      "SRD GRANDE PELO LONGO",
      "SRD M",
      "SRD MEDIO PELO CURTO",
      "SRD Pequeno Curto",
      "SRD Pequeno Longo",
      "SRD Pequeno Médio",
      "SRD - 10,1 a 20kg - PELO CURTO",
      "SRD - 10,1 a 20kg - PELO LONGO",
      "SRD - 20,1 a 30kg - PELO CURTO",
      "SRD - 20,1 a 30kg - PELO LONGO",
      "SRD - 4,1 a 10kg - PELO CURTO",
      "SRD - 4,1 a 10kg - PELO LONGO",
      "SRD - Acima de 30kg - PELO CURTO",
      "SRD - Acima de 30kg - PELO LONGO",
      "SRD - Até 4kg - PELO CURTO",
      "SRD - Até 4kg - PELO LONGO",
      "srd grande pelo curto",
      "srd medio pelo longo",
      "SRD P",
      "srd pequeno pelo curto",
      "srd pequeno pelo longo",
      "SRD - Porte Pequeno",
      "SRD - Sem Raça Definida Pequeno",
      "SRD (COM TOSA)",
      "SRD GG- PELO CURTO (ACIMA 60CM)",
      "SRD GG (PELO LONGO)",
      "srd gigante",
      "SRD - Gigante",
      "SRD G- PELO CURTO (45 A 60CM)",
      "SRD G (PELO LONGO)",
      "SRD M- PELO CURTO (35 A 45 CM)",
      "SRD M (pelo longo)",
      "srd pequeno pelo medio",
      "SRD - Porte Grande",
      "SRD - Porte Médio",
      "SRD P- PELO CURTO (ATÉ 35 CM)",
      "SRD P (PELO LONGO)",
      "Cão SRD Gigante",
      "Cão SRD Grande",
      "Cão SRD Médio",
      "Cão SRD Pequeno Pelo Curto",
      "Cão SRD Pequeno Pelo Longo",
      "Cão SRD Pequeno Pelo Médio",
      "SRD - 13kg à 20kg",
      "SRD - 21kg à 30kg",
      "SRD - 31kg à 40kg",
      "SRD - 5kg à 12kg",
      "SRD até 10kg",
      "SRD até 20kg",
      "SRD G (+30Kg)",
      "SRD - Gigante/Curto",
      "SRD - Gigante/Longo",
      "SRD - Gigante Pelo Longo",
      "SRD - Grande/Curto",
      "SRD - Grande/Longo",
      "SRD - grande pelo curto",
      "SRD GRANDE PELO MEDIO",
      "SRD M (15 a 30Kg)",
      "SRD - Mais 40kg",
      "SRD - Médio/Curto",
      "SRD - Médio/Longo",
      "SRD MEDIO PELO MEDIO",
      "SRD - Menos 5kg",
      "SRD Micro",
      "SRD - MINI",
      "SRD - P",
      "SRD P (até 15Kg)",
      "SRD - Pelo médio",
      "SRD - Pequeno/Curto",
      "SRD - Pequeno/Longo",
      "SRD - P pelo longo",
      "SRD - Sem Raça Definida 11kg a 20kg pelo acima de 3 dedos",
      "SRD - Sem Raça Definida 11kg a 20kg pelo até 3 dedos",
      "SRD - Sem Raça Definida 21kg a 40kg pelo acima de 3 dedos",
      "SRD - Sem Raça Definida 21kg a 40kg pelo até 3 dedos",
      "SRD - Sem Raça Definida 3kg a 10kg pelo acima de 3 dedos",
      "SRD - Sem Raça Definida 3kg a 10kg pelo até 3 dedos",
      "SRD - Sem Raça Definida acima de 41 kg pelo até 3 dedos",
      "SRD - Sem Raça Definida acima de 41 kg pelo mais de 3 dedos",
      "SRD - Sem Raça Definida até 3kg pelo até 3 dedos",
      "SRD - Sem Raça Definida até 3kg pelo mais de 3 dedos",
      "SRD (Sem Raça Definida) G (25 à 35kg) PELO CURTO",
      "SRD (Sem Raça Definida) G (25 à 35Kg) PELO LONGO",
      "SRD (Sem Raça Definida) GG (Acima de 35kg) PELO CURTO",
      "SRD (Sem Raça Definida) GG (Acima de 35kg) PELO LONGO",
      "SRD - Sem Raça Definida (Grande - Pelo Curto)",
      "SRD - Sem Raça Definida (Grande - Pelo Médio)",
      "SRD (Sem Raça Definida) M (10 à 20kg) PELO CURTO",
      "SRD (Sem Raça Definida) M (10 à 20kg) PELO LONGO",
      "SRD - Sem Raça Definida (Médio) Pelo Curto",
      "SRD (Sem Raça Definida) P (0 à 10kg) PELO CURTO",
      "SRD (Sem Raça Definida) P (0 à 10kg) PELO LONGO",
      "SRD - Sem Raça Definida - Pequeno",
      "SRD - Sem Raça Definida (Pequeno)",
      "CÃO SRD - filhote até 6 meses (porte pequeno)",
      "CÃO SRD grande (pelo curto)",
      "CÃO SRD grande (pelo médio)",
      "CÃO SRD Médio (Pelo curto)",
      "CÃO SRD Médio (Pelo médio)",
      "CÃO SRD Micro (pelo curto)",
      "CÃO SRD Micro (pelo médio)",
      "CÃO SRD Pequeno (Pelo curto)",
      "CÃO SRD Pequeno (pelo longo)",
      "CÃO SRD - Pequeno (Pelo médio)",
      "CÃO SRD Pequeno (pelo médio)",
      "Pé duro",
      "Raças não definidas - Grande",
      "Raças não definidas - Médio",
      "Raças não definidas - Pequeno",
      "SRD 01 GRANDE PELO CURTO",
      "SRD 01MEDIO PELO CURTO",
      "SRD 01 - Sem Raça Definida",
      "SRD 02 GRANDE PELO CURTO",
      "SRD 02 MEDIO PELO CURTO",
      "SRD 02 - Sem Raça Definida",
      "SRD - 03 A 10 KG pelo Curto",
      "SRD 03 GRANDE PELO MEDIO/ LONGO",
      "SRD 03 MEDIO PELO CURTO",
      "SRD 03 - Sem Raça Definida",
      "SRD 04 MEDIO PELO MEDIO",
      "SRD 04 - Sem Raça Definida",
      "SRD - 05 A 10 KG pelo Curto",
      "SRD 05 - Sem Raça Definida",
      "SRD 06 - Sem Raça Definida",
      "SRD - 10-15Kg/Medio",
      "SRD (10,1 até 15kg) - Sem Raça Definida",
      "SRD (10 A 15KG)",
      "SRD 10 a 15 Kg",
      "SRD - 10kg até 15kg",
      "SRD (+ 12kg)",
      "Srd 13Kg 20 Kg",
      "SRD 14,6 A 19,5KG",
      "SRD 14,6 a 19,5KG Pelo médio",
      "SRD (15,1 até 25kg) - Sem Raça Definida",
      "SRD - 15-20kg/Medio",
      "SRD 16 a 25 Kg",
      "SRD 16 A 28kg",
      "SRD 19,6 A 24,5KG",
      "SRD 1 A 4,5KG",
      "SRD 1A 4,5KG Pelo médio",
      "SRD 1 (altura até 35cm)",
      "SRD - 20-25KG/Medio",
      "Srd 21Kg 30 Kg",
      "SRD 24,6 a 29,5KG",
      "SRD - 25-30KG/ Medio",
      "SRD 29,6 A 34,5KG",
      "SRD - 29 A 48KG",
      "SRD 2 (altura 35-45cm)",
      "SRD - 3-10kg /Pequeno",
      "Srd 31Kg 40 Kg",
      "SRD 34,6 A 39,5KG",
      "SRD (35-50cm ou até 20 KG) - Pelo Curto",
      "SRD 40KG FILHOTE",
      "Srd 41 Kg 60 Kg",
      "SRD 4,6 a 9,5KG",
      "SRD 4,6 A 9,5KG Pelo médio",
      "SRD (50-60cm ou até 40KG) - Pelo Curto",
      "Srd 5Kg Á 12Kg",
      "SRD 60,00",
      "SRD 70,00",
      "SRD 80,00",
      "SRD - 8 A 15KG",
      "SRD 90,00",
      "SRD 9,6 a 14,5kg",
      "SRD 9,6 a 14,5kg Pelo médio",
      "SRD acima 25 Kg",
      "SRD (acima 25kg) - Sem Raça Definida",
      "SRD (acima 60cm ou acima de 40KG) - Pelo Curto",
      "SRD (acima 60cm ou acima de 40KG) - Pelo Longo",
      "SRD - Acima de 15 kg",
      "SRD acima de 20kg",
      "SRD (até 10kg) - Sem Raça Definida",
      "SRD (até 12kg)",
      "SRD até 15kg",
      "SRD até 15 kg",
      "Srd até 25kg",
      "SRD (até 35cm ou até 10KG) - Pelo Curto",
      "SRD até 40kg",
      "SRD até 4kg",
      "SRD (Até 5KG) - Pelo Curto",
      "SRD (Até 5KG) - Pelo Longo",
      "SRD (até 7kg)",
      "SRD ate 7KG",
      "SRD - com pelo",
      "SRD - Curto",
      "SRD EXTRA G 90$",
      "SRD EXTRA GG 95$",
      "SRD - fiapo de manga/pelo duro G",
      "SRD - fiapo de manga/pelo duro M",
      "SRD - fiapo de manga/pelo duro P",
      "SRD - G",
      "SRD G 80$",
      "SRD GC",
      "SRD - G - Curto",
      "SRD GG 85$",
      "SRD GG Pelo Curto - (+45kg)",
      "SRD GG Pelo Longo- (+45kg)",
      "SRD GG Pelo Médio- (+45kg)",
      "SRD - Gigante acima de 30 kg",
      "SRD - Gigante/Médio",
      "SRD - Gigante / Pelo Curto",
      "SRD - Gigante Pelo Curto",
      "SRD -GIGANTE pelo curto",
      "SRD - Gigante / Pelo Longo",
      "SRD - gigante peludo",
      "SRD Gigante - Sem Raça Definida (Porte Gigante)",
      "SRD GL",
      "SRD - G - Longo",
      "SRD - G pelo Curto",
      "SRD G Pelo Curto - (26 a 44kg)",
      "SRD - G pelo Longo",
      "SRD G Pelo Longo - (26 a 44kg)",
      "SRD - G pelo Médio",
      "SRD G Pelo Médio - (26 a 44kg)",
      "SRD G PELUDO",
      "SRD GRANDE 1 - Sem Raça Definida",
      "SRD GRANDE 2 - Sem Raça Definida",
      "SRD Grande acima de 20,1kg - pelo curto",
      "SRD Grande acima de 20,1kg - pelo longo",
      "SRD - Grande (Acima de 20kg)",
      "SRD ( Grande - Curto)",
      "SRD Grande (de 20 à 30 Kg) Pelo Longo",
      "SRD -( Grande - Longo)",
      "SRD - ( Grande - Medio)",
      "SRD - Grande/Médio",
      "SRD Grande/ Pelagem longo",
      "SRD - Grande - Pelo curto",
      "SRD - Grande / Pelo Curto",
      "SRD GRANDE- PELO CURTO",
      "SRD - Grande - Pelo longo",
      "SRD - Grande / Pelo Longo",
      "SRD - Grande Pelo Longo",
      "SRD-GRANDE pelo longo",
      "SRD - Grande Pelo Médio",
      "SRD - grande peludo",
      "SRD GRANDE - Sem Raça Definida",
      "SRD Gr. (Pelo Curto)",
      "SRD Gr. (Pelo Longo)",
      "SRD Gr. (Pelo Medio)",
      "SRD G - Sem Raça Definida",
      "SRD G - Sem Raça definida grande",
      "SRD G- Sem raça definida Grande",
      "SRD - Intermedio (15 a 20 KG)",
      "SRD - M",
      "SRD M 75$",
      "SRD MC",
      "SRD - M - Curto",
      "SRD -Médio",
      "SRD Médio 10,1kg até 20kg",
      "SRD MÉDIO 1 - Sem Raça Definida",
      "SRD MÉDIO 2 - Sem Raça Definida",
      "SRD Médio (35-50cm ou de 10 até 20 KG) Pelo Longo",
      "SRD - Medio (Até 20kg)",
      "SRD - ( Medio- Curto)",
      "SRD MEDIO FILHOTE",
      "SRD - ( Medio - Longo)",
      "SRD - ( Medio - Medio)",
      "SRD - Médio/Médio",
      "SRD Médio/ Pelagem Médio",
      "SRD - Médio - Pelo curto",
      "SRD - Médio / Pelo Curto",
      "SRD - Médio Pelo Curto",
      "SRD - Médio, Pelo Curto",
      "SRD- MEDIO pelo curto",
      "SRD - Médio - Pelo longo",
      "SRD - Médio / Pelo Longo",
      "SRD - Médio Pelo Longo",
      "SRD - Médio, Pelo Longo",
      "SRD- MEDIO-PELO LONGO",
      "SRD - Médio Pelo Médio",
      "SRD - médio peludo",
      "SRD MÉDIO - Sem Raça Definida",
      "SRD Medio - Sem Raça Definida (Porte Medio)",
      "SRD Méd. (Pelo Curto)",
      "SRD Méd. (Pelo Longo)",
      "SRD Méd. (Pelo Medio)",
      "SRD M/G (acima de 15 kg) pelo curto, médio ou longo",
      "SRD MICRO 1- Sem Raça Definida",
      "SRD MICRO 2- Sem Raça Definida",
      "SRD - Micro ate 3kg",
      "SRD - Micro/Curto",
      "SRD - Micro/Longo",
      "SRD-MICRO- LONGO",
      "SRD - Micro/Médio",
      "SRD - Micro, Pelo Curto",
      "SRD- MICRO pelo curto",
      "SRD - Micro, Pelo Longo",
      "SRD MICRO- Sem Raça Definida",
      "SRD - Mini (Até 4kg)",
      "SRD Mini Pelo Curto - (Até 5kg)",
      "SRD - Mini Pelo Curto",
      "SRD Mini Pelo Longo - (Até 5kg)",
      "SRD - Mini Pelo Longo",
      "SRD - Mini Pelo Médio",
      "SRD mini - Sem Raça Definida -",
      "SRD Mini - Sem Raça Definida (Porte mini)",
      "SRD ML",
      "SRD - M - Longo",
      "SRD MM 70$",
      "SRD - M Pelo Curto",
      "SRD M Pelo Curto - (11 a 25kg)",
      "SRD -M pelo Longo",
      "SRD M Pelo Longo - (11 a 25kg)",
      "SRD - M Pelo Médio",
      "SRD M Pelo Médio - (11 a 25kg)",
      "SRD M PELUDO",
      "SRD M - Sem Raça Definida",
      "SRD M - Sem raça definida M",
      "SRD M - Sem raça definida médio",
      "SRD P 65$",
      "SRD PC",
      "SRD - P - Curto",
      "SRD - Pelo Curto 10.1 A 15K",
      "SRD PELO CURTO 10 A 13KG",
      "SRD PELO CURTO 14 A 20 KG",
      "SRD - Pelo Curto 15.1 A 20K",
      "SRD - Pelo Curto 20.1 A 30K",
      "SRD PELO CURTO 20 A 30KG",
      "SRD - Pelo Curto 30.1 A 50K",
      "SRD PELO CURTO 30 A 40 KG",
      "SRD PELO CURTO 4 A 9KG",
      "SRD - Pelo Curto 50.1 a 60 K",
      "SRD - Pelo Curto 5.1 A 10K",
      "SRD PELO CURTO ATE 4 KG",
      "SRD - Pelo Curto ATE 5K",
      "SRD - pelo curto G",
      "SRD - pelo curto M",
      "SRD - pelo curto P",
      "SRD - pelo duplo G",
      "SRD - pelo duplo M",
      "SRD - pelo duplo P",
      "SRD - pelo longo G",
      "SRD - pelo longo M",
      "SRD - pelo longo P",
      "SRD-PELO MÉDIO",
      "SRD - Pelo Médio 10.1 A 20K",
      "SRD - Pelo Médio 20.1 A 30K",
      "SRD - Pelo Médio 30.1 A 50K",
      "SRD - Pelo Médio 3.1 A 6K",
      "SRD - Pelo Médio 50.1 a 60 K",
      "SRD - Pelo Médio 6.1 A 10K",
      "SRD - Pelo Médio ATE 3K",
      "SRD PELUDO 10 A 13 KG",
      "SRD PELUDO 14 A 20 KG",
      "SRD PELUDO 20 A 30 KG",
      "SRD PELUDO 30 A 40 KG",
      "SRD PELUDO 4 A 9KG",
      "SRD PELUDO ATE 4 KG",
      "SRD Peq. (Pelo curto)",
      "SRD Peq. (Pelo Longo)",
      "SRD Peq. (Pelo Medio)",
      "SRD PEQUENO 1 - Sem Raça Definida",
      "SRD PEQUENO 2 - Sem Raça Definida",
      "SRD - Pequeno (Até 10kg)",
      "SRD Pequeno até 10KG",
      "SRD Pequeno (até 35cm ou até 10KG) Pelo Longo",
      "SRD - ( Pequeno - Curto)",
      "SRD- PEQUENO- CURTO",
      "SRD - ( Pequeno - Longo)",
      "SRD - ( Pequeno - Medio)",
      "SRD - Pequeno/Médio",
      "SRD Pequeno/ Pelagem media",
      "SRD - Pequeno - Pelo curto",
      "SRD - Pequeno / Pelo Curto",
      "SRD - Pequeno Pelo Curto",
      "SRD - Pequeno - Pelo longo",
      "SRD - Pequeno / Pelo Longo",
      "SRD - Pequeno Pelo Longo",
      "SRD - PEQUENO-pelo longo",
      "SRD - Pequeno Pelo Médio",
      "SRD PEQUENO PELO MEDIO/LONGO",
      "SRD - pequeno peludo",
      "SRD PEQUENO - Sem Raça Definida",
      "SRD - PG - pelo curto",
      "SRD - PG - pelo longo",
      "SRD - PG - pelo médio",
      "SRD PL",
      "SRD - P - Longo",
      "SRD - PM - pelo curto",
      "SRD - PM - pelo longo",
      "SRD - PM - pelo médio",
      "SRD PORTE GIGANTE (6)",
      "SRD - Porte Gigante (Acima de 30kg)",
      "srd porte grande",
      "SRD - Porte Grande (20kg - 30kg)",
      "SRD PORTE GRANDE (4)",
      "SRD Porte Grande pelo curto",
      "SRD Porte Grande pelo longo",
      "SRD Porte Grande pelo medio",
      "srd porte medio",
      "SRD - Porte Médio (10kg - 20kg)",
      "SRD PORTE MÉDIO (3)",
      "SRD porte medio e pequeno",
      "SRD porte médio pelo curto",
      "SRD porte médio pelo longo",
      "SRD porte medio pelo medio",
      "Srd porte pequeno",
      "SRD - Porte Pequeno (4-10kg)",
      "SRD - Porte Pequeno (Até 10kg)",
      "SRD porte pequeno pelo curto",
      "Srd porte pequeno pelo longo",
      "SRD porte pequeno pelo medio",
      "SRD PP",
      "SRD PP 60$",
      "SRD - P pelo Curto",
      "SRD P Pelo Curto - (5 a 10kg)",
      "SRD P (pelo curto, médio ou longo) - até 15 kg",
      "SRD P Pelo Longo - (5 a 10kg)",
      "SRD - P pelo Médio",
      "SRD P Pelo Médio - (5 a 10kg)",
      "SRD P PELUDO",
      "SRD - PP - pelo curto",
      "SRD - PP - pelo longo",
      "SRD - PP - pelo médio",
      "SRD P - Sem Raça Definida",
      "SRD P - Sem raça definida pequeno",
      "SRD-Se4m raça definida 10 a 20kg",
      "SRD - Sem Raça Defenida Pequeno",
      "SRD (sem raça definida)",
      "SRD- Sem Raça Definida",
      "SRD-sem raça definida",
      "SRD - Sem Raça Definida (11 - 15kg)",
      "SRD - Sem Raça Definida (35 A 45 CM) Pelo Curto",
      "SRD - Sem Raça Definida (35 A 45 CM) Pelo Médio/Longo",
      "SRD - Sem Raça Definida (45 A 60CM) Pelo Curto",
      "SRD - Sem Raça Definida (45 A 60CM) Pelo Médio/Longo",
      "SRD - Sem Raça Definida (5 - 10kg)",
      "SRD - Sem Raça Definida acima de 10kg",
      "SRD - Sem Raça Definida - acima de 15 kg",
      "SRD - Sem Raça Definida até 10kg",
      "SRD - Sem Raça Definida até 10 kg",
      "SRD - Sem Raça Definida (até 4kg)",
      "SRD - Sem Raça Definida - Cachorro",
      "SRD - Sem Raça Definida (Classe 1)",
      "SRD - Sem Raça Definida (Classe 2)",
      "SRD - Sem Raça Definida (Classe 3)",
      "SRD - Sem Raça Definida (Classe 4)",
      "SRD - Sem Raça Definida (Classe 5)",
      "SRD - Sem Raça Definida (Classe 6)",
      "SRD - Sem Raça Definida (Classe 7)",
      "SRD - Sem Raça Definida - de 10 a 15 kg",
      "SRD - Sem Raça Definida de de 20 a 30KG",
      "SRD - Sem Raça Definida - G",
      "SRD - Sem Raça Definida GC",
      "SRD - Sem raça definida GG",
      "SRD - Sem Raça Definida - GG",
      "SRD - Sem Raça Definida Gigante",
      "SRD - Sem Raça Definida GL",
      "Srd - (sem raça definida) GRANDE",
      "SRD - Sem Raça Definida - Grande",
      "SRD - Sem raça definida Grande pelo Curto",
      "SRD - Sem raça definida Grande pelo Longo",
      "SRD - Sem raça definida Grande pelo Médio",
      "SRD - Sem Raça Definida - M",
      "SRD - Sem Raça Definida MC",
      "Srd - (sem raça definida) MÉDIO",
      "SRD - Sem Raça Definida - Medio",
      "SRD sem raça definida MEDIO",
      "SRD - Sem raça definida Médio pelo Curto",
      "SRD - Sem raça definida Médio pelo Longo",
      "SRD - Sem raça definida Médio pelo Médio",
      "SRD - Sem Raça Definida Micro",
      "SRD - Sem Raça Definida MINI",
      "SRD - Sem Raça Definida ML",
      "SRD - Sem Raça Definida PC",
      "SRD- Sem Raça Definida Peq",
      "Srd - (sem raça definida) PEQUENO",
      "SRD sem raça definida pequeno",
      "SRD - Sem raça definida Pequeno pelo Curto",
      "SRD - Sem raça definida Pequeno pelo Longo",
      "SRD - Sem raça definida Pequeno pelo Médio",
      "SRD - Sem Raça Definida PG",
      "SRD - Sem Raça Definida PL",
      "SRD - Sem Raça Definida PM",
      "SRD - Sem Raça Definida (porte Grande)",
      "SRD - Sem raça definida - porte grande e pelo curto",
      "SRD - Sem raça definida - porte grande e pelo longo",
      "SRD - Sem raça definida - porte grande e pelo médio",
      "SRD - Sem raça definida - porte médio e pelo curto",
      "SRD - Sem raça definida - porte médio e pelo longo",
      "SRD - Sem raça definida - porte médio e pelo médio",
      "SRD - Sem raça definida - porte pequeno e pelo curto",
      "SRD - Sem raça definida - porte pequeno e pelo longo",
      "SRD - Sem raça definida - porte pequeno e pelo médio",
      "SRD - Sem Raça Definida PP",
      "SRD - Sem Raça Definida (Vira-Lata)",
      "SRD - Sem Raça Definida (Viralata)",
      "SRS- Sem raça definida acima de 30",

      // Nomes de SRD cadastrados pelas lojas — gatos
      "SRD (Pelo Curto)",
      "SRD (Pelo Longo)",
      "Gato SRD - Sem Raça Definida",
      "Gato SRD - Sem Raça Definida (Pelo Curto)",
      "Gato SRD - Sem Raça Definida (Pelo Longo)",
      "SRD - Sem Raça Definida (Pelo Curto)",
      "SRD - Gato",
      "SRD - PELO CURTO",
      "SRD - PELO LONGO",
      "GATO SRD",
      "Gato SRD Pelo Curto",
      "SRD - GATO GRD",
      "SRD GATO MED",
      "Gato SRD Gigante",
      "Gato SRD Pelo Longo",
      "Gato SRD Pelo Médio",
      "Gato SRD - Sem Raça Definida (Pequeno)",
      "SRD Felino",
      "SRD - Sem Raça Definida até 3kg",
      "SRD - Sem Raça Definida - Gato",
      "GATO - SRD",
      "GATO SRD PELO CURTO FILHOTE",
      "GATO SRD PELO MEDIO /LONGO",
      "Gato SRD Porte M ou G",
      "Gato SRD Porte P",
      "(Gato) SRD - Sem Raça Definida (Classe 1)",
      "(Gato) SRD - Sem Raça Definida (Classe 2)",
      "GATO VIRA",
      "SRD - Adulto",
      "SRD - Filhote",
      "SRD gato pelos curtos",
      "srd gato peludo",
      "SRD - gato Sem Raça Definida",
      "SRD(PELO CURTO) - 10.1 ATE 30K",
      "SRD(PELO CURTO)- ATE 10K",
      "SRD (Pelo Curto) - Gato",
      "SRD(PELO LONGO) - 10.1 ATE 30K",
      "SRD(PELO LONGO) - ATE 10K",
      "SRD (Pelo Longo) - Gato",
      "SRD - Sem Raça Definida curto",
      "SRD - Sem Raça Definida GATO",
      "SRD - Sem Raça Definida GATO PC",
      "SRD - Sem Raça Definida GATO PL",
      "SRD - Sem raça definida longo",

      // Nomes de SRD cadastrados pelas lojas — outras espécies
      "Coelho SRD",
      "Não definida",
      "Roedor - SRD",
      "Sem Raça Definida.",
      "SRD. Sem Raça Definida",
      "Pássaro SRD (Sem Raça Defenida)",
      "Macaco SRD (Sem Raça Defenida)",
    ],
  },
];

// 1ª etapa — texto do cliente -> raças reconhecidas (nomes canônicos).
// Compara o que foi digitado, via Levenshtein, com o nome de cada raça e com
// cada um dos seus erros de grafia comuns; retorna os nomes canônicos que
// passaram do threshold, ordenados pela similaridade (maior primeiro).
export const getRecognizedBreeds = (
  input: string,
  threshold = 0.7,
): string[] => {
  const inputNorm = normalize(input);
  if (!inputNorm) return [];

  const scored = RECOGNIZED_BREEDS.map((breed) => {
    const candidates = [breed.name, ...breed.matches];
    const bestScore = Math.max(
      ...candidates.map((candidate) =>
        bestSimilarity(inputNorm, normalize(candidate)),
      ),
    );

    return { name: breed.name, score: bestScore };
  });

  return scored
    .filter((b) => b.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((b) => b.name);
};

// 2ª etapa — raças reconhecidas -> raças da base da loja.
// A partir do texto digitado, resolve os nomes canônicos (1ª etapa) e busca,
// via Levenshtein, as raças correspondentes na lista vinda do banco da empresa.
// Se nada for reconhecido, faz fallback buscando o próprio texto digitado.
export const getSimilarBreeds = (
  input: string,
  breeds: Array<{ name: string; [k: string]: any }>,
) => {
  const recognized = getRecognizedBreeds(input);

  const searchTerms = (recognized.length > 0 ? recognized : [input])
    .map(normalize)
    .filter(Boolean);

  const scored = breeds.map((breed) => {
    const breedNorm = normalize(breed.name);

    // melhor score entre todos os termos de busca (nomes canônicos reconhecidos)
    const bestScore = Math.max(
      ...searchTerms.map((term) => bestSimilarity(term, breedNorm)),
    );

    return {
      breed,
      score: bestScore,
    };
  });

  // 🔥 threshold inteligente
  const filtered = scored
    .filter((b) => b.score >= 0.6) // 60% similaridade
    .sort((a, b) => b.score - a.score);

  return filtered.slice(0, 5).map((b) => b.breed);
};

// Busca de cidades da rede — parte da mesma técnica do getSimilarBreeds
// (Levenshtein), porém sem dicionário de nomes canônicos (as cidades vêm
// direto do cadastro da rede, não de um vocabulário fixo). Diferente das
// raças, o cliente costuma digitar só um pedaço do nome da cidade (ex.: "C",
// "camp"), e a similaridade de Levenshtein de um trecho curto contra o nome
// completo é baixa demais — por isso priorizamos também prefixo/substring,
// senão uma busca parcial não retornaria nada e o fluxo travaria.
export const getSimilarCities = <
  T extends { cityName: string; [k: string]: any },
>(
  input: string,
  cities: T[],
  limit = 5,
): T[] => {
  const inputNorm = normalize(input);
  if (!inputNorm) return [];

  const scored = cities.map((city) => {
    const cityNorm = normalize(city.cityName);
    const words = cityNorm.split(" ").filter(Boolean);

    let score = bestSimilarity(inputNorm, cityNorm);

    if (cityNorm.startsWith(inputNorm)) {
      score = Math.max(score, 0.95);
    } else if (words.some((word) => word.startsWith(inputNorm))) {
      score = Math.max(score, 0.85);
    } else if (cityNorm.includes(inputNorm)) {
      score = Math.max(score, 0.75);
    }

    return { city, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  // Cidades acima do threshold de similaridade (60%). Se nenhuma passar,
  // caímos para as de maior score mesmo abaixo do threshold — assim a
  // listagem nunca fica vazia (enquanto houver cidades na rede) e o fluxo
  // não trava, deixando o cliente escolher a mais próxima.
  const filtered = sorted.filter((c) => c.score >= 0.6);
  const result = filtered.length > 0 ? filtered : sorted;

  return result.slice(0, limit).map((c) => c.city);
};

export const formatAsCurrency = (valor: number) => {
  return valor.toFixed(2).replace(".", ",");
};

export const formatISODate = (d: Date) => {
  return d.toISOString().split("T")[0];
};

export const formatBRDate = (iso: string): string => {
  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

export function formatBRDateStringDayMonth(dateStr: string): string {
  const [day, month] = dateStr.split("/");
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
}
export function parseJsonArray<T>(raw: unknown): T[] {
  const arr: unknown[] =
    typeof raw === "string" ? JSON.parse(raw) : ((raw as unknown[]) ?? []);
  return arr.map((item) =>
    typeof item === "string" ? JSON.parse(item) : item,
  ) as T[];
}

/**
 * JSON.parse que não derruba o handler: devolve `fallback` quando o valor está
 * ausente ou não é JSON válido.
 *
 * Variável de fluxo malformada é dado de entrada ruim, não motivo para abortar
 * o bloco. Quando um handler morre no meio, ele não grava as variáveis de saída
 * — e o fluxo pode reentrar no mesmo bloco indefinidamente (foi o que derrubou
 * o chatbot na TP-3635). Prefira este parse onde um valor ruim pode ser
 * degradado; deixe o JSON.parse cru só onde a ausência do dado realmente
 * impede o bloco de fazer seu trabalho.
 */
export const safeJsonParse = <T>(raw: unknown, fallback: T): T => {
  if (typeof raw !== "string" || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const parseIds = (raw: unknown): number[] => {
  if (Array.isArray(raw)) return raw.map(Number);

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw).map(Number);
    } catch {
      throw new Error("IDs malformados: não é JSON válido");
    }
  }

  throw new Error("IDs malformados: esperado array ou string JSON");
};

/**
 * Núcleo compartilhado de extração de id a partir do que o Typebot entrega numa
 * variável de seleção: o valor pode chegar como número, como string, como o
 * objeto inteiro da entidade, ou como lista contendo um desses (é o que a
 * `picture choice input` grava quando o `valuesVariableId` aponta para um array
 * de objetos). Retorna null para qualquer coisa que não seja um id positivo.
 */
const extractEntityId = (raw: unknown): number | null => {
  if (raw == null) return null;

  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first == null) return null;

  const candidate =
    typeof first === "object" ? (first as { id?: unknown }).id : first;

  if (typeof candidate !== "number" && typeof candidate !== "string")
    return null;

  const id = Number(candidate);

  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Extrai o id do agendamento que caracteriza uma remarcação, a partir do que o
 * fluxo entrega no campo "Agendamento selecionado" — que pode vir como número,
 * como o objeto do agendamento, ou como lista contendo um desses.
 *
 * Retorna null quando não há um id de agendamento de fato. É intencionalmente
 * mais estrito que "o valor não está vazio": resíduo de sessão (0, false, "",
 * {}, [] e o sentinela { backToMenu: true } da lista de reservas) não deve
 * ligar o ramo de remarcação, senão a busca de horários vai com o catálogo
 * inteiro da loja e o agendamento acaba com duração diferente da contratada.
 *
 * Um id válido também não é prova de remarcação — a variável do fluxo pode
 * carregar um agendamento anterior do cliente. Quem consome precisa validar o
 * agendamento de fato (status, pet e data).
 */
export const extractBookingId = (raw: unknown): number | null =>
  extractEntityId(raw);

/**
 * Extrai o id do serviço de leva e traz escolhido pelo cliente.
 *
 * Vale o mesmo rigor do `extractBookingId`: "aceitou o leva e traz" tem que ser
 * um id de serviço de verdade, não "a variável não está vazia". A variável
 * `LevaTraz.Selecionado` sobrevive entre etapas da sessão, então resíduo de um
 * agendamento anterior (ou o `""` que o fluxo grava ao resetar) não pode ligar
 * o corte de antecedência do leva e traz e sumir com os horários de quem
 * recusou o serviço.
 */
export const extractTakeAndBringId = (raw: unknown): number | null =>
  extractEntityId(raw);

/**
 * Interpreta o par `date` (DD/MM/YYYY) + `start` (HH:mm) que a API devolve para
 * um agendamento. Ambos vêm no fuso da loja.
 */
export const parseBookingDate = (date: string, start: string): Date => {
  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = start.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

/**
 * Corte apenas para agendamentos genuinamente passados (data+hora antes de
 * `now`). A antecedência mínima para alterar/cancelar NÃO é avaliada aqui —
 * fica a cargo das validações dedicadas (validateRescheduleMinAdvanceHours /
 * validateCancelMinAdvanceHours).
 *
 * `now` precisa vir já convertido para o fuso da loja: `date`/`start` estão no
 * fuso da loja, mas `new Date(y, m, d, h, min)` os interpreta no fuso do
 * container (UTC em produção), então comparar contra o "agora" cru descartaria
 * como passado todo agendamento a menos de ~3h30 de acontecer.
 */
export const isUpcomingBooking = (
  date: string,
  start: string,
  now: Date,
): boolean => parseBookingDate(date, start) >= now;
