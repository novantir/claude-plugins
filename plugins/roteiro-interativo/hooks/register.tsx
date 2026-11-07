import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Andamento, Estado, Progresso, Roteiro } from '../types'
import {
  contexto, feito, limite, liberado, marcoFeito, marcoTravou, normalizar, passosDe, resumo, validar,
  valoresTextoPublico,
} from './roteiro'
import type { PassoPos } from './roteiro'

/**
 * roteiro-interativo: um passo a passo manual num painel ao lado do chat, um passo por vez.
 *
 * O Claude abre um roteiro (JSON) com a ferramenta `roteiro`; o painel mostra um cartão por
 * passo, com "Deu certo" e "Travei", marcos, campos e portões que só o Claude libera. "Travei",
 * o pedido de OK num portão e o fim de cada marco chegam ao Claude como mensagem na sessão.
 * Enquanto um roteiro está aberto, cada mensagem do Rafael leva junto uma linha com a posição.
 * O progresso fica no $.state (sobrevive a recargas) e no $.store (retoma em outra sessão).
 */

const PANE = 'roteiro'
const VAZIO: Estado = { roteiro: null, progresso: {}, liberacao: {}, recado: {}, idx: 0, tela: 'passo', travando: null }
const estado = atom({ plugin: 'roteiro-interativo', key: 'estado' } as const, VAZIO, { shape: 'estado-1' })

/** O que se digita nos campos, até apertar o botão. Some numa recarga, o que não faz falta. */
const rascunho = new Map<string, string>()
let ferramenta = 'mcp__roteiro-interativo__roteiro'

const agora = () => new Date().toISOString()
const chaveStore = (id: string) => `andamento:${id}`

function andamento(s: Estado): Andamento {
  return { progresso: s.progresso, liberacao: s.liberacao, recado: s.recado, idx: s.idx, tela: s.tela }
}

async function guardar($: EngineInterface, s: Estado) {
  if (s.roteiro) await $.store.set(chaveStore(s.roteiro.id), andamento(s))
}

/** Muda o estado e guarda o andamento; devolve o estado novo. */
async function mudar($: EngineInterface, fn: (s: Estado) => Estado): Promise<Estado> {
  let novo: Estado = VAZIO
  await update($, estado, s => (novo = fn(s)))
  await guardar($, novo)
  return novo
}

function avisar($: EngineInterface, texto: string) {
  void $.prompt.submit({ text: `[roteiro] ${texto}` })
}

const onde = (p: PassoPos) => `marco ${p.mi + 1}, ${p.marco.nome}`

// ---------------------------------------------------------------------------- ações do painel

function valoresDoPasso(s: Estado, p: PassoPos): Record<string, string> {
  const salvo = s.progresso[p.id]?.valores ?? {}
  return Object.fromEntries((p.entradas ?? []).map(x => [x.id, (rascunho.get(`${p.id}:${x.id}`) ?? salvo[x.id] ?? '').trim()]))
}

async function irPara($: EngineInterface, i: number) {
  await mudar($, s => {
    if (!s.roteiro) return s
    const passos = passosDe(s.roteiro)
    let alvo = i
    if (alvo > s.idx) alvo = Math.min(alvo, Math.max(limite(s, passos), s.idx))
    alvo = Math.max(0, Math.min(alvo, passos.length - 1))
    return { ...s, idx: alvo, tela: 'passo', travando: null }
  })
}

