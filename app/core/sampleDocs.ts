/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Documentos de Exemplo para Teste e Demonstração do RAG (Unidades I a VI)
 */

export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  suggestedQuestions: string[];
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'doc-lab-ia',
    title: 'Manual de Engenharia de Prompts e Ciclo de Vida do Projeto (Unidades I-VI)',
    category: 'Material do Curso',
    suggestedQuestions: [
      'Quais são os 6 pilares do modelo CO-STAR?',
      'O que o checklist da Unidade 5 exige para a submissão final no GitHub?',
      'Como funciona o ciclo TDD (Red-Green-Refactor) com auxílio da IA?'
    ],
    content: `GUIA PRÁTICO DO LABORATÓRIO: ENGENHARIA DE SOFTWARE ASSISTIDA POR IA GENERATIVA

1. O MODELO CO-STAR (Unidade I):
Um prompt eficaz de engenharia de software baseia-se em seis componentes:
- C (Contexto): Descreve o ambiente de desenvolvimento, tecnologias, arquitetura e objetivo do arquivo.
- O (Objetivo): Define com precisão e clareza a tarefa a ser executada pela IA.
- S (Estilo): Especifica convenções, padrões de projeto (PEP 8, Clean Code, SOLID) e linters.
- T (Tonalidade): Tom de comunicação adequado para documentação ou respostas.
- A (Audiência): Perfil dos leitores ou desenvolvedores que revisarão o código.
- R (Resposta): Formato de saída esperado (código puro, JSON, docstrings Google).

2. ARQUITETURA MÍNIMA E GIT (Unidade II):
Todo projeto deve possuir um arquivo .gitignore inteligente separando artefatos por ecossistema (Python, Node.js, VS Code, OS e variáveis de ambiente). O histórico de commits deve empregar a convenção Conventional Commits (feat, fix, docs, chore, test, refactor) com 5 a 10 registros significativos.

3. REQUISITOS DA UNIDADE 5 PARA SUBMISSÃO:
Para submeter o miniprojeto com sucesso no GitHub, é obrigatório atender aos seguintes itens:
- Repositório público no GitHub com licença de código aberto (ex: MIT).
- Arquivo .gitignore devidamente configurado, impedindo commit de senhas, chaves de API e arquivos .env.
- Arquivo README.md profissional contendo: Título descritivo, Storytelling do papel da IA no desenvolvimento, Diagrama Mermaid de arquitetura, instruções passo a passo de instalação e execução, suíte de testes automatizados e seção de limitações e próximos passos.
- Manifestos de dependências sincronizados (package.json para Node.js ou requirements.txt / pyproject.toml para Python).
- Makefile funcional com targets make install, make run, make test e make format.
- Marcação de versão formalizada através de Tag ou Release v1.0.0.`
  },
  {
    id: 'doc-security-policy',
    title: 'Política Corporativa de Segurança da Informação e Privacidade (SecCorp)',
    category: 'Segurança & Compliance',
    suggestedQuestions: [
      'Qual é o prazo máximo para reportar incidentes de segurança?',
      'Quais são os requisitos mínimos para criação de senhas de colaboradores?',
      'É permitido utilizar dados confidenciais em ferramentas públicas de IA?'
    ],
    content: `POLÍTICA CORPORATIVA DE SEGURANÇA DA INFORMAÇÃO - SEC-CORP v3.4

1. POLÍTICA DE AUTENTICAÇÃO E SENHAS:
Todas as senhas de acesso à rede corporativa devem possuir no mínimo 14 caracteres, incluindo ao menos uma letra maiúscula, uma letra minúscula, um dígito numérico e um caractere especial (!@#$%&*). O ciclo de renovação obrigatória ocorre a cada 90 dias, sendo proibida a reutilização das 5 últimas senhas anteriores. A autenticação multifator (MFA) é compulsória para todos os acessos remotos e contas com privilégios de administrador.

2. USO DE FERRAMENTAS DE INTELIGÊNCIA ARTIFICIAL:
É expressamente proibido submeter dados sensíveis, segredos comerciais, chaves de API privadas ou dados pessoais identificáveis (PII) de clientes a ferramentas públicas de IA Generativa. Qualquer integração com LLMs deve utilizar provedores corporativos com garantia contratual de privacidade e não retenção de dados para treinamento de modelos.

3. NOTIFICAÇÃO E GESTÃO DE INCIDENTES:
Qualquer indício de violação de dados ou incidente cibernético deve ser reportado à Equipe de Resposta a Incidentes (CSIRT) no prazo máximo de 2 horas após a identificação inicial. Em casos de vazamento de dados pessoais regulados pela LGPD, o Encarregado pelo Tratamento de Dados (DPO) deve ser notificado em até 12 horas para avaliação de comunicação à autoridade nacional.`
  },
  {
    id: 'doc-ecommerce-returns',
    title: 'Manual de Políticas Comerciais e Trocas da Loja TechPrime',
    category: 'Atendimento & E-commerce',
    suggestedQuestions: [
      'Qual é o prazo para devolução por arrependimento de compra?',
      'Como funciona a garantia para produtos com vício oculto?',
      'Quem arca com o frete de devolução em caso de troca por insatisfação?'
    ],
    content: `POLÍTICA COMERCIAL DE TROCAS E DEVOLUÇÕES - TECHPRIME BRASIL

1. DIREITO DE ARREPENDIMENTO:
Conforme o Código de Defesa do Consumidor, o cliente tem até 7 (sete) dias corridos a contar do recebimento do produto para solicitar a devolução sem qualquer ônus. A TechPrime estende esse benefício para 30 (trinta) dias corridos para membros do Clube TechPrime VIP.

2. CUSTO DO FRETE NA DEVOLUÇÃO:
O frete reverso para a primeira troca ou devolução dentro do prazo legal é 100% gratuito e coberto pela TechPrime por meio de autorização de postagem dos Correios. Trocas subsequentes do mesmo pedido terão o frete compartilhado entre o cliente e a loja.

3. GARANTIA CONTRA VÍCIO OCULTO E DEFEITOS:
Produtos que apresentarem defeitos de fábrica possuem 90 (noventa) dias de garantia legal e 270 (duzentos e setenta) dias adicionais de garantia contratual da TechPrime, totalizando 1 (um) ano de proteção. Para vícios ocultos comprovados por laudo técnico oficial da assistência autorizada, o prazo legal inicia-se na data em que a falha se tornou perceptível ao consumidor.`
  }
];
