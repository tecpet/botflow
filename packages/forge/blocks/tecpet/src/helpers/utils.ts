export const levenshtein = (a, b) => {
  const matrix = Array.from({length: b.length + 1}, (_, i) => [i]);
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

export const getSimilarBreeds = (
  input: string,
  breeds: Array<{ name: string; [k: string]: any }>
) => {
  // --- normalização (minúsculas, sem acentos, sem espaços extras) ---
  console.log('[SIMILAR BREEDS] - 1')
  const normalize = (s: string) => s?.toLowerCase().trim();

  console.log('[SIMILAR BREEDS] - 2')
  console.log(input)

  const inputNorm = normalize(input);
  console.log('[SIMILAR BREEDS] - 3')


  // --- calcula distância de Levenshtein para cada raça ---
  const scored = breeds.map((breed) => ({
    breed,                                             // objeto completo
    distance: levenshtein(inputNorm, normalize(breed.name)),
  }));
  console.log('[SIMILAR BREEDS] - 4')


  // 1) Alguma com distância 0 ou 1? → devolve só a melhor (menor distância)
  const veryClose = scored.filter((b) => b.distance <= 1);
  console.log('[SIMILAR BREEDS] - 5')
  if (veryClose.length) {
    console.log('[SIMILAR BREEDS] - 51')
    const [best] = veryClose.sort((a, b) => a.distance - b.distance);
    console.log('[SIMILAR BREEDS] - 52')
    return [best.breed];                              // array com 1 item
  }
  console.log('[SIMILAR BREEDS] - 6')

  // 2) Distância de 2 a 5? → devolve as 10 mais próximas
  const close = scored.filter((b) => b.distance >= 2 && b.distance <= 5);
  if (close.length) {
    return close
      .sort((a, b) => a.distance - b.distance)        // ordena da mais parecida p/ menos
      .slice(0, 10)                                   // no máx. 10 resultados
      .map((b) => b.breed);
  }
  console.log('[SIMILAR BREEDS] - 7')


  // 3) Tudo > 5 → nenhum resultado
  return [];
};

export const formatAsCurrency = (valor: number) => {
  return valor.toFixed(2).replace('.', ',');
}

