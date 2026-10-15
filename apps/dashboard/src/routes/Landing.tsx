import { Link } from 'react-router-dom'

const FEATURES = [
  {
    title: 'Live event feed',
    body: 'Events show up the second they happen. Pause, filter and search the stream. Export to CSV.',
  },
  {
    title: 'Funnels',
    body: 'Build an ordered list of steps and see exactly where people drop off.',
  },
  {
    title: 'Retention',
    body: 'A clear cohort grid shows how many users come back, week after week.',
  },
  {
    title: 'Charts and insights',
    body: 'Trends, breakdowns and top lists, plus an insights strip that points out what changed.',
  },
  {
    title: 'Many projects, one account',
    body: 'Each app gets its own write key and its own data. Rotate a key any time.',
  },
  {
    title: 'Shareable views',
    body: 'Every filter lives in the URL. Copy the link and your teammate sees the same view.',
  },
]

const STEPS = [
  { title: 'Install the SDK', body: 'One small package. About 4.5 KB.' },
  { title: 'Track an event', body: 'Call track() wherever something matters.' },
  { title: 'Watch it arrive', body: 'Open the dashboard. Your event is already there.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    note: 'For side projects and trying things out.',
    items: ['10,000 events / month', '1 project', '30 days of history', 'Live feed, funnels, retention', 'CSV export'],
    cta: 'Start for free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    note: 'For small teams that ship often.',
    items: ['100,000 events / month', '5 projects', '6 months of history', 'Live feed, funnels, retention', 'CSV export'],
    cta: 'Get started',
    highlight: true,
  },
]

const SNIPPET = `import { init, track } from '@lumen/sdk'

init({ apiUrl: 'https://api.lumen…', writeKey: 'lmn_…' })
track('signed_up', { plan: 'pro' })`

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="h-6 w-6 rounded bg-green-600" />
      <span className="text-lg font-semibold text-gray-900">Lumen</span>
    </Link>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="currentColor" aria-hidden>
      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z" />
    </svg>
  )
}

/** A small CSS mock of the dashboard, so the hero shows the product without an image. */
function ProductPreview() {
  const bars = [38, 52, 44, 66, 58, 80, 72, 94, 86, 100]
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xl shadow-green-900/5">
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="ml-3 flex items-center gap-1.5 text-xs text-gray-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Live
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          ['Events', '48,210'],
          ['Users', '3,942'],
          ['Conversion', '12.4%'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-100 p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex h-36 items-end gap-2 px-4 pb-4">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-yellow-400' : 'bg-green-500/80'}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="space-y-2 border-t border-gray-100 p-4 text-xs">
        {[
          ['purchase', '/checkout'],
          ['add_to_cart', '/pricing'],
          ['signup', '/home'],
        ].map(([type, page]) => (
          <div key={type} className="flex items-center justify-between">
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">{type}</span>
            <span className="text-gray-400">{page}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#how" className="hover:text-gray-900">How it works</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Sign in
            </Link>
            <Link to="/register" className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-linear-to-b from-green-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2">
            <div>
              <p className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                Product analytics, minus the bloat
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Analytics your whole team can understand in <span className="text-green-600">five minutes</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-gray-600">
                Track events with one line of code. Watch them arrive live. See funnels, retention and trends without
                writing SQL.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  Start for free
                </Link>
                <a
                  href="#how"
                  className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-sm text-gray-500">Free plan included. No credit card needed.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">The 10% of analytics that matters</h2>
            <p className="mt-3 text-gray-600">
              Big tools are slow to set up and hard to learn. Lumen does what small teams actually use, and does it well.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6 transition hover:border-green-300 hover:shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <Check />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-gray-50 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Up and running in 60 seconds</h2>
              <ol className="mt-8 space-y-6">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{s.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-gray-900 p-6 text-sm leading-relaxed text-green-100">
              <code>{SNIPPET}</code>
            </pre>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-gray-600">Use the hosted version, or run it yourself for free. Same code either way.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-8 ${
                  p.highlight ? 'border-green-600 shadow-lg shadow-green-900/5 ring-1 ring-green-600' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-4">
                  <span className="text-4xl font-bold">{p.price}</span>
                  {p.name === 'Pro' && <span className="text-gray-500"> / month</span>}
                </p>
                <p className="mt-2 text-sm text-gray-600">{p.note}</p>
                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-8 block rounded-md px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.highlight
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-4xl rounded-2xl bg-green-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">See your first event in minutes</h2>
            <p className="mx-auto mt-3 max-w-xl text-green-50">
              Create an account, add two lines of code and watch your product come to life.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-md bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
            >
              Start for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Lumen. Product analytics for small teams.</p>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-gray-800">Sign in</Link>
            <Link to="/register" className="hover:text-gray-800">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
