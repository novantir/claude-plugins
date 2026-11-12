---
name: publicar-no-lab
description: Use quando um app da Novantir precisa dos ambientes de dev e staging no laboratório (o servidor Linux de casa, "Vostro"), como protótipo para o cliente ver ou como staging, ou quando a pessoa fala em "subir no lab", "staging no Vostro", "deploy no laboratório", "<app>-stg.novantir.com.br", "tirar o app do Supabase/Railway/Vercel", "tirar o staging da AWS", "deploy automático do staging", ou pede para atualizar, ver o estado, ver logs ou voltar a versão de um app que já está lá. Também para criar ou corrigir o deploy/lab/compose.yaml de um app. Não use para produção (essa vai para a AWS) nem para mudanças no próprio servidor (scripts, túnel, backup), que são feitas no repositório servidor-vostro.
---

# Ambientes de dev e staging no laboratório

O laboratório é o Vostro (Ubuntu, `ssh vostro` pelo Tailscale). Ele substitui Vercel, Railway e Supabase para protótipos e staging, de graça. A produção fica na AWS.

- **Dev:** no Mac do Rafael, com a demonstração local do app (Postgres local, login de teste). Não sobe dev no Vostro.
- **Staging:** no Vostro, em `https://<app>-stg.novantir.com.br` e `https://<app>-stg-api.novantir.com.br`, só com dados fictícios.
- **Login e e-mail:** Cognito e SES na conta AWS do produto, já no staging. Não há emulação no staging.

## Antes de qualquer coisa

1. **Leia o manual inteiro:** `~/projects/oficina/servidor-vostro/docs/MANUAL-APP-NO-LAB.md`. Ele é a fonte de verdade: contrato do `deploy/lab/compose.yaml`, endereços, passo a passo, deploy manual e automático, logs, limites. Se não conseguir ler o arquivo, peça acesso à pasta `~/projects/oficina/servidor-vostro` e pare até ter.
2. Use como modelos `~/projects/oficina/servidor-vostro/exemplos/app-exemplo/` (o mínimo) e os `deploy/lab/` reais do Ansora (`~/projects/produtos/ansora`) e do EduSys (`~/projects/produtos/edusys`, Java + Next + Cognito, migrado em 11/11/2026; relatório em `docs/ENTREGA-26-STAGING-VOSTRO.md`).
3. **Linear:** veja se o produto tem projeto no Linear (time Novantir). Se não tiver, pergunte ao Rafael se cria. Detalhes em "Linear" abaixo.

## Como conduzir o Rafael

- **Um passo por vez.** Quando ele precisa fazer algo num painel (AWS, Cloudflare, GitHub, Anthropic), mande só o próximo passo, com o link direto e os valores já preenchidos, e espere a resposta antes do seguinte.
- **Pergunte sempre por card de opções** (AskUserQuestion), nunca pedindo para ele digitar. Inclua opções como "Feito", "Não achei" e "Tela diferente".
- Quando ele estiver logado no Chrome e o painel permitir, você mesmo pode navegar e preencher campos que não são segredo (ex.: rotas do Cloudflare, formulário de um token), com o OK dele por card. O clique que gera um segredo é dele, e depois disso você não olha mais a tela.
- Se ele disser que não entendeu, não repita o texto: abra a página você mesmo, veja o que aparece e oriente pelo que está na tela.

## Divisão de trabalho

