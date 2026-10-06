import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, setSessionExpiredHandler } from './http'

const res = (status: number) => new Response('{}', { status })

afterEach(() => {
  vi.unstubAllGlobals()
  setSessionExpiredHandler(null)
})

describe('apiFetch', () => {
  it('refreshes once on 401 and retries the original request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(401)) // original
      .mockResolvedValueOnce(res(200)) // /refresh
      .mockResolvedValueOnce(res(200)) // retry
    vi.stubGlobal('fetch', fetchMock)

    const out = await apiFetch('/api/events')

    expect(out.status).toBe(200)
    expect(fetchMock.mock.calls.map((c) => String(c[0]).split('/api')[1])).toEqual([
      '/events',
      '/auth/refresh',
      '/events',
    ])
  })

  it('shares one refresh between concurrent 401s', async () => {
    let refreshCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/refresh')) {
          refreshCalls++
          return res(200)
        }
        return refreshCalls === 0 ? res(401) : res(200)
      }),
    )

    await Promise.all([apiFetch('/api/a'), apiFetch('/api/b'), apiFetch('/api/c')])

    expect(refreshCalls).toBe(1)
  })

  it('expires the session when the refresh fails', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    vi.stubGlobal('fetch', vi.fn(async () => res(401)))

    const out = await apiFetch('/api/events')

    expect(out.status).toBe(401)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('does not refresh when noRefresh is set (bad credentials)', async () => {
    const fetchMock = vi.fn(async () => res(401))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/auth/login', { method: 'POST', body: '{}', noRefresh: true })

    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
