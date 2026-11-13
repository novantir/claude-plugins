# AGENTS.md — claude-plugins

O marketplace `novantir/claude-plugins`: os plugins e skills do Claude Code da Novantir (`secret-input-card`, `novo-projeto`, `staging-vostro`, `full-stop-send`, `revisao-pr`, `ronda`).

Este é o único arquivo de instruções do repositório. Vale junto com as regras globais do Rafael (`~/.claude/CLAUDE.md`); quando divergirem, este prevalece.

## 1. O que é

- **Cuida de:** as skills e plugins que o Rafael instala no Claude Code com `/plugin install <plugin> --marketplace novantir/claude-plugins`. Um plugin é uma pasta em `plugins/<plugin>/` com `.claude-plugin/plugin.json`, `README.md`, `LICENSE` e, conforme o caso, `skills/<skill>/SKILL.md`, `hooks/` e `tests/`. O [`marketplace.json`](.claude-plugin/marketplace.json) lista o que está publicado.
- **Plugins hoje:** `secret-input-card` (chave sem passar pelo chat; hooks em TSX, com testes e política de privacidade), `novo-projeto` (nasce um projeto na categoria certa, com o `AGENTS.md` do modelo em `skills/novo-projeto/templates/`), `staging-vostro` (skill `publicar-no-lab`, que segue o manual do `servidor-vostro`), `full-stop-send` (issue → PR pronto para merge, com parada ou merge conforme o repo permitir, e o fechamento da issue com case study), `revisao-pr` (revisão de PR com achados verificados), `ronda` (manutenção periódica em cinco modos: saúde, segurança, dependências, docs e código).
- **Vizinhos na `oficina/`:** `claude-config` (regras globais), `cockpit` (monitor), `flux-capacitor` (fábrica de apps), `servidor-vostro` (laboratório). Não duplicar o que já mora num deles; apontar. O conhecimento que vale para toda uma categoria de projeto mora nos modelos do `novo-projeto`, não nos projetos.

## 2. Stack

Markdown e JSON para skills e manifestos. O `secret-input-card` tem hooks em TypeScript/TSX (`hooks/register.tsx`) e testes `.test.tsx`; os tipos em `.claude-plugin/types/` são gerados pelo Claude Code ao carregar o plugin e ficam fora do git. Sem dependência externa além do próprio `claude`.

## 3. Como rodar e validar

Para cada plugin mexido, nesta ordem:

```bash
claude plugin validate plugins/<plugin>
claude plugin test plugins/<plugin>
```

Para testar uma skill de verdade, instale o plugin a partir da pasta local numa sessão e use a skill num repositório de ensaio; o `/plugin install` pelo marketplace só vê o que já foi enviado ao GitHub.

## 4. Convenções

- **Duas línguas, de propósito:** o README da raiz, os `plugin.json`, o `marketplace.json` e os READMEs dos plugins são em inglês, porque o marketplace é público. O conteúdo das skills (`SKILL.md`, modelos) é em português, porque fala com o Rafael e com os repositórios da Novantir; o `secret-input-card`, que serve a qualquer pessoa, é todo em inglês.
- Commits até aqui em inglês, no formato `<plugin>: descrição` (ver `git log`), e `tipo: descrição` para o que não é de um plugin só. Passar os commits ao português: a decidir.
- Mudou um plugin, sobe a `version` do `plugin.json` dele (o `secret-input-card` já está em 0.1.9 por isso) e a descrição dele no `marketplace.json` continua igual à do manifesto.
- Identificadores em inglês. Commits pequenos.
- Roda igual nas duas máquinas com Claude (MacBook Pro e Alienware).
- Toda mudança de regra num modelo do `novo-projeto` tem data e motivo na mensagem do commit.

## 5. Regras críticas

- Segredos nunca neste repositório, em teste, fixture ou log; `.env*` e `*.key` estão no `.gitignore`. O `secret-input-card` existe para o valor da chave nunca aparecer: qualquer mudança nele preserva isso (valor só na memória do plugin enquanto o cartão está aberto, mensagens de erro sem o valor).
- Só leitura dentro dos projetos em que as skills rodam, exceto o que a skill existe para criar (o `novo-projeto` cria a pasta nova; o `full-stop-send` cria branch, commits e PR do repo em que roda, e no fechamento escreve na issue, cria as issues de sobra e edita `docs/troubleshooting/` e as docs canônicas em `docs/`; a `ronda` grava o retrato em `.claude/ronda/`, edita o `README.md` e os índices no modo `docs` (o `AGENTS.md` só com o Rafael na sessão), faz uma limpeza pequena por área no modo `codigo` e mexe em manifestos no modo `deps` só com o Rafael na sessão, sempre no working tree e sem git).
- O que chega às outras máquinas e a quem instala o marketplace sai pelo push: **push só com o OK do Rafael.** Licença MIT em tudo; o `PRIVACY.md` do `secret-input-card` acompanha a listagem pública.

## 6. Fluxo de trabalho

- PR e parada antes do merge (**Full Stop**, plugin `full-stop-send`).

## 7. Lembretes

- O `staging-vostro` só serve numa máquina que tenha o repositório `servidor-vostro` e acesso SSH ao laboratório: a skill guarda o fluxo, o manual guarda os detalhes.
- Skill nova só quando nenhuma das que existem comporta o caso como passo ou modo: o `fechar-task` virou a seção 7 do `full-stop-send` e as cinco rotinas do Ansora viraram os modos da `ronda` (13/11/2026). O que é de um repositório só vai para a configuração dele em `docs/processo/`, não para uma skill no repositório.
- Ao preencher um `AGENTS.md` e perceber regra que faltava no modelo da categoria, a mudança é um PR aqui, em `plugins/novo-projeto/skills/novo-projeto/templates/`.
