import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const TOOL = 'mcp__roteiro-interativo__roteiro'

const ROTEIRO = {
  id: 'teste',
  titulo: 'Teste do painel',
  ondeComando: 'no Terminal do Mac',
  marcos: [
    {
      id: 'm1', nome: 'Aquecimento', fim: 'Botões e campos funcionam.',
      passos: [
        { id: 'm1-a', titulo: 'Abra o Terminal', corpo: '<p>Aperte <kbd>⌘</kbd> <strong>Espaço</strong>.</p>',
          dica: 'Procure em Aplicativos.' },
        { id: 'm1-b', titulo: 'Veja a versão', comando: 'sw_vers -productVersion',
          entradas: [{ id: 'macos', rotulo: 'Versão do macOS', exemplo: '26.1' }] },
      ],
    },
    {
      id: 'm2', nome: 'Portão',
      passos: [
        { id: 'm2-ok', titulo: 'Peça o meu OK', gate: true, corpo: 'Peça o OK.', mensagem: 'Pode liberar?' },
        { id: 'm2-fim', titulo: 'Feche', corpo: 'Clique em **Deu certo**.' },
      ],
    },
  ],
}

const PANE = {
  plugin: 'roteiro-interativo',
  component: 'Pane',
  requestId: 'roteiro',
  props: { title: 'Teste', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

/** O que fica abaixo do plugin nos testes: o engine que desenha, abre painéis e recebe as mensagens. */
function engine(on: On) {
  const enviados: string[] = []
  const toasts: string[] = []
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', (_, e) => {
    toasts.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('prompt.submit', (_, e) => {
    enviados.push(e.text)
    return e as never
  })
  on('tool.call', () => ({ result: {} }))
  mock.store(on)
  return { enviados, toasts }
}

const texto = (r: unknown) => {
  const x = (r as { result?: unknown; deny?: string })
  return typeof x.result === 'string' ? x.result : JSON.stringify(r)
}

test('abre o roteiro e mostra o primeiro passo em cada superfície', async ($, on) => {
  engine(on)
  const aberto = await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  expect(texto(aberto)).toContain('2 marcos, 4 passos')
  for (const surface of ['desktop', 'terminal', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /^Abra o Terminal$/ }))?.text).toBe('Abra o Terminal')
    expect(Boolean(await ui.find({ type: 'Button', key: 'principal' }))).toBe(true)
    await ui.unmount()
  }
})

test('o JSON fora do esquema é recusado com os erros', async ($, on) => {
  engine(on)
  const ruim = await $.tool.call({ tool: TOOL, acao: 'abrir',
    roteiro: { id: 'x y', titulo: '', marcos: [{ id: 'a', nome: 'A', passos: [{ id: 'p', titulo: 'T', gate: 1 }, { id: 'p', titulo: 'U' }] }] } })
  const t = JSON.stringify(ruim)
  expect(t).toContain('deny')
  expect(t).toContain('id repetido')
  expect(t).toContain('gate')
})

test('deu certo avança, campo obrigatório segura, portão pede o OK e o Claude libera', async ($, on) => {
  const { enviados, toasts } = engine(on)
  await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  await ui.press({ key: 'principal' })
  expect((await ui.find({ type: 'Text', text: /^Veja a versão$/ }))?.text).toBe('Veja a versão')

  // Sem o campo, não avança.
  await ui.press({ key: 'principal' })
  expect(toasts.join(' ')).toContain('Versão do macOS')
  expect(Boolean(await ui.find({ type: 'Text', text: /^Veja a versão$/ }))).toBe(true)

  await ui.input({ key: 'campo-m1-b-macos', text: '26.1', kind: 'change' })
  await ui.press({ key: 'principal' })
  // Fim do marco 1: tela de comemoração e aviso ao Claude.
  expect((await ui.find({ type: 'Text', text: /Marco 1 concluído/ }))?.text).toContain('Marco 1 concluído')
  expect(enviados.join('\n')).toContain('Marco 1 (Aquecimento) concluído')

  await ui.press({ key: 'seguir' })
  expect((await ui.find({ type: 'Text', text: /^Peça o meu OK$/ }))?.text).toBe('Peça o meu OK')
  await ui.press({ key: 'principal' })
  expect(enviados.join('\n')).toContain('Portão "Peça o meu OK" (m2-ok')
  expect(enviados.join('\n')).toContain('Pode liberar?')

  // Pedido feito: o portão segura até o Claude liberar.
  await ui.press({ key: 'principal' })
  expect(toasts.join(' ')).toContain('esperando o OK')
  const estado = texto(await $.tool.call({ tool: TOOL, acao: 'estado' }))
  expect(estado).toContain('m2-ok "Peça o meu OK" [portão]: aguardando')
  expect(estado).toContain('macos=26.1')

  const lib = await $.tool.call({ tool: TOOL, acao: 'liberar', passo: 'm2-ok', nota: 'conferido' })
  expect(texto(lib)).toContain('liberado')
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Claude liberou/ }))?.text).toContain('conferido')
  await ui.press({ key: 'principal' })
  expect((await ui.find({ type: 'Text', text: /^Feche$/ }))?.text).toBe('Feche')
  await ui.press({ key: 'principal' })
  expect((await ui.find({ type: 'Text', text: /Roteiro concluído/ }))?.text).toContain('Roteiro concluído')
  expect(enviados.join('\n')).toContain('Roteiro "Teste do painel" concluído')
  await ui.unmount()
})

test('travei abre o campo e avisa o Claude com a nota; recado aparece no cartão', async ($, on) => {
  const { enviados } = engine(on)
  await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'travei' })
  await ui.input({ key: 'nota-m1-a', text: 'o Spotlight não abre', kind: 'change' })
  await ui.press({ key: 'avisar' })
  expect(enviados.join('\n')).toContain('Travei no passo "Abra o Terminal" (m1-a')
  expect(enviados.join('\n')).toContain('o Spotlight não abre')

  await $.tool.call({ tool: TOOL, acao: 'recado', passo: 'm1-a', texto: 'Tente pelo Launchpad.' })
  expect((await ui.find({ type: 'Text', text: /Launchpad/ }))?.text).toBe('Tente pelo Launchpad.')
  await ui.unmount()
})

test('o portão não se pula pela trilha', async ($, on) => {
  engine(on)
  await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  await $.tool.call({ tool: TOOL, acao: 'ir', passo: 'm2-ok' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  // A trilha leva ao primeiro passo pendente do marco 2, que é o portão; dali, nada adianta.
  await ui.press({ key: 'marco-m2' })
  expect(Boolean(await ui.find({ type: 'Text', text: /^Peça o meu OK$/ }))).toBe(true)
  await ui.unmount()
})

test('cada mensagem do Rafael leva a posição no roteiro', async ($, on) => {
  engine(on)
  await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  const ida = await $.prompt.submit({ text: 'travei aqui' } as never)
  expect(JSON.stringify(ida)).toContain('Na tela: passo m1-a')
})

test('abrir de novo o mesmo roteiro retoma o progresso guardado', async ($, on) => {
  engine(on)
  await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'principal' })
  await ui.unmount()
  const de_novo = await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO })
  expect(texto(de_novo)).toContain('Retomei o progresso')
  const zerado = await $.tool.call({ tool: TOOL, acao: 'abrir', roteiro: ROTEIRO, recomecar: true })
  expect(texto(zerado)).not.toContain('Retomei')
})
