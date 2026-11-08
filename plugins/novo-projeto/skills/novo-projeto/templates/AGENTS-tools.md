# AGENTS.md — {{Nome da tool}}

{{Uma frase: o que a ferramenta faz e quais produtos a usam.}}

Este é o único arquivo de instruções do repositório. Vale junto com as regras globais do Rafael (`~/.claude/CLAUDE.md`); quando divergirem, este prevalece.

## 1. O que é

- **Faz:** {{entrada → saída, em 2 ou 3 linhas}}
- **Usada por:** {{produtos ou fluxos que dependem dela}}
- **Regra da pasta `tools/`:** aqui fica só código. A peça produzida (vídeo, relatório, dado coletado) pertence ao produto que a pediu e é guardada lá, nunca aqui.

## 2. Stack

{{Linguagem, runtime e dependências travadas em {{arquivo de lock}}. A decidir, se ainda não foi.}}

## 3. Como rodar

{{Comando exato, com um exemplo de entrada e a saída esperada. Diga o que precisa estar instalado e o que custa dinheiro (API paga): custo só com o OK do Rafael, mostrado antes.}}

## 4. Convenções

- Docs e commits em português; código e nomes em inglês. Commits pequenos, `tipo: descrição`.
- Toda função que chama serviço pago mostra o custo estimado antes e aceita um modo seco (`--dry-run`).
- Sem segredo no repositório; chaves por variável de ambiente, pedidas pelo plugin `secret-input-card`.
- Mudança que altera a saída da ferramenta vem com um exemplo novo em `exemplos/` e o `CHANGELOG.md` atualizado.

## 5. Regras críticas

- Nunca publicar, enviar ou postar nada por conta própria: a tool produz, o Rafael publica.
- Peça com voz, avatar ou imagem de IA diz isso na descrição, sempre.
- {{Outras regras}}

## 6. Fluxo de trabalho

- PR para tudo que muda comportamento; parada antes do merge (**Full Stop**, plugin `full-stop-send`).

## 7. Lembretes

{{Pegadinhas das APIs e formatos. Comece vazio.}}
