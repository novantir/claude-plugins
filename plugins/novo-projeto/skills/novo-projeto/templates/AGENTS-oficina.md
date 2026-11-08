# AGENTS.md — {{Nome}}

{{Uma frase: que parte do processo de programar este repositório cuida.}}

Este é o único arquivo de instruções do repositório. Vale junto com as regras globais do Rafael (`~/.claude/CLAUDE.md`); quando divergirem, este prevalece.

## 1. O que é

- **Cuida de:** {{o pedaço do processo: configuração, plugins, monitoramento, fábrica, servidor…}}
- **Vizinhos na `oficina/`:** `claude-config` (regras globais), `claude-plugins` (skills e plugins), `cockpit` (monitor), `flux-capacitor` (fábrica de apps), `servidor-vostro` (laboratório). Não duplicar o que já mora num deles; apontar.

## 2. Stack

{{Linguagem e dependências. Na oficina, preferir o que já está na máquina (Python do sistema, zsh) e nada de dependência externa sem motivo escrito.}}

## 3. Como rodar e validar

{{Comandos de rodar, testar e validar, na ordem em que um PR precisa passar.}}

## 4. Convenções

- Docs, UI e commits em português; identificadores em inglês. Commits pequenos, `tipo: descrição`.
- Roda igual nas duas máquinas com Claude (MacBook Pro e Alienware) e, quando for o caso, no servidor Linux.
- Toda mudança de regra tem data e motivo no próprio arquivo.

## 5. Regras críticas

- Segredos só por variável de ambiente ou Keychain; nunca em arquivo, log ou argumento de comando.
- Só leitura dentro dos projetos que esta ferramenta observa; nunca escreve neles.
- O que chega às outras máquinas (publish, instalador) só sai com o OK do Rafael.

## 6. Fluxo de trabalho

- PR e parada antes do merge (**Full Stop**, plugin `full-stop-send`).

## 7. Lembretes

{{Comece vazio.}}
