import React, { Component, ReactElement, ReactNode, Suspense } from 'react'
import { Provider } from 'react-redux'
import { render as _render } from '@testing-library/react'
import { fetchReducer } from './index'
import jestFetchMock from 'jest-fetch-mock'
import { configureStore } from '@reduxjs/toolkit'
jestFetchMock.enableMocks()

interface FetchMock {
  resetMocks: () => void
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  mockResponse: Function
}

declare const fetch: FetchMock

// Demo error boundary
export class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { error: Error | null }
> {
  constructor(props: {
    children: ReactNode
    onError?: (error: Error) => void
  }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      if (this.props.onError) {
        this.props.onError(this.state.error) // Might be called multiple times
      }
      return this.state.error.message
    }
    return this.props.children
  }
}

// Helper to render with mocked fetch, a store, and a suspense wrapper

export const render = (comp: ReactElement) => {
  const answer = (data: unknown, status?: number) =>
    Promise.resolve({
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      status: status || 200
    })
  fetch.resetMocks()
  fetch.mockResponse(async (req: Request) => {
    if (req.url.endsWith('/1')) return answer({ id: 1, name: 'Alice' })
    if (req.url.endsWith('/2')) return answer({ id: 2, name: 'Bob' })
    if (req.url.endsWith('/private')) return answer({ role: 'user' }, 403)
    if (req.url.endsWith('/text')) return 'Hello, world!'
    if (req.url.endsWith('/slow')) {
      return new Promise((resolve) =>
        setTimeout(() => resolve({ body: 'ok' }), 100)
      )
    }
    if (req.url.endsWith('/slower')) {
      return new Promise((resolve) =>
        setTimeout(() => resolve({ body: 'ok' }), 1500)
      )
    }
    return { body: 'Not Found', status: 404 }
  })
  const error: { current: Error | null } = { current: null }
  const store = configureStore({
    reducer: {
      useFetch: fetchReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      })
  })
  const ret = _render(
    <Provider store={store}>
      <ErrorBoundary onError={(e) => (error.current = e)}>
        <Suspense fallback="Loading">{comp}</Suspense>
      </ErrorBoundary>
    </Provider>
  )
  return { ...ret, store, error }
}

export interface User {
  id: number
  name: string
}
