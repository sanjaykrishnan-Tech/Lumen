import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Granularity } from '../utils/retention'

export interface RetentionConfig {
  bornEvent: string | null
  returnEvent: string | null
  granularity: Granularity
  from?: Date
  to?: Date
}

function parse(params: URLSearchParams): RetentionConfig {
  const from = params.get('from')
  const to = params.get('to')
  return {
    bornEvent: params.get('born') || null,
    returnEvent: params.get('ret') || null,
    granularity: params.get('gran') === 'week' ? 'week' : 'day',
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  }
}

function serialize(config: RetentionConfig): URLSearchParams {
  const params = new URLSearchParams()
  if (config.bornEvent) params.set('born', config.bornEvent)
  if (config.returnEvent) params.set('ret', config.returnEvent)
  if (config.granularity !== 'day') params.set('gran', config.granularity)
  if (config.from) params.set('from', config.from.toISOString())
  if (config.to) params.set('to', config.to.toISOString())
  return params
}

type Updater = RetentionConfig | ((prev: RetentionConfig) => RetentionConfig)

export function useRetentionConfig(): [RetentionConfig, (next: Updater) => void] {
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
