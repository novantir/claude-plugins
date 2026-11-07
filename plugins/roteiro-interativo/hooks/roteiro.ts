/**
 * Núcleo do roteiro, sem nada do engine: validação do JSON, posição dos passos e o resumo
 * que o Claude lê. O painel e a ferramenta ficam em register.tsx.
 */
import type { Estado, Marco, Passo, Roteiro } from '../types'

export type PassoPos = Passo & { mi: number; pi: number; marco: Marco }

const CHAVES_ROTEIRO = ['id', 'titulo', 'subtitulo', 'ondeComando', 'fim', 'marcos']
const CHAVES_MARCO = ['id', 'nome', 'fim', 'passos']
const CHAVES_PASSO = ['id', 'titulo', 'corpo', 'ajustes', 'comando', 'onde', 'alerta', 'dica', 'entradas', 'gate',
  'mensagem']
const CHAVES_AJUSTE = ['caminho', 'opcao', 'valor']
const CHAVES_ENTRADA = ['id', 'rotulo', 'exemplo', 'opcional']
const ID_VALIDO = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Confere o roteiro contra o esquema (referencia/esquema.md). */
export function validar(r: unknown): { erros: string[]; avisos: string[] } {
  const erros: string[] = []
  const avisos: string[] = []
  const texto = (o: Obj, k: string, onde: string, obrigatorio = false) => {
    const v = o[k]
    if (v === undefined || v === null) {
      if (obrigatorio) erros.push(`${onde}: falta "${k}"`)
      return
    }
    if (typeof v !== 'string' || !v.trim()) erros.push(`${onde}: "${k}" deve ser um texto não vazio`)
  }
  const extras = (o: Obj, ok: string[], onde: string) => {
    for (const k of Object.keys(o)) if (!ok.includes(k)) avisos.push(`${onde}: chave desconhecida "${k}" (ignorada)`)
  }

  if (!isObj(r)) return { erros: ['o roteiro deve ser um objeto JSON'], avisos }
  extras(r, CHAVES_ROTEIRO, 'roteiro')
  texto(r, 'id', 'roteiro', true)
  if (typeof r.id === 'string' && !ID_VALIDO.test(r.id)) erros.push('roteiro: "id" só aceita letras, números, - e _')
  texto(r, 'titulo', 'roteiro', true)
  for (const k of ['subtitulo', 'ondeComando', 'fim']) texto(r, k, 'roteiro')
  if (!Array.isArray(r.marcos) || r.marcos.length === 0) {
    erros.push('roteiro: "marcos" deve ser uma lista com ao menos um marco')
    return { erros, avisos }
  }

  const idsMarco = new Set<unknown>()
  const idsPasso = new Set<unknown>()
  let total = 0
  r.marcos.forEach((m: unknown, i: number) => {
    let om = `marco ${i + 1}`
    if (!isObj(m)) return void erros.push(`${om}: deve ser um objeto`)
    extras(m, CHAVES_MARCO, om)
    texto(m, 'id', om, true)
    texto(m, 'nome', om, true)
    texto(m, 'fim', om)
    if (idsMarco.has(m.id)) erros.push(`${om}: id repetido "${String(m.id)}"`)
    idsMarco.add(m.id)
    if (typeof m.nome === 'string') om = `marco "${m.nome}"`
    if (!Array.isArray(m.passos) || m.passos.length === 0) {
      return void erros.push(`${om}: "passos" deve ser uma lista com ao menos um passo`)
    }
    m.passos.forEach((p: unknown, j: number) => {
      let op = `${om}, passo ${j + 1}`
      if (!isObj(p)) return void erros.push(`${op}: deve ser um objeto`)
      total++
      if (typeof p.id === 'string') op = `passo "${p.id}"`
      extras(p, CHAVES_PASSO, op)
      texto(p, 'id', op, true)
      if (typeof p.id === 'string' && !ID_VALIDO.test(p.id)) erros.push(`${op}: "id" só aceita letras, números, - e _`)
      if (idsPasso.has(p.id)) erros.push(`${op}: id repetido; cada passo precisa de um id único`)
      idsPasso.add(p.id)
      texto(p, 'titulo', op, true)
      for (const k of ['corpo', 'comando', 'onde', 'alerta', 'dica', 'mensagem']) texto(p, k, op)
      if (p.gate !== undefined && typeof p.gate !== 'boolean') erros.push(`${op}: "gate" deve ser true ou false`)
      if (p.onde && !p.comando) avisos.push(`${op}: "onde" só aparece junto de "comando"`)
      if (!['corpo', 'ajustes', 'comando', 'entradas', 'alerta'].some(k => p[k])) {
        avisos.push(`${op}: só tem título; diga o que fazer em "corpo"`)
      }
      if (p.ajustes !== undefined) {
        if (!Array.isArray(p.ajustes) || p.ajustes.length === 0) erros.push(`${op}: "ajustes" deve ser uma lista não vazia`)
        else p.ajustes.forEach((a: unknown, k: number) => {
          const oa = `${op}, ajuste ${k + 1}`
          if (!isObj(a)) return void erros.push(`${oa}: deve ser um objeto`)
          extras(a, CHAVES_AJUSTE, oa)
          texto(a, 'opcao', oa, true)
          texto(a, 'valor', oa, true)
          texto(a, 'caminho', oa)
        })
      }
      if (p.entradas !== undefined) {
        if (!Array.isArray(p.entradas) || p.entradas.length === 0) {
          erros.push(`${op}: "entradas" deve ser uma lista não vazia`)
        } else {
          const ids = new Set<unknown>()
          p.entradas.forEach((e: unknown, k: number) => {
            const oe = `${op}, entrada ${k + 1}`
            if (!isObj(e)) return void erros.push(`${oe}: deve ser um objeto`)
            extras(e, CHAVES_ENTRADA, oe)
            texto(e, 'id', oe, true)
            texto(e, 'rotulo', oe, true)
            texto(e, 'exemplo', oe)
            if (e.opcional !== undefined && typeof e.opcional !== 'boolean') erros.push(`${oe}: "opcional" deve ser true ou false`)
            if (ids.has(e.id)) erros.push(`${oe}: id repetido dentro do passo`)
            ids.add(e.id)
          })
        }
      }
    })
  })
  if (total > 60) avisos.push(`${total} passos: considere dividir em dois roteiros`)
  return { erros, avisos }
}