- **Você, no repositório do app:** cria `deploy/lab/compose.yaml`, os Dockerfiles que faltarem, `deploy/lab/env.exemplo` (só os **nomes** das variáveis) e `deploy/lab/README.md`. Depois commita, porque o deploy envia o commit, não a pasta.
- **Projeto no servidor, uma vez por app:** `ssh vostro 'sudo -n novantir-projeto <app> 30G'`, que roda sem senha e você mesmo pode executar. Se pedir senha, é o Rafael quem roda (`ssh -t vostro 'sudo ~/servidor/scripts/40-projeto.sh <app> 30G'`): você **nunca** digita nem pede a senha dele.
- **Deploy manual:** `~/projects/oficina/servidor-vostro/scripts/lab-deploy.sh <app> <pasta-do-repo> [ref]`, do Mac, sem `sudo`.
- **Deploy automático (CD):** depois do primeiro deploy saudável, ligue com `ssh vostro '~/servidor/scripts/75-cd.sh <app> novantir/<repo>'`. O Vostro passa a publicar sozinho cada commit da `main` com o CI aprovado. Ele precisa que o repositório esteja no token `vostro-cd` (o Rafael edita o token no GitHub e acrescenta o repositório).
- **Rotas públicas:** no Cloudflare, túnel `vostro` → Routes → Published application, uma vez por app: `<app>-stg` → `http://<app>-web:<porta>` e `<app>-stg-api` → `http://<app>-api:<porta>`.
- **Mudanças no repositório `servidor-vostro`:** descreva e peça o OK do Rafael antes; depois do commit, sincronize com `rsync -a --delete --exclude .git --exclude .DS_Store ~/projects/oficina/servidor-vostro/ vostro:servidor/`.

## Segredos

- Ficam só em `/srv/projetos/<app>/.env` no servidor (600). Nunca no repositório, no chat, em log ou em argumento de comando.
- Para receber uma chave, use o cartão protegido (`secret-input-card`) com destino Keychain. Depois copie para o servidor sem exibir: `security find-generic-password -a <conta> -s <serviço> -w | ssh vostro 'cat >> ...'`, num comando que não imprime o valor. Confira só os nomes: `cut -d= -f1`.
- Senhas internas (ex.: papel do banco) você gera no próprio servidor com `openssl rand`, direto no `.env`.

## Conta AWS do produto

Antes de pedir uma conta nova, veja se ela já existe (`aws configure list-profiles` e o `~/.aws/config`).

- **Nome da conta:** `<produto>-staging` e, quando houver produção, `<produto>-prod` (ex.: `ansora-staging`, `edusys-staging`).
- **E-mail do proprietário:** `comercial+<nome-da-conta>@novantir.com.br`. Não invente outro endereço nem sugira um e-mail pessoal.
- **Quem cria é o Rafael,** na conta de gestão (AWS Organizations → Add an AWS account). Depois ele dá ao usuário dele o `AdministratorAccess` na conta nova pelo **IAM Identity Center**, que fica na região **US East (N. Virginia)**: na tela do Organizations o seletor mostra "Global", e o link direto do Identity Center pode cair em outra tela; oriente pela busca do console.
- **Depois de criada:** peça só o número da conta (12 dígitos, não é segredo), acrescente o perfil `<nome-da-conta>` no `~/.aws/config` com a mesma sessão SSO dos outros perfis e a região do produto, e passe o `aws sso login --profile <nome-da-conta>` para ele rodar.
- Recurso pago na conta só depois de mostrar o custo, citando a fonte do preço, e ter o OK. O Cognito no plano Lite tem camada gratuita de 10.000 usuários ativos por mês (conferido em 11/11/2026).

## Cognito no staging

- User pool `<produto>-staging` em `sa-east-1`, plano Lite, login por e-mail, criação de usuário só por administrador, proteção contra exclusão.
- App client sem segredo, com `ALLOW_USER_PASSWORD_AUTH` e `ALLOW_REFRESH_TOKEN_AUTH`, revogação ligada, sem rotação do refresh token.
- O front fala com o endpoint do Cognito por `fetch`, sem SDK (modelo: `edusys/web/lib/auth/`). A API valida o **access token**: emissor, JWKS, `token_use=access` e `client_id`. O papel do usuário vem do banco, nunca do token.
- Contas de teste: crie com `admin-create-user` (`MessageAction=SUPPRESS`) e `admin-set-user-password --permanent`, e grave o `sub` do Cognito como id do usuário no banco.

