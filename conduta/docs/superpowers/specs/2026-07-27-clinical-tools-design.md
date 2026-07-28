# Ferramentas clínicas de apoio — desenho

## Objetivo

Adicionar quatro fluxos explícitos de apoio ao raciocínio clínico sem alterar o fluxo principal de análise, sem substituir julgamento profissional e sem salvar automaticamente novos textos no prontuário.

## Escopo

1. Perguntas que podem mudar a análise.
2. Comparação da evolução do caso.
3. Modo passagem de caso.
4. Revisão medicamentosa estruturada.

## Arquitetura

- O backend expõe `POST /sessions/:id/clinical-tools`.
- A rota exige autenticação, valida a sessão do usuário e rejeita sessões sem análise do assistente.
- O corpo informa `tool` e, somente para revisão medicamentosa, os fatores estruturados informados pelo profissional.
- Um serviço isolado monta prompts de segurança e chama o mesmo provedor configurado para análise.
- O resultado é retornado como texto Markdown temporário; não é persistido automaticamente.
- A análise principal, o resumo para prontuário e o histórico de mensagens existentes permanecem inalterados.

## Interface

- O cabeçalho da sessão exibe um menu “Ferramentas de revisão” quando existe resposta do assistente.
- Cada opção abre o mesmo modal, com estado de carregamento, erro, resultado e aviso de conferência.
- A revisão medicamentosa coleta medicamentos em uso, alergias, gestação/lactação, função renal/hepática e outros fatores antes da chamada.
- O resultado pode ser fechado e reaberto somente por nova solicitação; não é inserido no prontuário automaticamente.

## Guardrails

- Saídas devem usar linguagem de apoio: “pode ajudar”, “revisar” e “considerar”.
- O modelo não deve afirmar diagnóstico, prescrição definitiva, segurança absoluta ou substituição de protocolo.
- A revisão medicamentosa deve apontar dados ausentes e exigir conferência de fonte oficial, dose, interações e protocolo local.
- Não criar recomendações farmacológicas quando os dados forem insuficientes.
- Limitar o tamanho das entradas auxiliares e validar as ferramentas permitidas no backend.

## Testes

- Testar montagem dos prompts e validação de ferramenta no backend.
- Testar autorização e respostas de erro da rota.
- Testar que o componente exibe as quatro opções, coleta os campos da revisão medicamentosa e apresenta o resultado.
- Executar testes existentes, build do frontend e lint/testes disponíveis no repositório.
