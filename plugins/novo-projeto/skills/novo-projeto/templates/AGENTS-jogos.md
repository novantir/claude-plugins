# AGENTS.md — {{Nome do jogo}}

{{Uma frase: que jogo é, para que plataforma.}}

Este é o único arquivo de instruções do repositório. Vale junto com as regras globais do Rafael (`~/.claude/CLAUDE.md`); quando divergirem, este prevalece. O estado atual e a próxima ação vivem em `CONTEXTO.md`, atualizado no fim de cada sessão.

## 1. O que é

- **Jogo:** {{gênero, ideia central, em 2 ou 3 linhas}}
- **Plataforma:** {{Windows · macOS · web · celular}}
- **Estado:** {{protótipo · primeira fase jogável · em acabamento}}, desde {{data}}.

## 2. Engine e ferramentas

- **Engine:** {{Godot 4.x · Unreal 5.x · a decidir}}, versão travada em {{arquivo}}.
- **Máquina de desenvolvimento:** {{Alienware (Windows) · MacBook Pro}}. Builds de distribuição saem de {{máquina}}.
- **Assets grandes** (`.png`, `.wav`, `.blend`, cenas binárias) passam pelo Git LFS; `.gitattributes` diz quais.

## 3. Como rodar e testar

{{Comando ou passo para abrir no editor, rodar a cena principal e rodar a verificação automática, se houver.}}

## 4. Convenções

- Docs e mensagens de commit em português; código, nomes de nós, cenas e assets em inglês.
- Commits pequenos, `tipo: descrição`. Cena ou asset binário: um por commit, com a descrição do que mudou, porque o diff não mostra.
- Nunca editar arquivo binário (`.uasset`, `.tscn` binária, `.blend`) como texto.
- Decisões de design em `docs/design/`, com data.

## 5. Regras críticas

- Chaves de serviços (IA, voz, lojas) nunca no projeto nem no pacote final; só o nome da variável.
- Nada de asset de terceiros sem licença registrada em `ASSETS.md` (nome, autor, URL, licença, onde é usado, se é gerado por IA).
- Publicar na loja, na jam ou em qualquer lugar: só o Rafael.

## 6. Fluxo de trabalho

- Mudança de código segue o **Full Stop / Full Send** (plugin `full-stop-send`) quando o repositório tiver `docs/processo/full-stop-send.md`; sem ele, só Full Stop: PR e parada antes do merge.
- Fim de sessão: atualizar `CONTEXTO.md` (o que ficou pronto, o que travou, a próxima ação).

## 7. Lembretes

{{Pegadinhas da engine e da máquina. Comece vazio.}}
