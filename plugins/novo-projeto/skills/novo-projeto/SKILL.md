---
name: novo-projeto
description: Use quando o Rafael quer começar um projeto novo, em qualquer categoria ("cria um projeto novo", "começa um produto chamado X", "novo jogo", "nova tool", "cria o repo do Y", "inicia o projeto"). A skill pergunta o que falta, cria a pasta na categoria certa de ~/projects (produtos, jogos, tools ou oficina), inicia o git, escreve o AGENTS.md a partir do modelo da categoria, o README e o .gitignore, e deixa prontos os passos que dependem do OK dele (repositório no GitHub e registro no cockpit). Não use para mover ou renomear um projeto que já existe, nem para criar subpastas dentro de um repositório.
---

# Novo projeto

Cria um projeto do Rafael do jeito que os outros já são: na pasta da categoria, com `AGENTS.md` no padrão, `README.md`, `.gitignore` e git iniciado. O conhecimento que vale para todos os projetos de uma categoria mora nos modelos desta skill, em `templates/`: quando uma regra nova se mostrar útil em vários projetos, ela entra no modelo, e os projetos seguintes já nascem com ela.

## 1. Pergunte só o que falta

Antes de criar qualquer coisa, tenha estas respostas (pergunte de uma vez o que o pedido não disse):

| Dado | Regra |
|---|---|
| **Nome** | minúsculas, sem acento, palavras separadas por hífen (`nfse-rapida`). Vira o nome da pasta e do repositório. |
| **Categoria** | `produtos` (o que se vende ou publica: software, canal, site), `jogos`, `tools` (ferramenta reaproveitada entre produtos; só código) ou `oficina` (como se programa: ferramentas do próprio processo). Na dúvida entre tools e oficina: tools serve aos produtos, oficina serve ao Rafael programando. |
| **Uma frase** | o que o projeto é, para a segunda linha do `AGENTS.md` e o README. |
| **Stack** | só se já estiver decidida. Sem decisão, o `AGENTS.md` fica com a seção em aberto; não invente. |
| **Repositório no GitHub** | privado por padrão, na organização `novantir`. Público só se ele disser. |

Caminho final: `~/projects/<categoria>/<nome>`. Se a pasta já existir, pare e avise: esta skill não sobrescreve nada.

## 2. Crie a pasta e os arquivos

1. `mkdir -p ~/projects/<categoria>/<nome> && cd` nela, e `git init -b main`.
2. **`AGENTS.md`:** copie `templates/AGENTS-<categoria>.md` desta skill (a pasta da skill está em `${CLAUDE_PLUGIN_ROOT}/skills/novo-projeto/templates/`, ou ao lado deste arquivo) e preencha os `{{campos}}`. O título é sempre `# AGENTS.md — <Nome do projeto>`, e a linha seguinte diz o que o projeto é. Não apague seções do modelo; o que ainda não foi decidido fica marcado como "a decidir".
3. **`README.md`:** a partir de `templates/README.md`.
4. **`.gitignore`:** a partir de `templates/gitignore-base` mais o bloco da stack, se houver (`gitignore-node`, `gitignore-python`, `gitignore-java`, `gitignore-godot`).
5. **`REVIEW.md`:** se a skill `revisao-pr` estiver instalada, peça a ela ("cria o REVIEW.md") e preencha só o que já dá para saber (caminhos sensíveis da stack, teto de nits); o resto fica `{{a decidir}}`. É o arquivo que o revisor de PR lê para saber o que é falha neste código.
5. Nada de `CLAUDE.md` no repositório: o Claude Code lê o `AGENTS.md` direto (regra global).
6. Primeiro commit, em português: `chore: nasce o projeto <nome> (<categoria>)`.

## 3. O que depende do OK do Rafael

Deixe os comandos prontos e **peça o OK antes de rodar** cada um:

- **Repositório no GitHub:** `gh repo create novantir/<nome> --private --source=. --remote=origin --push`.
- **Cockpit:** acrescente a entrada do projeto em `~/projects/oficina/cockpit/config/cockpit.json`, na lista `projects` do MacBook Pro, no fim da lista (os testes conferem a ordem), no formato `{ "id": "<nome>", "label": "<Nome>", "path": "~/projects/<categoria>/<nome>", "github": "novantir/<nome>" }` (sem GitHub: `"github": null, "expect_git": false, "expect_remote": false, "files": true`). Depois, no cockpit: `make validate`, `make test`, `make sign`, commit, e o publish (`zsh scripts/publish.sh`) só com o OK dele.
- **Laboratório ou produção:** não fazem parte desta skill. Deploy no Vostro é a skill `publicar-no-lab`; produção é decisão dele.

## 4. Ao terminar

Diga em uma linha onde o projeto ficou, o que foi criado e o que ainda espera o OK dele. Se, ao preencher o modelo, você percebeu uma regra que faltava no modelo da categoria, diga isso também: o modelo é onde o conhecimento se acumula, e mudá-lo é um PR no repositório `claude-plugins`.