async function principal($: EngineInterface, id: string) {
  const s = await read($, estado)
  if (!s.roteiro) return
  const passos = passosDe(s.roteiro)
  const p = passos.find(x => x.id === id)
  if (!p) return
  const valores = valoresDoPasso(s, p)
  const faltam = (p.entradas ?? []).filter(x => !x.opcional && !valores[x.id])
  if (faltam.length) {
    $.ui.toast(`Preencha antes: ${faltam.map(x => x.rotulo).join(', ')}`)
    return
  }
  const comValores = p.entradas?.length ? { valores } : {}

  if (p.gate && !liberado(s, p.id)) {
    const atual = s.progresso[p.id]
    const mudouValores = JSON.stringify(atual?.valores ?? {}) !== JSON.stringify(comValores.valores ?? {})
    if (atual?.status === 'aguardando' && !mudouValores) {
      $.ui.toast('Ainda esperando o OK do Claude.')
      return
    }
    await mudar($, x => ({ ...x, progresso: { ...x.progresso, [p.id]: { status: 'aguardando', em: agora(), ...comValores } } }))
    const v = valoresTextoPublico(comValores.valores)
    avisar($, `Portão "${p.titulo}" (${p.id}, ${onde(p)}): pedindo o seu OK.`
      + (p.mensagem ? ` ${p.mensagem}` : '') + (v ? ` Valores: ${v}.` : '')
      + ` Confira e libere com a ferramenta roteiro (acao "liberar", passo "${p.id}"), ou deixe um recado.`)
    return
  }

  let fimDeMarco = false
  let fimDoRoteiro = false
  await mudar($, x => {
    const prog: Record<string, Progresso> = { ...x.progresso, [p.id]: { status: 'ok', em: agora(), ...comValores } }
    const y: Estado = { ...x, progresso: prog, travando: null }
    const ultimoDoMarco = p.pi === p.marco.passos.length - 1
    if (ultimoDoMarco && marcoFeito(y, p.marco)) {
      fimDeMarco = true
      fimDoRoteiro = p.mi === (x.roteiro?.marcos.length ?? 0) - 1
      return { ...y, tela: 'fim' }
    }
    const lim = Math.max(limite(y, passos), x.idx)
    return { ...y, idx: Math.min(x.idx + 1, lim, passos.length - 1), tela: 'passo' }
  })
  for (const x of p.entradas ?? []) rascunho.delete(`${p.id}:${x.id}`)
  if (fimDoRoteiro) avisar($, `Roteiro "${s.roteiro.titulo}" concluído: todos os ${passos.length} passos feitos.`)
  else if (fimDeMarco) avisar($, `Marco ${p.mi + 1} (${p.marco.nome}) concluído.${p.marco.fim ? ` ${p.marco.fim}` : ''}`)
}

async function enviarTravei($: EngineInterface, id: string) {
  const s = await read($, estado)
  if (!s.roteiro) return
  const p = passosDe(s.roteiro).find(x => x.id === id)
  if (!p) return
  const nota = (rascunho.get(`${p.id}:nota`) ?? '').trim()
  const valores = valoresDoPasso(s, p)
  await mudar($, x => ({
    ...x,
    travando: null,
    progresso: {
      ...x.progresso,
      [p.id]: { status: 'travou', em: agora(), ...(nota ? { nota } : {}), ...(p.entradas?.length ? { valores } : {}) },
    },
  }))
  rascunho.delete(`${p.id}:nota`)
  const v = valoresTextoPublico(p.entradas?.length ? valores : undefined)
  avisar($, `Travei no passo "${p.titulo}" (${p.id}, ${onde(p)}). `
    + (nota ? `O que aparece: ${nota}` : 'Sem descrição; pergunte o que aparece na tela.')
    + (v ? ` Valores: ${v}.` : '')
    + ' Ajude no chat e, se couber, deixe um recado no cartão (ferramenta roteiro, acao "recado").')
}

// ---------------------------------------------------------------------------- ferramenta

const DESCRICAO = 'Painel de passo a passo ao lado do chat, um passo por vez, para tarefas que a pessoa faz à mão '
  + '(BIOS, instalador, painel web, celular, hardware). Use a skill roteiro-interativo para montar o JSON. Ações: '
  + '"abrir" (arquivo: caminho de um JSON do roteiro, ou roteiro: o objeto; recomecar: true zera o progresso guardado), '
  + '"estado" (onde a pessoa está, valores dos campos, notas de "Travei"), '
  + '"liberar" (passo, nota?: abre um portão depois de conferir os valores), '
  + '"recado" (passo, texto: mostra um recado no cartão; texto vazio apaga), '
  + '"ir" (passo: leva a tela a um passo), "fechar" (fecha o painel; o progresso fica). '
  + 'Os avisos da pessoa chegam como mensagens "[roteiro] ...".'

type Entrada = {
  acao?: string; arquivo?: string; roteiro?: unknown; recomecar?: boolean; passo?: string; nota?: string; texto?: string
}

async function abrirPainel($: EngineInterface, titulo: string) {
  const aberto = await $.ui.open({ id: PANE, title: titulo })
  return aberto.isPlaced ? 'O painel está aberto ao lado do chat.'
    : `O painel foi pedido mas ainda não está à vista (${'reason' in aberto ? String(aberto.reason) : 'sem espaço'}); a pessoa pode abri-lo com /roteiro.`
}