/**
 * Converte o HTML simples dos roteiros antigos (feitos para a página do Artifact) em Markdown.
 * Texto sem tags passa como está.
 */
export function paraMarkdown(s: string): string {
  if (!/<[a-z]/i.test(s)) return s
  return s
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/?p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '*')
    .replace(/<\/?(kbd|code)>/gi, '`')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim()
}

/** O roteiro com corpo e alerta em Markdown. */
export function normalizar(r: Roteiro): Roteiro {
  return {
    ...r,
    marcos: r.marcos.map(m => ({
      ...m,
      passos: m.passos.map(p => ({
        ...p,
        ...(p.corpo ? { corpo: paraMarkdown(p.corpo) } : {}),
        ...(p.alerta ? { alerta: paraMarkdown(p.alerta) } : {}),
      })),
    })),
  }
}

export function passosDe(r: Roteiro): PassoPos[] {
  const out: PassoPos[] = []
  r.marcos.forEach((m, mi) => m.passos.forEach((p, pi) => out.push({ ...p, mi, pi, marco: m })))
  return out
}

export const feito = (s: Estado, id: string) => s.progresso[id]?.status === 'ok'
export const liberado = (s: Estado, id: string) => !!s.liberacao[id]?.ok
export const marcoFeito = (s: Estado, m: Marco) => m.passos.every(p => feito(s, p.id))
export const marcoTravou = (s: Estado, m: Marco) => m.passos.some(p => s.progresso[p.id]?.status === 'travou')

/** O índice do primeiro portão ainda fechado: não se avança além dele. */
export function limite(s: Estado, passos: PassoPos[]): number {
  const i = passos.findIndex(p => p.gate && !feito(s, p.id) && !liberado(s, p.id))
  return i < 0 ? passos.length - 1 : i
}

const valoresTexto = (v?: Record<string, string>) =>
  v && Object.keys(v).length ? Object.entries(v).map(([k, x]) => `${k}=${x || '(vazio)'}`).join(', ') : ''

/** O estado completo, para a ação `estado` da ferramenta. */
export function resumo(s: Estado): string {
  const r = s.roteiro
  if (!r) return 'Nenhum roteiro aberto.'
  const passos = passosDe(r)
  const atual = passos[Math.min(s.idx, passos.length - 1)]
  const feitos = passos.filter(p => feito(s, p.id)).length
  const linhas = [
    `Roteiro "${r.titulo}" (id ${r.id})${s.arquivo ? `, de ${s.arquivo}` : ''}.`,
    `Feitos ${feitos} de ${passos.length}.`
      + (atual ? ` Na tela: ${s.tela === 'fim' ? `fim do marco "${atual.marco.nome}"` : `passo ${atual.id} "${atual.titulo}"`} (marco ${atual.mi + 1}, ${atual.marco.nome}).` : ''),
  ]
  for (const m of r.marcos) {
    linhas.push(`Marco "${m.nome}"${marcoFeito(s, m) ? ' (concluído)' : ''}:`)
    for (const p of m.passos) {
      const pr = s.progresso[p.id]
      const st = pr?.status ?? 'pendente'
      let l = `- ${p.id} "${p.titulo}"${p.gate ? ' [portão]' : ''}: ${st}`
      if (p.gate && liberado(s, p.id)) l += ' (liberado)'
      const v = valoresTexto(pr?.valores)
      if (v) l += `; valores: ${v}`
      if (pr?.nota) l += `; nota: ${pr.nota}`
      if (s.recado[p.id]) l += `; recado: ${s.recado[p.id]}`
      linhas.push(l)
    }
  }
  return linhas.join('\n')
}

/** Uma linha que vai junto de cada mensagem do Rafael enquanto um roteiro está aberto. */
export function contexto(s: Estado): string | undefined {
  const r = s.roteiro
  if (!r) return undefined
  const passos = passosDe(r)
  const atual = passos[Math.min(s.idx, passos.length - 1)]
  if (!atual) return undefined
  const feitos = passos.filter(p => feito(s, p.id)).length
  const travados = passos.filter(p => s.progresso[p.id]?.status === 'travou').map(p => p.id)
  const aguardando = passos.filter(p => s.progresso[p.id]?.status === 'aguardando' && !liberado(s, p.id)).map(p => p.id)
  let t = `[roteiro-interativo] Painel aberto: "${r.titulo}". Na tela: `
    + (s.tela === 'fim' ? `fim do marco "${atual.marco.nome}"` : `passo ${atual.id} "${atual.titulo}" (marco ${atual.mi + 1}, ${atual.marco.nome})`)
    + `. Feitos ${feitos}/${passos.length}.`
  if (travados.length) t += ` Travou em: ${travados.join(', ')}.`
  if (aguardando.length) t += ` Portão esperando o seu OK: ${aguardando.join(', ')}.`
  return t + ' Detalhes com a ferramenta roteiro, ação "estado".'
}

export const valoresTextoPublico = valoresTexto
