# AGENTS.md — {{Nome do projeto}}

{{Uma frase: o que o produto é e para quem.}}

Este é o único arquivo de instruções do repositório. Vale junto com as regras globais do Rafael (`~/.claude/CLAUDE.md`); quando divergirem, este prevalece. Regras estáveis ficam aqui; pegadinhas técnicas vão para `docs/troubleshooting/`, uma por arquivo.

## 1. O que é

- **Produto:** {{o que faz, em 2 ou 3 linhas}}
- **Para quem:** {{cliente ou público}}
- **Estado:** {{ideia · protótipo · em uso}}, desde {{data}}.

## 2. Stack

{{A decidir. Quando decidir, registre aqui camada por camada: front, back, banco, hospedagem, e onde roda em produção. Nada de serviço pago novo sem o OK do Rafael.}}

## 3. Como rodar local

{{A decidir. Comandos exatos, portas e o que precisa estar instalado.}}

## 4. Convenções

- Português do Brasil em tudo que gente lê: docs, UI, comentários e mensagens de commit. Código, tabelas e nomes em inglês.
- Commits pequenos, `tipo: descrição` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- Documentação em `docs/`, nunca `.md` solto na raiz. Decisões com data e motivo.
- Sem `try/catch` decorativo, sem fallback para cenário que não acontece, sem abstração antes do terceiro caso parecido.

## 5. Regras críticas

- **Segredos** nunca em arquivo versionado, log ou chat; só o nome da variável. Pedir chave pelo plugin `secret-input-card`.
- **Dados de pessoas:** {{o que o produto guarda e a regra de LGPD, ou "não guarda dados pessoais"}}.
- **Produção:** deploy, cobrança, e-mail real e operação destrutiva só com o OK explícito do Rafael.
- {{Outras regras que não se quebram}}

## 6. Fluxo de trabalho

- Toda mudança segue o **Full Stop / Full Send** (plugin `full-stop-send`): branch da issue, PR com a prova, CI, revisão independente, e parada antes do merge. A configuração deste repositório fica em `docs/processo/full-stop-send.md` (checks da CI, matriz de prova e a classe liberada para Full Send; sem o arquivo, só Full Stop).
- Rastreador: {{Linear, time NOV · ou "sem rastreador ainda"}}.

## 7. Lembretes

{{Coisas que o agente deve lembrar antes de mexer em partes sensíveis. Comece vazio.}}
