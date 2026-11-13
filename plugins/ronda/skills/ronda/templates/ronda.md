# Ronda — {{Nome do projeto}}

O que a skill `ronda` (plugin do marketplace `novantir/claude-plugins`) precisa saber deste repositório. A skill guarda o fluxo de cada modo; aqui ficam só os dados daqui. Seção sem dado fica "não se aplica", e a skill pula aquele passo.

## Saúde

| URL | Esperado |
|---|---|
| `{{https://app.exemplo.com.br}}` | {{200}} |
| `{{https://api.exemplo.com.br/health}}` | {{200, corpo com "UP"}} |

- **Branch padrão e workflows a olhar:** {{main; ci.yml, e2e.yml}}
- **Serviço de erros:** {{Sentry, projetos `x-api` e `x-web`; token em `SENTRY_AUTH_TOKEN` · ou "não tem"}}
- **Runbook de queda:** {{docs/operacao/...}}

## Segurança

Os critérios ficam no `REVIEW.md` da raiz. Buscas extras deste repositório:

```bash
{{git grep -n -E 'findById\(' -- 'src/main'}}
```

- **Não é achado aqui:** {{decisões intencionais que parecem falha}}

## Dependências

| Camada | Atrasadas | CVEs | Prova depois de um bump |
|---|---|---|---|
| {{Frontend}} | `{{pnpm outdated}}` | `{{pnpm audit --json}}` | `{{pnpm lint && pnpm test && pnpm build}}` |
| {{Backend}} | `{{...}}` | {{OSV}} | `{{...}}` |

- **Fixadas sem faixa** (bump à mão, tratadas como major): {{lista}}
- **Modelos de IA:** {{arquivos com o modelo em uso e a tabela de preço · ou "não usa"}}
- **Issue permanente de manutenção:** {{ID · ou "não tem"}}

## Docs

- **Comando dos índices:** `{{python3 scripts/docs-index.py}}` {{ou "não tem"}}
- **Rastreador:** {{Linear, time X · ou "não tem"}}

## Código

| Área | Onde | Prova |
|---|---|---|
| {{Backend}} | `{{src/main}}` | `{{...}}` |
| {{Frontend}} | `{{web/}}` | `{{...}}` |

- **Áreas de risco** (nunca recebem limpeza): {{auth, cobrança, permissões, migrations, webhooks}}
- **Cuidados:** {{o que não pode rodar aqui, por exemplo subir a aplicação fora de teste}}
