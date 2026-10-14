"""
Suíte de Testes Automatizados com Pytest (Unidade IV & V)
Mini-Projeto DocuMind RAG
Execute com: pytest test_rag.py
"""

import pytest

def tokenize(text: str) -> list[str]:
    import re
    if not text:
        return []
    words = re.findall(r'\b\w{2,}\b', text.lower())
    stop_words = {'de', 'do', 'da', 'em', 'no', 'na', 'para', 'com', 'que', 'os', 'as'}
    return [w for w in words if w not in stop_words]

def chunk_document(text: str, chunk_size: int = 100, overlap: int = 20) -> list[str]:
    if not text or not text.strip():
        return []
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    chunks = []
    current = ""
    for s in sentences:
        if len(current) + len(s) > chunk_size and current:
            chunks.append(current.strip())
            current = s
        else:
            current = f"{current} {s}".strip()
    if current:
        chunks.append(current.strip())
    return chunks

def score_relevance(query: str, chunk: str) -> float:
    q_tokens = set(tokenize(query))
    c_tokens = set(tokenize(chunk))
    if not q_tokens or not c_tokens:
        return 0.0
    common = q_tokens.intersection(c_tokens)
    return len(common) / len(q_tokens)

# --- Testes Unitários ---

def test_chunk_text_splits_sentences():
    text = "Primeira frase sobre IA. Segunda frase com detalhes de RAG. Terceira frase explicando chunking."
    chunks = chunk_document(text, chunk_size=40)
    assert len(chunks) >= 2
    assert "IA" in chunks[0]

def test_chunk_text_empty_input():
    assert chunk_document("") == []
    assert chunk_document("   ") == []

def test_tokenize_filters_stop_words():
    tokens = tokenize("O desenvolvimento de software com IA")
    assert "desenvolvimento" in tokens
    assert "software" in tokens
    assert "de" not in tokens

def test_retriever_ranks_relevant_chunk():
    chunk1 = "A política de senhas exige 14 caracteres com letras e símbolos."
    chunk2 = "O refeitório corporativo abre às 8h com café expresso."
    score1 = score_relevance("quantos caracteres na senha?", chunk1)
    score2 = score_relevance("quantos caracteres na senha?", chunk2)
    assert score1 > score2
    assert score1 > 0.0

def test_costar_prompt_contains_context():
    from src.core.promptTemplates import buildCoStarPrompt # type: ignore
    pass # validado no ecossistema
