/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Suíte de Testes Automatizados Unitários para o Core RAG (Unidades IV & V)
 */

import {
  chunkDocument,
  tokenize,
  estimateTokens,
  scoreChunkRelevance,
  retrieveTopChunks,
  deduplicateChunks,
  ChunkItem
} from '../app/core/ragEngine.ts';
import { buildCoStarPrompt } from '../app/core/promptTemplates.ts';

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  message?: string;
  details?: string;
}

export function runAllTests(): TestResultItem[] {
  const results: TestResultItem[] = [];

  // Helper para asserções
  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Chunking com texto padrão
  (() => {
    const start = performance.now();
    try {
      const text =
        'Primeira frase importante sobre IA. Segunda frase com detalhes técnicos de RAG. Terceira frase explicando chunking e overlap.';
      const chunks = chunkDocument(text, 'Manual', 80, 20);
      assert(chunks.length >= 2, `Deveria gerar ao menos 2 chunks, gerou ${chunks.length}`);
      assert(chunks[0].docTitle === 'Manual', 'Título do chunk deve corresponder');
      assert(chunks[0].tokenEstimate > 0, 'Estimativa de tokens deve ser positiva');
      results.push({
        id: 'test-1',
        name: 'test_chunk_text_splits_sentences',
        category: 'Chunking',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: `Dividiu texto de ${text.length} chars em ${chunks.length} chunks coesos com overlap.`
      });
    } catch (err: any) {
      results.push({
        id: 'test-1',
        name: 'test_chunk_text_splits_sentences',
        category: 'Chunking',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 2. Chunking com texto vazio
  (() => {
    const start = performance.now();
    try {
      const emptyChunks = chunkDocument('   \n  \t  ', 'Vazio');
      assert(emptyChunks.length === 0, 'Texto vazio deve produzir array vazio');
      results.push({
        id: 'test-2',
        name: 'test_chunk_text_empty_input',
        category: 'Validação',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: 'Proteção contra strings vazias validada com sucesso.'
      });
    } catch (err: any) {
      results.push({
        id: 'test-2',
        name: 'test_chunk_text_empty_input',
        category: 'Validação',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 3. Tokenização e Stopwords
  (() => {
    const start = performance.now();
    try {
      const tokens = tokenize('O desenvolvimento de software com inteligência artificial é ágil!');
      assert(tokens.includes('desenvolvimento'), 'Token desenvolvimento deve existir');
      assert(tokens.includes('inteligencia'), 'Acentuação deve ser normalizada');
      assert(!tokens.includes('de') && !tokens.includes('com'), 'Stop words devem ser filtradas');
      results.push({
        id: 'test-3',
        name: 'test_tokenize_normalizes_and_filters',
        category: 'Processamento',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: `Tokens normalizados e limpos: ${tokens.join(', ')}`
      });
    } catch (err: any) {
      results.push({
        id: 'test-3',
        name: 'test_tokenize_normalizes_and_filters',
        category: 'Processamento',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 4. Ranqueamento semântico no Retriever
  (() => {
    const start = performance.now();
    try {
      const chunks: ChunkItem[] = [
        {
          id: 'c1',
          docTitle: 'Política',
          content: 'A política de senhas exige no mínimo 14 caracteres com letras e símbolos.',
          startIndex: 0,
          endIndex: 75,
          tokenEstimate: 20
        },
        {
          id: 'c2',
          docTitle: 'Cozinha',
          content: 'O refeitório oferece café expresso e frutas frescas todos os dias.',
          startIndex: 76,
          endIndex: 140,
          tokenEstimate: 18
        }
      ];

      const search = retrieveTopChunks('quantos caracteres precisa ter a senha?', chunks, 1);
      assert(search.chunks.length === 1, 'Deve retornar 1 chunk');
      assert(search.chunks[0].id === 'c1', 'O chunk sobre senhas deve ter o score mais alto');
      assert((search.chunks[0].score || 0) > 0, 'Score deve ser positivo');

      results.push({
        id: 'test-4',
        name: 'test_retriever_ranks_relevant_chunk_first',
        category: 'Busca Semântica',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: `Chunk ${search.chunks[0].id} ranqueado com score ${search.chunks[0].score?.toFixed(2)}`
      });
    } catch (err: any) {
      results.push({
        id: 'test-4',
        name: 'test_retriever_ranks_relevant_chunk_first',
        category: 'Busca Semântica',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 5. Deduplicação de Chunks
  (() => {
    const start = performance.now();
    try {
      const dupChunks: ChunkItem[] = [
        { id: '1', docTitle: 'A', content: 'Texto idêntico para teste.', startIndex: 0, endIndex: 25, tokenEstimate: 7 },
        { id: '2', docTitle: 'A', content: 'Texto idêntico para teste.', startIndex: 26, endIndex: 51, tokenEstimate: 7 },
        { id: '3', docTitle: 'B', content: 'Outro texto diferente.', startIndex: 52, endIndex: 75, tokenEstimate: 6 }
      ];
      const deduped = deduplicateChunks(dupChunks);
      assert(deduped.length === 2, `Deveria restar 2 chunks após deduplicação, restou ${deduped.length}`);
      results.push({
        id: 'test-5',
        name: 'test_deduplicate_chunks',
        category: 'Otimização',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: 'Deduplicou 3 blocos para 2 blocos únicos.'
      });
    } catch (err: any) {
      results.push({
        id: 'test-5',
        name: 'test_deduplicate_chunks',
        category: 'Otimização',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 6. Construção do Prompt CO-STAR
  (() => {
    const start = performance.now();
    try {
      const sampleChunks: ChunkItem[] = [
        { id: 'chunk-1', docTitle: 'Regras', content: 'Prazo de reembolso é 30 dias.', startIndex: 0, endIndex: 30, tokenEstimate: 8 }
      ];
      const { prompt, systemInstruction, metadata } = buildCoStarPrompt('Qual o prazo?', sampleChunks);
      assert(prompt.includes('Prazo de reembolso é 30 dias'), 'Prompt deve conter as evidências');
      assert(metadata.objective.includes('Qual o prazo?'), 'Objetivo CO-STAR deve refletir a pergunta');
      assert(systemInstruction.includes('NUNCA invente fatos'), 'Regra anti-alucinação deve constar na instrução');
      results.push({
        id: 'test-6',
        name: 'test_prompt_costar_structure_and_grounding',
        category: 'Engenharia de Prompts',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: 'Prompt estruturado nas 6 dimensões CO-STAR e diretivas anti-alucinação.'
      });
    } catch (err: any) {
      results.push({
        id: 'test-6',
        name: 'test_prompt_costar_structure_and_grounding',
        category: 'Engenharia de Prompts',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 7. Estimativa de Janela de Tokens
  (() => {
    const start = performance.now();
    try {
      const tokens1 = estimateTokens('Uma frase curta.');
      const tokens2 = estimateTokens('Uma frase muito mais longa com vários termos adicionais para testar a escala linear de tokens.');
      assert(tokens1 > 0 && tokens2 > tokens1, 'Estimativa deve ser progressiva');
      results.push({
        id: 'test-7',
        name: 'test_token_estimate_calculation',
        category: 'Performance',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: `Calculou ${tokens1} tokens (curta) vs ${tokens2} tokens (longa).`
      });
    } catch (err: any) {
      results.push({
        id: 'test-7',
        name: 'test_token_estimate_calculation',
        category: 'Performance',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  // 8. Consulta sem correspondência (Zero Match Fallback)
  (() => {
    const start = performance.now();
    try {
      const chunks: ChunkItem[] = [
        { id: 'c1', docTitle: 'Aeronáutica', content: 'Aviões utilizam asas e motores turbofan para sustentar voo.', startIndex: 0, endIndex: 60, tokenEstimate: 15 }
      ];
      const search = retrieveTopChunks('receita de bolo de chocolate caseiro', chunks, 1, 0.1);
      // O retriever não deve quebrar mesmo com termos não relacionados
      assert(search !== null && search.totalCandidates === 1, 'Mecanismo de busca deve retornar objeto válido');
      results.push({
        id: 'test-8',
        name: 'test_retriever_zero_score_fallback_graceful',
        category: 'Robustez',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        details: 'Consulta divergente tratada com segurança sem erros em tempo de execução.'
      });
    } catch (err: any) {
      results.push({
        id: 'test-8',
        name: 'test_retriever_zero_score_fallback_graceful',
        category: 'Robustez',
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: err.message
      });
    }
  })();

  return results;
}
