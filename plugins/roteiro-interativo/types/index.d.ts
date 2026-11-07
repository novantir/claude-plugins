/**
 * Contrato de estado do plugin roteiro-interativo. Nada de senha ou chave aqui: o estado
 * sobrevive a recargas e o progresso também vai para o $.store (entre sessões).
 */
export type Ajuste = { caminho?: string; opcao: string; valor: string }
export type Entrada = { id: string; rotulo: string; exemplo?: string; opcional?: boolean }

export type Passo = {
  id: string
  titulo: string
  /** Markdown. */
  corpo?: string
  ajustes?: Ajuste[]
  comando?: string
  onde?: string
  /** Markdown. */
  alerta?: string
  dica?: string
  entradas?: Entrada[]
  gate?: boolean
  mensagem?: string
}

export type Marco = { id: string; nome: string; fim?: string; passos: Passo[] }

export type Roteiro = {
  id: string
  titulo: string
  subtitulo?: string
  ondeComando?: string
  fim?: string
  marcos: Marco[]
}

export type Progresso = {
  status: 'ok' | 'travou' | 'aguardando'
  em: string
  valores?: Record<string, string>
  nota?: string
}

export type Liberacao = { ok: true; nota?: string; em: string }

/** O que se guarda por roteiro, nesta sessão e no $.store. */
export type Andamento = {
  progresso: Record<string, Progresso>
  liberacao: Record<string, Liberacao>
  recado: Record<string, string>
  idx: number
  tela: 'passo' | 'fim'
}

export type Estado = Andamento & {
  roteiro: Roteiro | null
  arquivo?: string
  /** Passo com a caixa "Travei" aberta. */
  travando: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'roteiro-interativo': { estado: Shaped<Estado> }
  }
}
