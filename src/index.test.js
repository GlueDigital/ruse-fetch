import React from 'react'
import { waitForElement } from '@testing-library/react'
import { useFetch } from './index.js'
import { render, createStore } from './test-util.js'

describe('useFetch', () => {
  test('fetchs url, suspends, and finally returns value', async () => {
    const url = 'https://example.com/api/users/1'

    const DemoComponent = () => {
      const user = useFetch(url)
      return <h1>{user.name}</h1>
    }

    const { getByText } = render(<DemoComponent />)

    // The fetch call must have been performed right away
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toBeCalledWith(url, undefined)
    
    // The initial render should show the loading state
    expect(getByText('Loading')).not.toBeNull()

    // Wait for the final render
    await waitForElement(() => getByText('Alice'))
  })

  test('multiple useFetch for same URL combine into a single request', async () => {
    const urlA = 'https://example.com/api/users/1'
    const urlB = 'https://example.com/api/users/2'

    const CompA = () => <h1>{useFetch(urlA).name} {useFetch(urlB).name}</h1>
    const CompB = () => <h1>{useFetch(urlA).name}</h1>

    const { getByText } = render(<><CompA /><CompB /></>)
    await waitForElement(() => getByText('Alice Bob'))

    // There should be two fetch calls (with urls 1 and 2)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).nthCalledWith(1, urlA, undefined)
    expect(fetch).nthCalledWith(2, urlB, undefined)
  })

  test('cache key is used when provided', async () => {
    const url = 'https://example.com/api/users/1'
    const opts = { method: 'POST' }

    const CompA = () => {
      const data = useFetch(url, undefined, 'demo-key-1')
      return <h1>{data.name}</h1>
    }
    const CompB = () => {
      const data = useFetch(url, undefined, 'demo-key-1')
      return <h1>{data.name}</h1>
    }
    const CompC = () => {
      const data = useFetch(url, opts, 'demo-key-2')
      return <h1>{data.name}</h1>
    }

    const { getAllByText } = render(<><CompA /><CompB /><CompC /></>)
    await waitForElement(() => getAllByText('Alice'))

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
    const Comp = () => <h1>{useFetch(url).title}</h1>

    const { getByText, error } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await waitForElement(() => getByText('Error 403'))

    expect(error.current.status).toEqual(403)
    expect(error.current.payload.role).toEqual('user')
  })

  test('works with non-json responses', async () => {
    const url = 'https://example.com/text'
    const Comp = () => <h1>{useFetch(url)}</h1>

    const { getByText } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await waitForElement(() => getByText('Hello, world!'))
  })

  test('works with non-json responses on errors', async () => {
    const url = 'https://example.com/not-found'
    const Comp = () => <h1>{useFetch(url)}</h1>

    const { getByText, error } = render(<Comp />)
    expect(getByText('Loading')).not.toBeNull()
    await waitForElement(() => getByText('Error 404'))

    expect(error.current.status).toEqual(404)
    expect(error.current.payload).toEqual('Not Found')
  })

  test('cleans up cache when no longer in use', async () => {
    const url = 'https://example.com/api/users/1'
    const Comp = () => <h1>{useFetch(url).name}</h1>

    const { getByText, store, unmount } = render(<Comp />)

    // Wait for the final render
    await waitForElement(() => getByText('Alice'))
    expect(JSON.stringify(store.getState())).toMatch('Alice')

    // Unmount the component and check again
    unmount()
    expect(JSON.stringify(store.getState())).not.toMatch('Alice')
  })

  test('cache does not leak when unmounted before resolving', async () => {
    const url = 'https://example.com/api/users/1/slow'
    const Comp = () => <h1>{useFetch(url)}</h1>

    const { getByText, store, unmount } = render(<Comp />)

    // Don't let the component resolve; unmount it while loading
    await waitForElement(() => getByText('Loading'))
    unmount()

    // Now wait until fetch resolved; data should not make it to the store
    await new Promise(resolve => setTimeout(resolve, 1200))
    expect(JSON.stringify(store.getState())).not.toMatch('ok')
  })
})
