import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface FunnelWindow {
  key: string
  label: string
  ms: number | null
}

export const FUNNEL_WINDOWS: FunnelWindow[] = [
  { key: 'any', label: 'Any time', ms: null },
  { key: '1h', label: 'Within 1 hour', ms: 60 * 60 * 1000 },
  { key: '24h', label: 'Within 1 day', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: 'Within 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '30d', label: 'Within 30 days', ms: 30 * 24 * 60 * 60 * 1000 },
]

export interface FunnelConfig {
  steps: string[]
  windowKey: string
  from?: Date
  to?: Date
}

export function windowMsFor(key: string): number | null {
  return FUNNEL_WINDOWS.find((w) => w.key === key)?.ms ?? null
}

function parse(params: URLSearchParams): FunnelConfig {
  const steps = params.get('steps')
  const from = params.get('from')
  const to = params.get('to')
  return {
    steps: steps ? steps.split(',') : ['', ''],
    windowKey: params.get('win') ?? 'any',
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  }
}

function serialize(config: FunnelConfig): URLSearchParams {
  const params = new URLSearchParams()
  if (config.steps.some(Boolean)) params.set('steps', config.steps.join(','))
  if (config.windowKey !== 'any') params.set('win', config.windowKey)
  if (config.from) params.set('from', config.from.toISOString())
  if (config.to) params.set('to', config.to.toISOString())
  return params
}

type Updater = FunnelConfig | ((prev: FunnelConfig) => FunnelConfig)

/** Funnel step/window/date config, backed by the URL so a funnel is shareable. */
export function useFunnelConfig(): [FunnelConfig, (next: Updater) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const config = useMemo(() => parse(searchParams), [searchParams])

  const setConfig = useCallback(
    (next: Updater) => {
      const resolved = typeof next === 'function' ? next(parse(searchParams)) : next
      setSearchParams(serialize(resolved), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return [config, setConfig]
}
