import { Component } from 'react'

// Pages are lazy-loaded chunks. If one cannot be imported (a deploy replaced
// index.html before its assets were reachable, a stale cached index, or a host
// interruption), React would otherwise unmount the whole app and leave a blank
// page. A chunk failure is retried with one full reload (at most once a minute
// per page); anything else, or a second failure, shows a visible recovery
// message. Navigating to another path clears the error without remounting.

const RELOAD_KEY = 'jp-chunk-reload'
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i

export const isChunkLoadError = (error) => CHUNK_ERROR.test(String(error?.message || error || ''))

/** Reloads once per path per minute (never loops); returns false if it already tried. */
export function reloadOnceForChunkError() {
  try {
    const path = window.location.pathname
    const [lastPath, lastAt] = String(window.sessionStorage.getItem(RELOAD_KEY) || '').split('|')
    if (lastPath === path && Date.now() - Number(lastAt) < 60_000) return false
    window.sessionStorage.setItem(RELOAD_KEY, `${path}|${Date.now()}`)
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, reloading: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null, reloading: false })
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && reloadOnceForChunkError()) this.setState({ reloading: true })
  }

  render() {
    const { error, reloading } = this.state
    if (!error) return this.props.children
    if (reloading) return <div className="route-loading" role="status">Updating the site…</div>
    const chunk = isChunkLoadError(error)
    return (
      <div className="route-error" role="alert" style={{ maxWidth: 560, margin: '18vh auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 10 }}>This page could not be loaded.</h1>
        <p style={{ color: 'var(--c-gray, #777)', lineHeight: 1.6 }}>
          {chunk
            ? 'Part of the site did not download. This can happen right after the site is updated or on an unstable connection.'
            : 'Something went wrong while showing this page.'}
        </p>
        <p style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Reload page</button>
          <a className="btn btn--secondary" href="/">Go to the homepage</a>
        </p>
      </div>
    )
  }
}
