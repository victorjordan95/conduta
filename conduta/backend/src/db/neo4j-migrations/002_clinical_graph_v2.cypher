CREATE CONSTRAINT protocolo_id IF NOT EXISTS
FOR (n:Protocolo) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT documento_versao_id IF NOT EXISTS
FOR (n:DocumentoVersao) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT documento_chunk_id IF NOT EXISTS
FOR (n:DocumentoChunk) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT proposta_conhecimento_id IF NOT EXISTS
FOR (n:PropostaConhecimento) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT diagnostico_nome_normalizado IF NOT EXISTS
FOR (n:Diagnostico) REQUIRE n.nomeNormalizado IS UNIQUE;

CREATE FULLTEXT INDEX diagnostico_busca IF NOT EXISTS
FOR (n:Diagnostico) ON EACH [n.nome, n.sinonimosTexto];

CREATE INDEX protocolo_status IF NOT EXISTS
FOR (n:Protocolo) ON (n.status, n.effectiveFrom);

CREATE INDEX documento_versao_status IF NOT EXISTS
FOR (n:DocumentoVersao) ON (n.status, n.publishedAt);

CREATE INDEX proposta_status_created IF NOT EXISTS
FOR (n:PropostaConhecimento) ON (n.status, n.createdAt);
