import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FilterState } from '../components/FilterBar'

type FilterUpdater = FilterState | ((prev: FilterState) => FilterState)

function parse(params: URLSearchParams): FilterState {
  const types = params.get('types')
  const from = params.get('from')
  const to = params.get('to')
  return {
    search: params.get('q') ?? '',
    eventTypes: types ? types.split(',').filter(Boolean) : [],
    dateRange: {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    },
  }
}

function serialize(filter: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.search) params.set('q', filter.search)
  if (filter.eventTypes.length) params.set('types', filter.eventTypes.join(','))
  if (filter.dateRange.from) params.set('from', filter.dateRange.from.toISOString())
  if (filter.dateRange.to) params.set('to', filter.dateRange.to.toISOString())
  return params
}

/**
 * FilterState backed by the URL query string, so filters are shareable and
 * survive a refresh, and every route reads the same source of truth.
 */
export function useFilterParams(): [FilterState, (next: FilterUpdater) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const filter = useMemo(() => parse(searchParams), [searchParams])

  const setFilter = useCallback(
    (next: FilterUpdater) => {
      const resolved = typeof next === 'function' ? next(parse(searchParams)) : next
      setSearchParams(serialize(resolved), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return [filter, setFilter]
}
