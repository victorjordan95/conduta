# Outreach manual do Instagram

Este diretório controla lotes de contatos fornecidos pelo responsável pela conta `conduta.medical`.

## Fluxo

1. Preparar um lote pequeno com mensagens individualizadas.
2. Manter o status como `awaiting_approval` até a aprovação humana.
3. Enviar manualmente pelo navegador, sem agendamento autônomo.
4. Atualizar `sent-log.csv` somente depois da confirmação do envio.
5. Nunca reenviar para um username com status `sent`.

`sent-log.csv` mantém as colunas `batch_id`, `username`, `display_name`, `status`, `sent_at` e `notes`. Quando o usuário confirma um contato enviado anteriormente, o registro pode usar `USER_CONFIRMED`, manter `sent_at` vazio quando a data não for conhecida e registrar essa origem em `notes`.

`following-list.csv` é o snapshot ordenado da lista de seguindo. `following-checkpoint.md` registra o último username seguido; em novas listas, considerar apenas os perfis posteriores ao checkpoint e nunca reenviar para usernames já presentes em `sent-log.csv` com status `sent`.

O anexo original continha HTML da lista do Instagram. A personalização deste primeiro lote está limitada ao username, porque não há contexto profissional confiável para os contatos. Não afirmar que o perfil foi analisado, não inventar profissão e não usar dados sensíveis.

Mensagens são convite inicial, não orientação médica. Não há integração com a Meta nem envio automático.
