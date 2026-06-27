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
