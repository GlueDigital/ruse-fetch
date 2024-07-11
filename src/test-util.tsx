// src/utils/render.tsx
import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import { render as _render, RenderResult } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './redux/reducers'

require('jest-fetch-mock').enableMocks()

declare var fetch: any // Contains extra mocks

// Demo error boundary
export class ErrorBoundary extends React.Component {
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
      this.props.onError && this.props.onError(this.state.error) // Might be called multiple times
      return this.state.error.message
    }
    return this.props.children
  }
}


export const render = (comp: React.ReactElement): RenderResult & { store: typeof store, error: any } => {
  const answer = (data: any, status?: number) => Promise.resolve({
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



const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  }),
})

  const error = { current: null }
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
