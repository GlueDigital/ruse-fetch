import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { render as _render } from '@testing-library/react'
import { fetchReducer } from './index'
require('jest-fetch-mock').enableMocks()

declare var fetch: any // Contains extra mocks

// Demo error boundary
class ErrorBoundary extends React.Component {
  state: any
  props: any

  constructor (props) {
    super(props)
    this.state = { error: false }
  }

  static getDerivedStateFromError (e) {
    return { error: e }
  }

  render () {
    if (this.state.error) {
      this.props.onError(this.state.error) // Might be called multiple times
      return this.state.error.message
    }
    return this.props.children
  }
}

// Helper to render with mocked fetch, a store, and a suspense wrapper
export const render = (comp) => {
  const answer = (data, status?: number) => Promise.resolve({
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    status: status || 200
  })
  fetch.resetMocks()
  fetch.mockResponse(async req => {
    if (req.url.endsWith('/1')) return answer({ id: 1, name: 'Alice' })
    if (req.url.endsWith('/2')) return answer({ id: 2, name: 'Bob' })
    if (req.url.endsWith('/private')) return answer({ role: 'user' }, 403)
    if (req.url.endsWith('/text')) return 'Hello, world!'
    if (req.url.endsWith('/slow')) {
      return new Promise(resolve => setTimeout(() => resolve({ body: 'ok'}), 100))
    }
    if (req.url.endsWith('/slower')) {
      return new Promise(resolve => setTimeout(() => resolve({ body: 'ok'}), 1500))
    }
    return { body: 'Not Found', status: 404 }
  })
  const error = { current: null }
  const store = createStore(combineReducers({ useFetch: fetchReducer }))
  const ret = _render(
    <Provider store={store}>
      <ErrorBoundary onError={e => error.current = e}>
        <Suspense fallback="Loading">
          {comp}
        </Suspense>
      </ErrorBoundary>
    </Provider>
  )
  return { ...ret, store, error }
}

export interface User {
  id: number,
  name: string
}
