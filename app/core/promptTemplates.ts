/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Prompt Engineering com metodologia CO-STAR para RAG Fundamentado
 * Unidade I: Contexto, Objetivo, Estilo, Tonalidade, Audiência e Resposta
 */

import { ChunkItem } from './ragEngine.ts';

export interface CoStarConfig {
  context: string;
  objective: string;
  style: string;
  tone: string;
  audience: string;
  responseFormat: string;
}

/**
 * Constrói a instrução estruturada de engenharia de prompts CO-STAR
 * especificamente calibrada para evitar alucinações e citar os trechos exatos.
 */
export function buildCoStarPrompt(
  question: string,
  retrievedChunks: ChunkItem[],
  customInstruction?: string
): { prompt: string; systemInstruction: string; metadata: CoStarConfig } {
  const formattedContext = retrievedChunks.length > 0
    ? retrievedChunks
        .map(
          (c, idx) =>
            `[EVIDÊNCIA ${idx + 1} | Documento: "${c.docTitle}" | ID: ${c.id}]\n"${c.content}"`
        )
        .join('\n\n')
    : '(Nenhuma evidência documental localizada para esta consulta)';

  const config: CoStarConfig = {
    context: `Você é um analista especialista em Retrieval Augmented Generation (RAG). Você recebeu trechos factuais extraídos diretamente de documentos oficiais da organização.\n\nEVIDÊNCIAS DOCUMENTAIS:\n${formattedContext}`,
    objective: `Responder à pergunta do usuário: "${question}". Responda estritamente utilizando as evidências documentais acima. Se a informação não estiver presente nas evidências, afirme educadamente que o documento não contém tal informação, em vez de inventar ou extrapolar.`,
    style: `Claro, estruturado, objetivo e analítico. Inclua citações explícitas indicando a qual trecho ou evidência documental cada afirmação se baseia (ex: [Evidência 1]).`,
    tone: `Profissional, seguro e cortês.`,
    audience: `Estudantes de tecnologia, desenvolvedores e profissionais que necessitam de respostas fidedignas e auditáveis.`,
    responseFormat: `Texto em Markdown bem formatado, destacando os pontos principais com bullets quando apropriado e listando no final as fontes/citações utilizadas.`
  };

  const systemInstruction = `Você é um assistente RAG de alta fidelidade desenvolvido com a metodologia CO-STAR.
DIRETRIZES INVIOLÁVEIS:
1. Responda APENAS com base nos fatos contidos nas EVIDÊNCIAS DOCUMENTAIS fornecidas.
2. NUNCA invente fatos, políticas, números ou prazos que não estejam explícitos nas evidências.
3. Se a evidência for insuficiente, responda: "Com base nas evidências documentais fornecidas, não há informações suficientes para responder a esta pergunta."
4. Cite sempre a evidência que embasa a resposta (ex: "[Evidência 1]").
${customInstruction ? `DIRETRIZ ADICIONAL: ${customInstruction}` : ''}`;

  const prompt = `### CONTEXTO (CO-STAR):
${config.context}

### OBJETIVO:
${config.objective}

### ESTILO E DIRETRIZES:
${config.style}

### RESPOSTA ESPERADA:
${config.responseFormat}

Pergunta do Usuário: "${question}"`;

  return { prompt, systemInstruction, metadata: config };
}
