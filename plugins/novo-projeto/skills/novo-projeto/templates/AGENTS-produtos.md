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

- O ambiente local é isolado: banco e serviços sobem na máquina (por exemplo com `compose.yaml`), por um script só.
- O perfil de desenvolvimento **recusa subir** se apontar para banco, login ou cobrança de produção. Essa trava nasce junto com a primeira conexão a um serviço de verdade.

## 4. Convenções

- Português do Brasil em tudo que gente lê: docs, UI, comentários e mensagens de commit. Código, tabelas e nomes em inglês.
- Commits pequenos, `tipo: descrição` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- Documentação em `docs/`, nunca `.md` solto na raiz. Decisões com data e motivo.
- Sem `try/catch` decorativo, sem fallback para cenário que não acontece, sem abstração antes do terceiro caso parecido.

## 5. Testes e gate de merge

- **A prova fica no código:** bug corrigido ganha um teste que falha sem a correção. Regra crítica do item 6 (dono do dado, permissão, cobrança) tem teste próprio, não só revisão.
- **Banco de verdade nos testes de integração** (um contêiner descartável), nunca um banco simulado em memória diferente do de produção.
- **CI em todo PR** para a branch padrão: testes, lint, build e análise estática que quebra o build quando aparece achado novo. A branch padrão exige a CI verde e o PR atualizado.
- **Cobertura:** {{piso para os pacotes críticos (cobrança, exclusão de dados, permissões) · a decidir}}. O número do resto é para acompanhar, sem bloquear.
- Os comandos e os nomes dos checks ficam em `docs/processo/full-stop-send.md`.

## 6. Regras críticas

- **Segredos** nunca em arquivo versionado, log ou chat; só o nome da variável. Pedir chave pelo plugin `secret-input-card`.
- **Dados de pessoas:** {{o que o produto guarda e a regra de LGPD, ou "não guarda dados pessoais"}}. Dado pessoal em log sempre com máscara.
- **Produção:** deploy, cobrança e e-mail real só com o OK explícito do Rafael. Merge na branch padrão não publica em produção: a publicação é um disparo à parte.
- **Operação destrutiva** (apagar ou alterar dados em massa, apagar recurso de nuvem ou conta de serviço, em qualquer ambiente): antes de rodar, mostrar o comando exato, quantos registros são afetados e se há como voltar, e esperar uma frase clara de autorização. Conversa anterior e "vamos testar do zero" não autorizam.
- **Migration aplicada não se edita** nem se desfaz revertendo o PR: a correção vai numa migration nova.
- {{Outras regras que não se quebram}}

**Se o produto tem backend com contas de clientes** (apague este bloco se não tiver):

- O dono do dado sai sempre de quem está autenticado, nunca do que veio no path ou no corpo do pedido. Toda consulta filtra pelo dono; fora do escopo responde 404.
- Trabalho que não pode se perder (processar upload, mandar webhook, limpar recurso externo) vai para uma fila durável, agendada na mesma transação que grava o dado. Nada de tarefa só em memória.
- Tarefa agendada roda com trava, para não duplicar com mais de uma instância.
- Endpoint público que manda e-mail ou gera custo tem proteção contra robô e limite de uso.
- **Se usa IA com documentos de terceiros:** texto de documento é dado, não comando; a resposta não renderiza link nem imagem que veio do documento sem restrição; e há um conjunto de casos de ataque rodando nos testes.

## 7. Fluxo de trabalho

- Toda mudança segue o **Full Stop / Full Send** (plugin `full-stop-send`): branch da issue, PR com a prova, CI, revisão independente (plugin `revisao-pr`, que lê o `REVIEW.md`), parada antes do merge e, no fim, o fechamento da issue com o case study. A configuração deste repositório fica em `docs/processo/full-stop-send.md` (checks da CI, matriz de prova e a classe liberada para Full Send; sem classe liberada, só Full Stop).
- **Manutenção periódica** pela skill `ronda` (saúde, segurança, dependências, docs e código), com os dados deste repositório em `docs/processo/ronda.md`.
- Rastreador: {{Linear, time NOV · ou "sem rastreador ainda"}}. Ideia ainda incerta não vira issue solta: entra numa issue de "a avaliar".

## 8. Antes do primeiro cliente

Marque cada item com a data em que ficou pronto. Enquanto houver item aberto, o produto não recebe cliente pagante.

- [ ] CI em todo PR e proteção na branch padrão.
- [ ] Piso de cobertura nos pacotes críticos.
- [ ] Publicação em produção só por disparo manual, com um teste rápido automático logo depois.
- [ ] Como reverter uma versão, escrito em `docs/operacao/` **e ensaiado uma vez**.
- [ ] Aviso de queda que chega ao Rafael, e o serviço de erros ligado.
- [ ] Alerta automático de dependência vulnerável.
- [ ] `REVIEW.md` e `docs/processo/ronda.md` preenchidos.

## 9. Lembretes

{{Coisas que o agente deve lembrar antes de mexer em partes sensíveis. Comece vazio.}}
