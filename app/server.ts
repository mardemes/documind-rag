/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DocuMind RAG Server - Backend Express com Vite Middleware e Gemini API
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { chunkDocument, retrieveTopChunks, deduplicateChunks, ChunkItem } from './core/ragEngine.ts';
import { buildCoStarPrompt } from './core/promptTemplates.ts';
import { runAllTests } from '../tests/ragEngine.test.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Inicialização segura do SDK Gemini no servidor (Unidade III & Gemini SDK Guidelines)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint de Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    model: 'gemini-3.8-flash',
    hasApiKey: Boolean(aiClient),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint de Execução de Testes Unitários no Servidor
app.get('/api/rag/tests', (_req, res) => {
  try {
    const testResults = runAllTests();
    const passedCount = testResults.filter(t => t.passed).length;
    res.json({
      total: testResults.length,
      passed: passedCount,
      failed: testResults.length - passedCount,
      allPassed: passedCount === testResults.length,
      tests: testResults,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para download do repositório completo compactado (.zip)
app.get('/api/download-zip', (_req, res) => {
  try {
    const archivePath = '/tmp/documind-rag-v1.0.0.zip';
    execSync(
      `python3 -c "import zipfile, os; z = zipfile.ZipFile('${archivePath}', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(root, f), os.path.join(root, f)) for root, dirs, files in os.walk('.') if not any(x in root for x in ['node_modules', 'dist']) for f in files]; z.close()"`,
      { cwd: projectRoot }
    );
    res.download(archivePath, 'documind-rag-v1.0.0.zip');
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar zip: ' + err.message });
  }
});

// Endpoint para download do repositório completo compactado (.tar.gz)
app.get('/api/download-tar', (_req, res) => {
  try {
    const archivePath = '/tmp/documind-rag-repo.tar.gz';
    // Compacta os arquivos do projeto incluindo a pasta .git com histórico de commits
    execSync(`tar -czf ${archivePath} --exclude=node_modules --exclude=dist .`, { cwd: projectRoot });
    res.download(archivePath, 'documind-rag-v1.0.0.tar.gz');
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar arquivo de download: ' + err.message });
  }
});

// Endpoint Principal de RAG Conversacional
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { question, documents = [], customInstruction, topK = 3 } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Parâmetro "question" é obrigatório.' });
      return;
    }

    const startProcessing = performance.now();

    // 1. Chunking de todos os documentos fornecidos
    let allChunks: ChunkItem[] = [];
    if (Array.isArray(documents) && documents.length > 0) {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const title = typeof doc === 'object' ? doc.title || `Doc ${i + 1}` : `Documento ${i + 1}`;
        const text = typeof doc === 'object' ? doc.content || '' : String(doc);
        const chunks = chunkDocument(text, title, 320, 60);
        allChunks.push(...chunks);
      }
    }

    allChunks = deduplicateChunks(allChunks);

    // 2. Busca e ranqueamento semântico
    const searchResult = retrieveTopChunks(question, allChunks, topK);
    const retrievedChunks = searchResult.chunks;

    // 3. Montagem do prompt com metodologia CO-STAR
    const { prompt, systemInstruction, metadata } = buildCoStarPrompt(
      question,
      retrievedChunks,
      customInstruction
    );

    let answerText = '';
    let usedProvider = 'local_heuristic';

    // 4. Invocação da LLM Gemini 3.8 Flash (se chave estiver disponível)
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2, // Baixa temperatura para fidelidade estrita aos fatos
          },
        });

        if (response.text) {
          answerText = response.text.trim();
          usedProvider = 'gemini-3.8-flash';
        }
      } catch (geminiError: any) {
        console.warn('Fallback para motor local devido a:', geminiError?.message || geminiError);
      }
    }

    // 5. Fallback heurístico fundamentado de alta qualidade caso sem chave ativa
    if (!answerText) {
      if (retrievedChunks.length === 0 || (retrievedChunks[0].score || 0) <= 0.05) {
        answerText =
          'Com base nas evidências documentais fornecidas, não foram encontrados dados suficientes sobre este assunto para responder com certeza fidedigna.';
      } else {
        const topEv = retrievedChunks[0];
        answerText =
          `Com base na análise documental de **"${topEv.docTitle}"** (Evidência 1):\n\n` +
          `> "${topEv.content}"\n\n` +
          `As evidências recuperadas indicam que as diretrizes documentadas respondem diretamente à sua consulta.`;
        if (retrievedChunks.length > 1) {
          answerText += `\n\nInformações complementares em **"${retrievedChunks[1].docTitle}"**:\n> "${retrievedChunks[1].content}"`;
        }
      }
    }

    const totalDuration = Math.round((performance.now() - startProcessing) * 100) / 100;

    res.json({
      answer: answerText,
      provider: usedProvider,
      citations: retrievedChunks.map((c, idx) => ({
        evidenceIndex: idx + 1,
        chunkId: c.id,
        docTitle: c.docTitle,
        snippet: c.content,
        score: c.score,
        tokenEstimate: c.tokenEstimate,
      })),
      searchMetrics: {
        totalChunksAnalyzed: allChunks.length,
        retrievedCount: retrievedChunks.length,
        searchDurationMs: searchResult.searchDurationMs,
        totalDurationMs: totalDuration,
      },
      coStarMetadata: metadata,
    });
  } catch (err: any) {
    console.error('Erro no endpoint RAG:', err);
    res.status(500).json({ error: err.message || 'Erro interno ao processar RAG.' });
  }
});

// Configuração do Vite Middleware em Desenvolvimento
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir arquivos estáticos em produção
    app.use(express.static(path.resolve(projectRoot, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(projectRoot, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 DocuMind RAG Server rodando em http://0.0.0.0:${port}`);
  });
}

startServer();