## Lições do primeiro app migrado (EduSys, 11/11/2026)

- **Front estático:** `output: "export"` sem rewrites. Trocar o proxy do Next (`/backend/...`) por uma URL da API em `NEXT_PUBLIC_API_URL` e liberar a origem do site por CORS na API. URLs que a API devolve não podem trazer o prefixo antigo do proxy.
- **Migrations:** um serviço de execução única no compose quebra o deploy, porque o `70-ativar-release.sh` trata container parado como falha. Rode as migrations no entrypoint da API, antes de ela subir, e tire as credenciais de migração do ambiente do processo.
- **Papel do banco com senha:** crie-o num script em `/docker-entrypoint-initdb.d` lendo a senha do `.env`; ele só roda na criação do banco.
- **Pasta de arquivos:** `/srv/projetos/<app>/s3` nasce `root 700`. Monte-a direto no caminho que a API grava (ex.: `/data/materials`), para o entrypoint conseguir entregar o ponto de montagem ao usuário da imagem.
- **Ensaie antes do primeiro deploy:** mande o commit para uma pasta temporária no Vostro, rode `compose config`, `build` e `up` com um `.env` de mentira, confira saúde, CORS e cabeçalhos, e apague tudo.
- **DNS depois de criar as rotas:** o Mac guarda por até 30 minutos a resposta "não existe" de antes. Teste com `curl --resolve <host>:443:<ip-do-cloudflare>` ou de outro aparelho, e avise o Rafael.
- **Upload pelo túnel:** em 11/11/2026, 4 de 11 uploads grandes feitos do Mac caíram com erro de TLS no cliente, sem erro na API. Causa ainda não confirmada; teste uploads pelo navegador e de outra rede.
- **IA:** use a API da Anthropic pelo SDK oficial, com a chave só no backend (Keychain no Mac, `.env` no Vostro). Não use OpenRouter.

## Saindo de Supabase, Railway e Vercel

- Antes de apagar, guarde uma cópia do banco (`pg_dump` do schema do app) em `.local/` fora do Git.
- Peça o OK por card, item por item, dizendo o que some e que não tem volta. Apague só o projeto do app; organização, plano e projetos de outros produtos ficam.
- Supabase e Railway você apaga pela CLI. O Railway só **agenda** a exclusão (o projeto continua na lista por uns dias). A Vercel exige a confirmação no painel: entregue o link da seção Delete Project.
- Confira depois que os endereços antigos respondem 404 e registre no relatório do app.

## Linear

Todo produto tem um projeto no Linear, no time Novantir. É lá que o Rafael acompanha o que foi feito e o que falta.

- Crie o projeto se não existir (resumo, links do repositório e do staging).
- Uma issue para cada entrega, em "In Review" com o link do PR. O Linear liga a issue ao PR sozinho; quando o PR for mesclado, marque como "Done".
- Uma issue para cada pendência que sobrar (ex.: teste no navegador, backup, problema não resolvido), com o que fazer e o contexto. Atribua ao Rafael só o que é dele fazer.
- Os comentários automáticos do Linear e do CodeRabbit nos PRs são avisos, não revisões: não há o que corrigir neles.

## Regras que não mudam

- Nenhum `ports:` no compose. Front e API entram na rede `borda-<app>` com alias `<app>-<serviço>`. O banco fica só na rede interna.
- Staging com `noindex`. Nada de dados reais sensíveis no laboratório.
- Custo novo (conta, bucket, domínio, modelo de IA pago) só com o OK do Rafael e a estimativa antes.
- Push, PR e merge só com o OK dele.

## Ao terminar

Confira de fora: o front abre em `https://<app>-stg.novantir.com.br`, o login funciona e a API responde. Registre no repositório do app como o staging funciona (`deploy/lab/README.md` e um relatório em `docs/`), atualize o Linear e relate o que foi validado, o que ficou pendente e o que depende do Rafael.
