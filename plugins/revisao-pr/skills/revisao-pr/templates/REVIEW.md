# REVIEW.md — {{Nome do projeto}}

O que o revisor de PR (skill `revisao-pr`) precisa saber deste repositório. Escrito por quem conhece o código; curto, para caber inteiro no contexto de cada revisor. O `AGENTS.md` diz como se programa aqui; este arquivo diz **o que é falha aqui**.

## Como uma falha se parece neste código

Liste o que já quebrou ou quebraria de verdade, em ordem de dano. Exemplos a trocar pelos seus:

- Consulta sem o filtro do tenant (`workspace_id`): dado de um cliente aparece para outro.
- Webhook de pagamento processado duas vezes (sem idempotência).
- Migration que altera coluna em uso sem passo de compatibilidade.
- Texto de interface ou e-mail mudado sem passar pelo i18n.

## Caminhos que são sempre Deep

Qualquer arquivo aqui leva a revisão ao nível Deep (mais revisores, mais verificadores, até 5 rodadas):

- `{{src/auth/**}}`
- `{{src/billing/**}}`
- `{{db/migrations/**}}`
- `.github/workflows/**`

## Caminhos a pular

O revisor não comenta sobre estes (gerados, vendorizados, fixtures):

- `{{dist/**}}`
- `{{**/*.lock}}`
- `{{tests/fixtures/**}}`

## Convenções que o revisor cobra

Só as que, quebradas, viram bug ou dívida real (as de estilo o formatador cuida):

- {{Toda chamada externa passa por `run_cmd` com timeout.}}
- {{Erro nunca é engolido: `catch` sem tratamento é achado Important.}}
- {{Teste de bug prova a falha antes da correção.}}

## Prova exigida

O que o PR precisa mostrar para cada tipo de mudança (a matriz do `docs/processo/full-stop-send.md` prevalece se existir):

| Tipo | Prova |
|---|---|
| Bug | teste que falha sem a correção |
| UI | rodou e olhou (captura ou descrição do que viu) |
| Migration | aplicada e revertida em banco local |

## Limites do revisor

- **Teto de nits por rodada:** {{3}}. Acima disso, só os mais úteis.
- **Resumo começa com a contagem:** "N achados: a Important, b Nit, c Pre-existing".
- **Todo achado cita `arquivo:linha`** e o que faria a falha aparecer. Sem isso, não é achado.
- **Código antigo** (não tocado pelo diff) só entra como Pre-existing, e no máximo {{2}} por PR.

## Falsos positivos conhecidos

O que o revisor já apontou e estava errado, para não repetir:

- {{`eslint-disable-next-line` em `legacy/` é intencional até a NOV-00.}}
