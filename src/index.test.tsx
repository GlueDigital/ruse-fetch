/**
 * @jest-environment jsdom
 */

import React, { useState } from 'react'
import { useFetch, useFetchCb, useFetchMeta } from './index'
import { render, User, ErrorBoundary } from './test-util'
/** We use FakeTimers because Jest's FakeTimers don't work properly with promises
 * (all fetch requests stay in loading) even when we advance the time.
 *
 * We use FakeTimers because cleanup requires 30 seconds to complete; consequently,
 * the tests would be too slow. */
import FakeTimers from '@sinonjs/fake-timers'

// Keep clock there to uninstall after each test
let clock

describe('useFetch', () => {
  afterEach(() => clock?.uninstall())
  test('fetchs url, suspends, and finally returns value', async () => {
    const url = 'https://example.com/api/users/1'

    const DemoComponent = () => {
      const user: User = useFetch<User>(url)
      return <h1>{user.name}</h1>
    }

    const { getByText, findByText } = render(<DemoComponent />)

    // The fetch call must have been performed right away
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toBeCalledWith(url, undefined)

    // The initial render should show the loading state
    expect(getByText('Loading')).not.toBeNull()

    // Wait for the final render
    await findByText('Alice')
  })

  test('multiple useFetch for same URL combine into a single request', async () => {
    const urlA = 'https://example.com/api/users/1'
    const urlB = 'https://example.com/api/users/2'

    const CompA = () => <h1>{useFetch<User>(urlA).name} {useFetch<User>(urlB).name}</h1>
    const CompB = () => <h1>{useFetch<User>(urlA).name}</h1>

    const { findByText } = render(<><CompA /><CompB /></>)
    await findByText('Alice Bob')

    // There should be two fetch calls (with urls 1 and 2)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).nthCalledWith(1, urlA, undefined)
    expect(fetch).nthCalledWith(2, urlB, undefined)
  })

  test('cache key is used when provided', async () => {
    const url = 'https://example.com/api/users/1'
    const opts = { method: 'POST' }

    const CompA = () => {
      const data: User = useFetch<User>(url, undefined, 'demo-key-1')
      return <h1>{data.name}</h1>
    }
    const CompB = () => {
      const data: User = useFetch<User>(url, undefined, 'demo-key-1')
      return <h1>{data.name}</h1>
    }
    const CompC = () => {
      const data: User = useFetch<User>(url, opts, 'demo-key-2')
      return <h1>{data.name}</h1>
    }

    const { findAllByText } = render(<><CompA /><CompB /><CompC /></>)
    await findAllByText('Alice')

    // There should be two fetch calls for the same url
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).nthCalledWith(1, url, undefined)
    expect(fetch).nthCalledWith(2, url, opts)
  })

  test('does nothing if url is falsy', async () => {
    const Comp = () => <h1>{useFetch(null) || 'OK'}</h1>
    const { getByText } = render(<Comp />)

    // Fetch must not be called
    expect(fetch).toHaveBeenCalledTimes(0)

    // The initial render should NOT be loading, but OK
    expect(getByText('OK')).not.toBeNull()
  })

  test('throws if fetch not ok, and specifies status and body in the error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}) // Don't show the error

    const url = 'https://example.com/api/private'
    const Comp = () => <h1>{useFetch<any>(url).title}</h1>

    const { getByText, findByText, error } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await findByText('Error 403')

    expect(error.current.status).toEqual(403)
    expect(error.current.payload.role).toEqual('user')
  })

  test('works with non-json responses', async () => {
    const url = 'https://example.com/text'
    const Comp = () => <h1>{useFetch(url)}</h1>

    const { getByText, findByText } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await findByText('Hello, world!')
  })

  test('works with non-json responses on errors', async () => {
    const url = 'https://example.com/not-found'
    const Comp = () => <h1>{useFetch(url)}</h1>

    const { getByText, findByText, error } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await findByText('Error 404')

    expect(error.current.status).toEqual(404)
    expect(error.current.payload).toEqual('Not Found')
  })

  test('cleans up cache when no longer in use', async () => {
    const url = 'https://example.com/api/users/1'
    const Comp = () => <h1>{useFetch<User>(url).name}</h1>

    const { findByText, store, unmount } = render(<Comp />)

    // Wait for the final render
    await findByText('Alice')
    expect(JSON.stringify(store.getState())).toMatch('Alice')

    // Unmount the component and check again
    unmount()
    expect(JSON.stringify(store.getState())).not.toMatch('Alice')
  })

  test('cache does not leak when unmounted before resolving', async () => {
    const url = 'https://example.com/api/users/1/slow'
    const Comp = () => <h1>{useFetch(url)}</h1>

    clock = FakeTimers.install()

    const { findByText, store, unmount } = render(<Comp />)

    // Don't let the component resolve; unmount it while loading
    await findByText('Loading')
    unmount()

    // Now wait until fetch resolved; data should be removed from the store
    await clock.tickAsync(32000)

    expect(JSON.stringify(store.getState())).not.toMatch('ok')
  })

  test('cache cleanup does not affect items still in use', async () => {
    const urlA = 'https://example.com/api/users/1'
    const urlB = 'https://example.com/api/users/2'
    const CompA = () => <h1>{useFetch<User>(urlA).name}</h1>
    const CompB = () => {
      const user = useFetch<User>(urlB)
      throw new Error("crash")
    }
    const Comp = () => (
      <>
        <CompA />
        <ErrorBoundary>
          <CompB />
        </ErrorBoundary>
      </>
    )

    clock = FakeTimers.install()

    const { findByText, getByText, store } = render(<Comp />)

    await clock.tickAsync(0)
    // Wait for CompA to be ready
    await findByText('Alice')
    let state = JSON.stringify(store.getState())
    expect(state).toMatch('Alice')
    expect(state).toMatch('Bob')

    // CompB crashed; wait for cleanup
    await clock.tickAsync(32000)
    state = JSON.stringify(store.getState())
    expect(getByText('crash')).not.toBeNull()
    expect(state).toMatch('Alice')
    expect(state).not.toMatch('Bob')
  })

  test('cache clean does not interfere with multiple slow fetchs from same component', async () => {
    const urlA = 'https://example.com/api/users/1/slower'
    const urlB = 'https://example.com/api/users/2/slower'
    const Comp = () => <h1>{useFetch(urlA)}{useFetch(urlB)}</h1>

    clock = FakeTimers.install()
    const { findByText, store } = render(<Comp />)

    // Advance clock 3.5 seconds to wait slower fetch
    await clock.tickAsync(3500)
    await findByText('okok')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('if keep is enabled, it does not get removed on unmount but gets updated when used again', async () => {
    const url = 'https://example.com/api/users/1'
    const Comp = () => <h1>{useFetch<User>(url, undefined, { keep: true }).name}</h1>
    const Toggler = () => {
      const [show, setShow] = useState(true)
      return <>
        <button onClick={() => setShow(x => !x)}>Toggle</button>
        {show ? <Comp /> : 'Off'}
      </>
    }


    const { findByText, getByText, store } = render(<Toggler />)
    expect(fetch).toHaveBeenCalledTimes(1)

    // Wait for the final render
    await findByText('Alice')
    expect(JSON.stringify(store.getState())).toMatch('Alice')

    // Unmount the component and check store contents
    getByText('Toggle').click()
    await findByText('Off')
    expect(JSON.stringify(store.getState())).toMatch('Alice')
    expect(JSON.stringify(store.getState())).toMatch('stale')

    // Render it again
    getByText('Toggle').click()

    // The initial render should show the previous value
    expect(getByText('Alice')).not.toBeNull()

    // A new fetch call must have been performed right away
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('useFetchMeta', () => {
  test('returns request info about the corresponding fetch', async () => {
    const url = 'https://example.com/api/users/1'

    const DemoComponent = () => {
      const user: User = useFetch<User>(url)
      const meta = useFetchMeta(url)
      return (
        <>
          <div>{meta.status}</div>
          <div>{meta.headers['content-type']}</div>
        </>
      )
    }

    const { getByText, findByText } = render(<DemoComponent />)

    // The fetch call must have been performed right away
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toBeCalledWith(url, undefined)

    // The initial render should show the loading state
    expect(getByText('Loading')).not.toBeNull()

    // Wait for the final render
    await findByText('200')
    expect(getByText('application/json')).not.toBeNull()
  })

  describe('useFetchCb', () => {
    test('takes parameters either from cb call, or hook call, in that order', async () => {
      const urlA = 'https://example.com/api/users/1'
      const urlB = 'https://example.org/alt/foo/2'

      const DemoComponent = () => {
        const cb = useFetchCb(urlA)
        return (
          <>
            <button onClick={() => cb()}>Demo A</button>
            <button onClick={() => cb(urlB)}>Demo B</button>
          </>
        )
      }
      const { getByText, findByText } = render(<DemoComponent />)
      expect(fetch).toHaveBeenCalledTimes(0)

      getByText('Demo B').click()
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).nthCalledWith(1, urlB, undefined)

      getByText('Demo A').click()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).nthCalledWith(2, urlA, undefined)
    })
  })
})
