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

    // Wait for the final render
    await waitForElement(() => getByText('Alice Bob'))

    // There should be two fetch calls (with urls 1 and 2)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).nthCalledWith(1, urlA, undefined)
    expect(fetch).nthCalledWith(2, urlB, undefined)
  })

  test('falls back to error boundary if fetch not ok', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}) // Don't show the error

    const url = 'https://example.com/api/users/999'
    const Comp = () => <h1>{useFetch(url).name}</h1>

    const { getByText } = render(<Comp />)

    // The initial render should show the loading state
    expect(getByText('Loading')).not.toBeNull()

    // Wait for the final render, which should be an error
    await waitForElement(() => getByText('Error'))
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
})
