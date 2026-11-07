# Esquema do roteiro (JSON)

O roteiro é um objeto JSON. A ferramenta `roteiro` (ação `abrir`) valida e mostra no painel ao lado do chat. Se o JSON não seguir o esquema, a ferramenta recusa e lista cada `ERRO:`; os `aviso:` não impedem a abertura.

```
roteiro
└── marcos[]          etapas grandes, mostradas na trilha do topo do painel
    └── passos[]      um cartão por passo, com "Deu certo" e "Travei"
```

## Roteiro (raiz)

| Chave | Tipo | Obrigatória | O que faz |
| --- | --- | --- | --- |
| `id` | texto | sim | Identificador estável (letras, números, `-`, `_`). É a chave do progresso guardado: abrir de novo um roteiro com o mesmo `id` retoma de onde parou. Não mude ao corrigir o roteiro. |
| `titulo` | texto | sim | Título do painel. De 2 a 5 palavras. |
| `subtitulo` | texto | não | Uma linha sob o título: o que o roteiro cobre. |
| `ondeComando` | texto | não | Rótulo padrão dos blocos de comando, como `no console do Vostro`. Padrão: `no terminal`. |
| `fim` | texto | não | Frase extra na tela final, depois do `fim` do último marco. |
| `marcos` | lista | sim | Ao menos um marco. |

## Marco

| Chave | Tipo | Obrigatória | O que faz |
| --- | --- | --- | --- |
| `id` | texto | sim | Único no roteiro. Ex.: `m1`. |
| `nome` | texto | sim | Nome curto na trilha: `BIOS`, `Pendrive`. |
| `fim` | texto | não | O que fica verdade quando o marco termina. Aparece na tela de marco concluído e no aviso ao Claude. |
| `passos` | lista | sim | Ao menos um passo. |

Bom tamanho: de 3 a 8 passos por marco, de 2 a 7 marcos. Mais de 60 passos, divida em dois roteiros.

## Passo

Os campos aparecem no cartão nesta ordem: recado do Claude, `ajustes`, `comando`, `corpo`, `alerta`, `entradas`, `dica`, situação do portão, botões.

| Chave | Tipo | O que faz |
| --- | --- | --- |
| `id` | texto, **obrigatória** | Único no roteiro inteiro. Use `m<n>-<palavra>`: `m3-disco`. É por ele que o Claude libera, deixa recado e lê o progresso. Não mude depois de publicado. |
| `titulo` | texto, **obrigatória** | Ação curta no imperativo ou o estado a alcançar: `Abra a BIOS`, `Modo do disco: AHCI/NVMe`. |
| `corpo` | Markdown | O que fazer, em 1 a 3 parágrafos curtos. `**negrito**` para os nomes exatos da tela, `` `F2` `` para teclas e trechos de código, listas, links. |
| `ajustes` | lista de `{caminho, opcao, valor}` | Linhas "menu → opção → valor", como numa tela de BIOS ou de instalador. `caminho` é o menu (opcional), `opcao` o nome do campo, `valor` o que escolher, em destaque. |
| `comando` | texto | Um comando de terminal, num bloco com botão Copiar. De preferência uma linha. Nunca ponha senhas ou chaves aqui. |
| `onde` | texto | Troca o rótulo do bloco de comando só neste passo (`no terminal do Mac`). |
| `alerta` | Markdown | Caixa de aviso para o que não tem volta ou assusta: "o Windows não inicia mais", "salve a senha antes". |
| `dica` | texto puro | Aparece em "Se não deu certo". O conserto mais provável. |
| `entradas` | lista de `{id, rotulo, exemplo?, opcional?}` | Campos que a pessoa preenche (um IP, um número da tela). O botão só avança com os obrigatórios preenchidos. Os valores chegam ao Claude nos avisos e na ação `estado`. `exemplo` vira o texto de fundo. Nunca peça senhas aqui. |
| `gate` | `true` | Portão: o passo só avança depois que o Claude libera (ação `liberar`). Use antes de algo destrutivo ou quando o Claude precisa conferir valores. Não se pula pela trilha. |
| `mensagem` | texto | Num portão, frase que vai junto do pedido de OK ao Claude. |

Roteiros antigos com `corpo` e `alerta` em HTML simples (`<p>`, `<strong>`, `<kbd>`, `<code>`) são convertidos para Markdown ao abrir.

## O que o Claude recebe

- **Mensagens `[roteiro] ...`** na sessão, que começam um turno: "Travei" (com a nota e os valores), pedido de OK num portão (com os valores), marco concluído, roteiro concluído.
- **Uma linha de contexto** junto de cada mensagem que a pessoa digita, com o passo na tela, quantos foram feitos, onde travou e que portão espera OK.
- **A ação `estado`**: cada passo com `pendente`, `ok`, `travou` ou `aguardando`, os valores, as notas e os recados.

O progresso fica na sessão e também guardado entre sessões, pela chave `id` do roteiro.
