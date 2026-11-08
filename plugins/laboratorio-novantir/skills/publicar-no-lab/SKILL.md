---
name: publicar-no-lab
description: Use quando um app da Novantir precisa ir para o laboratório (o servidor Linux de casa, "Vostro") como protótipo para o cliente ver ou como staging, ou quando a pessoa fala em "subir no lab", "staging no Vostro", "deploy no laboratório", "<app>-stg.novantir.com.br", "tirar o staging da AWS", ou pede para atualizar, ver o estado, ver logs ou voltar a versão de um app que já está lá. Também para criar ou corrigir o deploy/lab/compose.yaml de um app. Não use para produção (essa vai para a AWS) nem para mudanças no próprio servidor (scripts, túnel, backup), que são feitas no repositório servidor.
---

# Publicar um app no laboratório

O laboratório é o Vostro (Ubuntu, `ssh vostro` pelo Tailscale). Ele substitui Vercel, Railway e Supabase para protótipos e staging, de graça. A produção fica na AWS.

## Antes de qualquer coisa

1. **Leia o manual inteiro:** `~/projects/novantir/servidor/docs/MANUAL-APP-NO-LAB.md`. Ele é a fonte de verdade: contrato do `deploy/lab/compose.yaml`, endereços, passo a passo, deploys, logs, limites. Se não conseguir ler o arquivo, peça acesso à pasta `~/projects/novantir/servidor` e pare até ter.
2. Use como modelo `~/projects/novantir/servidor/exemplos/app-exemplo/` (front, API e banco), validado de ponta a ponta.

## Divisão de trabalho

- **Você, no repositório do app:** cria `deploy/lab/compose.yaml`, os Dockerfiles que faltarem e `deploy/lab/env.exemplo` (só os **nomes** das variáveis). Depois commita, porque o deploy envia o commit, não a pasta. Mudanças no repositório `servidor` não são deste trabalho: se algo lá precisar mudar, descreva e peça ao Rafael.
- **Rafael, uma vez por app:** `ssh -t vostro 'sudo ~/servidor/scripts/40-projeto.sh <app> 30G'`. Você **nunca** digita nem pede a senha dele. Ponha o comando num terminal para ele e espere.
- **Deploy:** `~/projects/novantir/servidor/scripts/lab-deploy.sh <app> <pasta-do-repo>`, do Mac, sem `sudo`. Você mesmo pode rodar.
- **Rotas públicas:** no Cloudflare (túnel `vostro`), uma vez por app, como o manual descreve.
- **Segredos:** ficam só em `/srv/projetos/<app>/.env` no servidor. Nunca entram no repositório, no chat ou em argumentos de comando. Quem cria segredos novos (chaves de API, IAM) é o Rafael.

## Regras que não mudam

- Nenhum `ports:` no compose. Front e API entram na rede `borda-<app>` com alias `<app>-<serviço>`. O banco fica só na rede interna.
- Front estático (Next `output: "export"`), com a URL da API definida no build. Staging com `noindex`.
- Nada de dados reais sensíveis no laboratório. Custo novo (bucket, domínio, chave paga) só com o OK do Rafael.
- Se o app já tem staging na AWS, **não desligue nada lá**. Desligar é decisão do Rafael, item por item, depois que o staging do laboratório estiver aprovado.

## Ao terminar

Confira de fora: o front abre em `https://<app>-stg.novantir.com.br` e chama a API. Registre no repositório do app como o staging funciona (um README em `deploy/lab/`). Relate o que foi validado, o que ficou pendente e o que depende do Rafael.
