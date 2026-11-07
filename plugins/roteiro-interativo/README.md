# Roteiro Interativo

Quando o Claude precisa passar uma sequência longa de passos manuais (instalar um sistema, ajustar a BIOS, configurar um painel), em vez de uma lista no chat ele abre um painel ao lado da conversa:

- um passo por cartão, como um slide, com **Deu certo** e **Travei**;
- marcos na trilha do topo e uma tela de comemoração a cada marco;
- blocos de comando e de "menu → opção → valor", com botão Copiar;
- campos para valores da tela (um IP, um tamanho de disco);
- **portões** antes de passos sem volta, que só abrem quando o Claude confere e libera;
- **recados** do Claude no próprio cartão.

"Travei", o pedido de OK num portão e o fim de cada marco chegam ao Claude como mensagem na sessão, sem copiar nada. Cada mensagem que você digita leva junto o passo em que você está. O progresso fica guardado: abrir o mesmo roteiro em outra sessão retoma de onde parou.

## Como usar

Nada a fazer: a skill `roteiro-interativo` entra sozinha quando o Claude vai passar 4 ou mais passos manuais, ou quando você pede "me guia", "passo a passo", "um passo de cada vez". `/roteiro` abre o painel de novo se você o fechar.

## Instalar

```
claude plugin marketplace add novantir/claude-plugins
claude plugin install roteiro-interativo@novantir-plugins
```

Num clone local do repositório, `claude plugin marketplace add <pasta do clone>` lê o plugin direto da pasta.

## Conteúdo

```
hooks/register.tsx          o painel, a ferramenta "roteiro" e os avisos ao Claude
hooks/roteiro.ts            validação do JSON, posição e resumos
types/index.d.ts            o estado do painel
skills/roteiro-interativo/
  SKILL.md                  quando usar, como montar, abrir e acompanhar
  referencia/esquema.md     o esquema do JSON
  exemplos/teste-do-roteiro.json
tests/                      claude plugin test .
```

## Licença

MIT, veja [LICENSE](LICENSE).
