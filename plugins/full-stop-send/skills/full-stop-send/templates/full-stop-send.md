# Full Stop / Full Send — {{Nome do projeto}}

A configuração deste repositório para a skill `full-stop-send` (plugin do marketplace `novantir/claude-plugins`). A skill guarda o fluxo; aqui ficam só os dados daqui. O que estiver aqui prevalece quando for mais restrito, e nunca afrouxa as listas "Sempre proibido" e "Sempre Full Stop" da skill.

## Rastreador e branch

- **Rastreador:** {{Linear, time NOV · ou "sem rastreador"}}
- **ID da issue:** {{NOV-N}}; branch `{{nov-n-slug-curto}}`; o PR começa com `Resolve {{NOV-N}}`.

## Checks exigidos para o merge

| Check | Comando |
|---|---|
| `{{Backend}}` | `{{./mvnw -B verify}}` |
| `{{Frontend}}` | `{{pnpm lint && pnpm test && pnpm build}}` |

{{Sem CI ainda: escreva "sem CI" e crie a CI antes do primeiro cliente.}}

## Matriz de prova

| Tipo de mudança | Prova |
|---|---|
| Bug | Teste que falha sem a correção e passa com ela. |
| UI | Rodar e olhar. |
| {{Migration}} | {{Aplicada em banco local.}} |
| {{Infra}} | {{Parse do arquivo e um run na CI.}} |

## Full Send: classe liberada

{{Vazia: só Full Stop. Para liberar, liste os caminhos, por exemplo "arquivos `.md` em `docs/**`, exceto `docs/processo/**`".}}

**Sempre Full Stop aqui, além da lista da skill:** {{caminhos sensíveis deste repositório}}

## Fechamento

- **Labels e prioridades:** {{tipo (Feature, Bug, Refactor...) e área; prioridade High, Medium ou Low}}
- **Comando dos índices de docs:** `{{python3 scripts/docs-index.py}}` {{ou "não tem"}}
- **Issues que nunca fecham:** {{as de manutenção recorrente, com o ID · ou "nenhuma"}}
- **Issue de ideias a avaliar:** {{ID · ou "não tem"}}

## Como reverter

{{Um passo, ou o link do runbook em `docs/operacao/`. Diga se a volta já foi ensaiada.}}