async function atender($: EngineInterface, input: Entrada): Promise<{ result: string } | { deny: string }> {
  const acao = String(input.acao ?? '')
  if (acao === 'abrir') {
    let bruto: unknown = input.roteiro
    const arquivo = input.arquivo ? String(input.arquivo) : undefined
    if (arquivo) {
      try {
        bruto = JSON.parse(await $.fs.read(arquivo))
      } catch (err) {
        return { deny: `roteiro: não consegui ler ${arquivo} como JSON (${err instanceof Error ? err.message : String(err)})` }
      }
    }
    if (bruto === undefined) return { deny: 'roteiro: "abrir" precisa de "arquivo" ou "roteiro"' }
    const { erros, avisos } = validar(bruto)
    if (erros.length) return { deny: `roteiro: o JSON não segue o esquema:\n${erros.map(x => `ERRO: ${x}`).join('\n')}` }
    const r = normalizar(bruto as Roteiro)
    const guardado = input.recomecar ? undefined : (await $.store.get(chaveStore(r.id))) as Andamento | undefined
    const ids = new Set(passosDe(r).map(p => p.id))
    const filtra = <T,>(o: Record<string, T> | undefined) =>
      Object.fromEntries(Object.entries(o ?? {}).filter(([k]) => ids.has(k))) as Record<string, T>
    const total = ids.size
    const novo = await mudar($, () => ({
      roteiro: r,
      ...(arquivo ? { arquivo } : {}),
      progresso: filtra(guardado?.progresso),
      liberacao: filtra(guardado?.liberacao),
      recado: filtra(guardado?.recado),
      idx: Math.max(0, Math.min(guardado?.idx ?? 0, total - 1)),
      tela: guardado?.tela === 'fim' ? 'fim' : 'passo',
      travando: null,
    }))
    if (input.recomecar) rascunho.clear()
    const painel = await abrirPainel($, r.titulo)
    const retomado = Object.keys(novo.progresso).length ? ' Retomei o progresso guardado deste roteiro.' : ''
    return { result: `Roteiro "${r.titulo}" aberto: ${r.marcos.length} marcos, ${total} passos.${retomado} ${painel}`
      + (avisos.length ? `\nAvisos:\n${avisos.map(x => `aviso: ${x}`).join('\n')}` : '') }
  }

  const s = await read($, estado)
  if (acao === 'estado') return { result: resumo(s) }
  if (!s.roteiro) return { deny: 'roteiro: nenhum roteiro aberto; use a ação "abrir" primeiro' }
  const passos = passosDe(s.roteiro)
  const passo = String(input.passo ?? '')
  const p = passos.find(x => x.id === passo)

  if (acao === 'liberar') {
    if (!p) return { deny: `roteiro: não há passo "${passo}"` }
    if (!p.gate) return { deny: `roteiro: o passo "${passo}" não é um portão` }
    const nota = input.nota ? String(input.nota).slice(0, 300) : undefined
    await mudar($, x => ({ ...x, liberacao: { ...x.liberacao, [p.id]: { ok: true, em: agora(), ...(nota ? { nota } : {}) } } }))
    return { result: `Portão "${p.titulo}" liberado. O cartão mostra "Liberado: seguir".` }
  }
  if (acao === 'recado') {
    if (!p) return { deny: `roteiro: não há passo "${passo}"` }
    const texto = String(input.texto ?? '').trim().slice(0, 1000)
    await mudar($, x => {
      const recado = { ...x.recado }
      if (texto) recado[p.id] = texto
      else delete recado[p.id]
      return { ...x, recado }
    })
    return { result: texto ? `Recado posto no cartão "${p.titulo}".` : `Recado do cartão "${p.titulo}" apagado.` }
  }
  if (acao === 'ir') {
    if (!p) return { deny: `roteiro: não há passo "${passo}"` }
    await mudar($, x => ({ ...x, idx: passos.indexOf(p), tela: 'passo', travando: null }))
    return { result: `A tela está no passo "${p.titulo}".` }
  }
  if (acao === 'fechar') {
    await $.ui.close({ id: PANE })
    return { result: 'Painel fechado. O progresso fica guardado; "abrir" com o mesmo roteiro retoma.' }
  }
  return { deny: `roteiro: ação desconhecida "${acao}"` }
}

