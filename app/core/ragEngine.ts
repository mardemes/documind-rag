/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DocuMind RAG Core - Algoritmos de Chunking, Indexação e Recuperação Semântica
 */

export interface ChunkItem {
  id: string;
  docTitle: string;
  content: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
  score?: number;
}

export interface SearchResult {
  query: string;
  chunks: ChunkItem[];
  totalCandidates: number;
  searchDurationMs: number;
}

/**
 * Normaliza e tokeniza um texto removendo pontuações irrelevantes e stop words comuns em PT-BR e EN.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove diacríticos para busca insensível a acento

  const stopWords = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela', 'para', 'com', 'sem', 'sob',
    'e', 'ou', 'mas', 'que', 'se', 'como', 'quando', 'onde', 'qual', 'quais', 'the', 'is', 'at', 'which', 'on'
  ]);

  return normalized
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stopWords.has(t));
}

/**
 * Estimativa simples e eficaz de tokens (média ~4 caracteres por token em línguas latinas).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

/**
 * Segmenta um documento de texto longo em blocos semânticos respeitando frases e sobreposição (overlap).
 * Atende ao princípio SRP (Single Responsibility Principle) e boas práticas da Unidade 4.2.
 */
export function chunkDocument(
  docText: string,
  docTitle: string = 'Documento',
  targetChunkLength: number = 320,
  overlapLength: number = 60
): ChunkItem[] {
  if (!docText || !docText.trim()) {
    return [];
  }

  const cleanText = docText.trim();
  // Divide o texto primordialmente por parágrafos ou pontuações de fim de frase
  const sentences = cleanText.split(/(?<=[.!?\n])\s+/);

  const chunks: ChunkItem[] = [];
  let currentChunk = '';
  let startIdx = 0;
  let chunkIndex = 1;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    if (currentChunk.length + sentence.length > targetChunkLength && currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex++}`,
        docTitle,
        content: currentChunk.trim(),
        startIndex: startIdx,
        endIndex: startIdx + currentChunk.length,
        tokenEstimate: estimateTokens(currentChunk)
      });

      // Aplica overlap pegando o sufixo do bloco anterior
      if (overlapLength > 0 && currentChunk.length > overlapLength) {
        const overlapSuffix = currentChunk.slice(-overlapLength);
        currentChunk = overlapSuffix + ' ' + sentence;
        startIdx = Math.max(0, startIdx + currentChunk.length - overlapLength);
      } else {
        startIdx += currentChunk.length;
        currentChunk = sentence;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk-${chunkIndex}`,
      docTitle,
      content: currentChunk.trim(),
      startIndex: startIdx,
      endIndex: startIdx + currentChunk.length,
      tokenEstimate: estimateTokens(currentChunk)
    });
  }

  return chunks;
}

/**
 * Deduplica blocos repetidos ou redundantes para economizar janela de contexto da LLM.
 */
export function deduplicateChunks(chunks: ChunkItem[]): ChunkItem[] {
  const seen = new Set<string>();
  return chunks.filter(c => {
    const key = c.content.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calcula a relevância semântica e léxica de um bloco para a consulta usando BM25 ponderado.
 */
export function scoreChunkRelevance(query: string, chunkContent: string): number {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(chunkContent);

  if (queryTokens.length === 0 || chunkTokens.length === 0) {
    return 0;
  }

  const chunkTokensSet = new Set(chunkTokens);
  let matchCount = 0;
  let phraseBonus = 0;

  // Bônus se a pergunta contiver termos exatos contíguos
  const cleanQ = query.toLowerCase().trim();
  const cleanC = chunkContent.toLowerCase();
  if (cleanC.includes(cleanQ)) {
    phraseBonus += 2.5;
  }

  for (const qToken of queryTokens) {
    if (chunkTokensSet.has(qToken)) {
      matchCount += 1;
    }
  }

  const queryCoverage = matchCount / queryTokens.length;
  const chunkDensity = matchCount / Math.sqrt(chunkTokens.length);

  return (queryCoverage * 2.0) + (chunkDensity * 1.5) + phraseBonus;
}

/**
 * Mecanismo de Busca e Recuperação (Retriever).
 * Ranqueia os melhores trechos e retorna os Top-K com score de relevância.
 */
export function retrieveTopChunks(
  query: string,
  allChunks: ChunkItem[],
  topK: number = 3,
  minThreshold: number = 0.05
): SearchResult {
  const startTime = performance.now();

  const scored = allChunks.map(chunk => ({
    ...chunk,
    score: scoreChunkRelevance(query, chunk.content)
  }));

  // Ordena por maior pontuação
  scored.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Filtra por limiar mínimo
  const filtered = scored.filter(c => (c.score || 0) >= minThreshold);
  const topChunks = (filtered.length > 0 ? filtered : scored).slice(0, topK);

  const duration = performance.now() - startTime;

  return {
    query,
    chunks: topChunks,
    totalCandidates: allChunks.length,
    searchDurationMs: Math.round(duration * 100) / 100
  };
}
