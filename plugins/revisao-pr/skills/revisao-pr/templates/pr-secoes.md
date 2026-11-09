Seções que todo PR traz no corpo (além de "Rodado localmente" e "Só a CI prova" do Full Stop):

## Testado como

- {{comando ou passo}} → {{resultado}}
- {{o que foi olhado à mão, se UI}}

## Risco

{{Quick | Standard | Deep}} — {{por quê: os caminhos tocados e o que pode quebrar se der errado}}.

## Como reverter

{{`git revert` do squash, ou o runbook do repo quando há deploy, migration ou dado envolvido. Se não dá para reverter com um passo, dizer isso aqui.}}