// ---------------------------------------------------------------------------- registro

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const { tool } = await $.tool.register({
      name: 'roteiro',
      description: DESCRICAO,
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          acao: { type: 'string', enum: ['abrir', 'estado', 'liberar', 'recado', 'ir', 'fechar'] },
          arquivo: { type: 'string', description: 'abrir: caminho absoluto do JSON do roteiro' },
          roteiro: { type: 'object', description: 'abrir: o roteiro em si, no lugar de "arquivo"' },
          recomecar: { type: 'boolean', description: 'abrir: true ignora o progresso guardado deste roteiro' },
          passo: { type: 'string', description: 'liberar, recado, ir: o id do passo' },
          nota: { type: 'string', description: 'liberar: uma frase que aparece como "Claude liberou: ..."' },
          texto: { type: 'string', description: 'recado: o texto do recado; vazio apaga' },
        },
        required: ['acao'],
      },
    })
    ferramenta = tool
    await $.command.register({ name: 'roteiro', description: 'Abre de novo o painel do roteiro interativo' })
    return started
  })

  on('command.run', { command: 'roteiro' }, async $ => {
    const s = await read($, estado)
    if (!s.roteiro) return { text: 'Nenhum roteiro aberto. Peça ao Claude um passo a passo.' }
    await $.ui.open({ id: PANE, title: s.roteiro.titulo })
    return { text: `Painel "${s.roteiro.titulo}" aberto.` }
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool !== ferramenta) return next(e)
    const input = ((e as { input?: Entrada }).input ?? (e as unknown as Entrada))
    return atender($, input)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `roteiro: falhou (${String(next.error)})` }))

  // Cada mensagem do Rafael leva junto onde ele está no roteiro.
  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const linha = contexto(await read($, estado))
    if (!linha) return next(e)
    return next({ ...e, context: [...(e.context ?? []), linha] })
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Button, Markdown, Code } = els
    const Input = 'Input' in els ? els.Input : undefined
    const s = await read($, estado)
    const r = s.roteiro
    if (!r) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold>Nenhum roteiro aberto</Text>
          <Text dimColor>Quando houver um passo a passo para fazer à mão, o Claude abre o roteiro aqui.</Text>
        </Box>
      )
    }
    const passos = passosDe(r)
    const p = passos[Math.min(s.idx, passos.length - 1)]
    if (!p) return <Text>Roteiro vazio.</Text>
    const feitos = passos.filter(x => feito(s, x.id)).length
    const largura = Math.max(8, Math.min(28, (e.props.bodyColumns ?? 40) - 12))
    const cheio = Math.round((largura * feitos) / passos.length)

    const topo = (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>{r.titulo}</Text>
          {r.subtitulo ? <Text dimColor>{r.subtitulo}</Text> : null}
        </Box>
        <Text color="success">{'█'.repeat(cheio)}<Text dimColor>{'░'.repeat(largura - cheio)}</Text> {feitos}/{passos.length}</Text>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {r.marcos.map((m, mi) => {
            const icone = marcoTravou(s, m) ? '!' : marcoFeito(s, m) ? '✓' : mi === p.mi ? '●' : '○'
            const n = m.passos.filter(x => feito(s, x.id)).length
            return (
              <Button key={`marco-${m.id}`} plain dimColor={mi !== p.mi}
                onPress={() => {
                  const pend = m.passos.findIndex(x => !feito(s, x.id))
                  void irPara($, passos.findIndex(x => x.mi === mi && x.pi === Math.max(pend, 0)))
                }}>
                {`${icone} ${m.nome} `}<Text dimColor>{`${n}/${m.passos.length}`}</Text>
              </Button>
            )
          })}
        </Box>
      </Box>
    )

    if (s.tela === 'fim') {
      const ultimo = p.mi === r.marcos.length - 1
      const prox = r.marcos[p.mi + 1]
      return (
        <Box flexDirection="column" gap={2}>
          {topo}
          <Box flexDirection="column" gap={1} borderStyle="round" borderColor="success" paddingX={2} paddingY={1}>
            <Text bold color="success">{ultimo ? '✓ Roteiro concluído' : `✓ Marco ${p.mi + 1} concluído`}</Text>
            {p.marco.fim ? <Text>{p.marco.fim}</Text> : null}
            {ultimo && r.fim ? <Text>{r.fim}</Text> : null}
            <Text dimColor>O Claude já sabe. Pode seguir quando quiser.</Text>
            <Box flexDirection="row">
              <Button key="seguir" variant="primary" autoFocus
                label={ultimo ? 'Rever os passos' : `Começar o marco ${p.mi + 2}: ${prox?.nome ?? ''}`}
                onPress={() => void irPara($, ultimo ? 0 : s.idx + 1)} />
            </Box>
          </Box>
        </Box>
      )
    }

    const prog = s.progresso[p.id]
    const lib = s.liberacao[p.id]
    const aguardando = prog?.status === 'aguardando' && !lib?.ok
    const rotulo = p.gate
      ? (lib?.ok ? 'Liberado: seguir →' : aguardando ? 'Reenviar ao Claude' : 'Pedir o OK do Claude')
      : (prog?.status === 'ok' ? 'Deu certo de novo →' : 'Deu certo ✓')
    const recado = s.recado[p.id]

    return (
      <Box flexDirection="column" gap={2}>
        {topo}
        <Box flexDirection="column" gap={1} borderStyle="round" paddingX={2} paddingY={1}>
          <Text dimColor>{`MARCO ${p.mi + 1} · ${p.marco.nome.toUpperCase()} · PASSO ${p.pi + 1} DE ${p.marco.passos.length}`}</Text>
          <Text bold>{p.titulo}</Text>

          {recado ? (
            <Box flexDirection="column" borderStyle="round" borderColor="claude" paddingX={1}>
              <Text color="claude" bold>RECADO DO CLAUDE</Text>
              <Text>{recado}</Text>
            </Box>
          ) : null}

          {p.ajustes?.length ? (
            <Box flexDirection="column" gap={1}>
              {p.ajustes.map(a => (
                <Box flexDirection="column">
                  {a.caminho ? <Text dimColor>{a.caminho}</Text> : null}
                  <Box flexDirection="row" justifyContent="space-between" gap={2}>
                    <Text>{a.opcao}</Text>
                    <Text bold color="success">{a.valor}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : null}

          {p.comando ? (
            <Box flexDirection="column">
              <Box flexDirection="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Text dimColor>{p.onde ?? r.ondeComando ?? 'no terminal'}</Text>
                <Button key="copiar" label="Copiar" variant="secondary"
                  onPress={press => void $.ui.copy({ text: p.comando ?? '', surface: press.surface })} />
              </Box>
              <Code source={p.comando} language="bash" />
            </Box>
          ) : null}

          {p.corpo ? <Markdown text={p.corpo} /> : null}

          {p.alerta ? (
            <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1}>
              <Markdown text={p.alerta} />
            </Box>
          ) : null}

          {p.entradas?.length && Input ? (
            <Box flexDirection="column" gap={1}>
              {p.entradas.map(x => (
                <Input key={`campo-${p.id}-${x.id}`} label={x.rotulo + (x.opcional ? ' (opcional)' : '')}
                  placeholder={x.exemplo ?? ''} submitLabel="ok"
                  value={rascunho.get(`${p.id}:${x.id}`) ?? prog?.valores?.[x.id] ?? ''}
                  onInput={(v: string) => void rascunho.set(`${p.id}:${x.id}`, v)}
                  onSubmit={(v: string) => void rascunho.set(`${p.id}:${x.id}`, v)} />
              ))}
            </Box>
          ) : p.entradas?.length ? <Text dimColor>Os campos deste passo só aparecem no computador.</Text> : null}

          {p.dica ? (
            <Box flexDirection="column">
              <Text dimColor>SE NÃO DEU CERTO</Text>
              <Text dimColor>{p.dica}</Text>
            </Box>
          ) : null}

          {p.gate ? (
            <Text color={lib?.ok ? 'success' : 'warning'}>
              {lib?.ok ? `● Claude liberou${lib.nota ? `: ${lib.nota}` : '.'}`
                : aguardando ? '● Pedido enviado. Espere o OK do Claude; esta tela libera sozinha.'
                  : '● Este passo só avança com o OK do Claude.'}
            </Text>
          ) : null}

          {s.travando === p.id && Input ? (
            <Box flexDirection="column" gap={1}>
              <Input key={`nota-${p.id}`} rows={3} autoFocus label="O que aparece na tela?"
                placeholder="a mensagem de erro, o que você vê" submitLabel="avisar"
                value={rascunho.get(`${p.id}:nota`) ?? prog?.nota ?? ''}
                onInput={(v: string) => void rascunho.set(`${p.id}:nota`, v)}
                onSubmit={(v: string) => { rascunho.set(`${p.id}:nota`, v); void enviarTravei($, p.id) }} />
              <Box flexDirection="row" gap={1}>
                <Button key="avisar" label="Avisar o Claude" variant="primary" onPress={() => void enviarTravei($, p.id)} />
                <Button key="cancelar-travei" label="Cancelar" variant="secondary"
                  onPress={() => void mudar($, x => ({ ...x, travando: null }))} />
              </Box>
            </Box>
          ) : null}

          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            <Button key="principal" label={rotulo} variant="primary" autoFocus onPress={() => void principal($, p.id)} />
            {s.idx > 0 ? <Button key="voltar" label="← Voltar" variant="secondary" onPress={() => void irPara($, s.idx - 1)} /> : null}
            {s.travando !== p.id ? (
              <Button key="travei" label="Travei" variant="secondary"
                onPress={() => (Input ? void mudar($, x => ({ ...x, travando: p.id })) : void enviarTravei($, p.id))} />
            ) : null}
          </Box>
        </Box>
        {prog?.status === 'travou' ? <Text color="warning">Você marcou "Travei" aqui. O Claude foi avisado.</Text> : null}
      </Box>
    )
  })
}
