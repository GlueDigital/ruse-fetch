import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { render as _render } from '@testing-library/react'
import { fetchReducer } from './index.js'
require('jest-fetch-mock').enableMocks()

// Demo error boundary
class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError () {
    return { hasError: true }
  }

  render () {
    return this.state.hasError ? 'Error' : this.props.children
  }
}

// Helper to render with mocked fetch, a store, and a suspense wrapper
export const render = (comp) => {
  const answer = data => Promise.resolve({
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }    
  })
  fetch.resetMocks()
  fetch.mockResponse(req => {
    if (req.url.endsWith('/1')) return answer({ id: 1, name: 'Alice' })
    if (req.url.endsWith('/2')) return answer({ id: 2, name: 'Bob' })
    return Promise.resolve({ body: '{}', status: 404 })
  })
  const store = createStore(combineReducers({ useFetch: fetchReducer }))
  return _render(
    <Provider store={store}>
      <ErrorBoundary>
        <Suspense fallback="Loading">
          {comp}
        </Suspense>
      </ErrorBoundary>
    </Provider>
  )
}
