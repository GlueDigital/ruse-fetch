import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const FETCH_LOADING = 'useFetch/loading'
const FETCH_SUCCESS = 'useFetch/success'
const FETCH_ERROR = 'useFetch/error'
const FETCH_USE = 'useFetch/use'
const FETCH_UNUSE = 'useFetch/unuse'
const FETCH_CLEANUP = 'useFetch/cleanup'

export const useFetchCb = (url, options, cacheKey) => {
  const dispatch = useDispatch()
  const key = cacheKey || url

  return () => {
    // eslint-disable-next-line no-undef
    const fetchPromise = fetch(url, options)
      .then(res => {
        const resType = res.headers.get('Content-Type')
        const isJson = resType.startsWith('application/json')
        const meta = {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          ts: Date.now()
        }
        const valuePromise = isJson ? res.json() : res.text()
        return valuePromise
          .then(value => {
            if (res.ok) {
              dispatch({ type: FETCH_SUCCESS, key, value, meta })
              // setTimeout(() => dispatch({ type: FETCH_CLEANUP, key }), 1000)
            } else {
              const msg = 'Error ' + res.status
              const err = new Error(msg)
              err.status = res.status
              err.payload = value
              throw err
            }
          })
      })
    .catch(error => {
      dispatch({ type: FETCH_ERROR, key, error })
      // setTimeout(() => dispatch({ type: FETCH_CLEANUP, key }), 0)
      throw error
    })

    dispatch({ type: FETCH_LOADING, key, promise: fetchPromise })
    return fetchPromise
  }
}

export const useFetch = (url, options, cacheKey) => {
  const dispatch = useDispatch()
  const doFetch = useFetchCb(url, options, cacheKey)

  // Check this request status in the store
  const key = cacheKey || url
  const value = useSelector(s => s.useFetch[key])

  // Mark as used/unused on mount/unmount
  useEffect(() => {
    dispatch({ type: FETCH_USE, key })
    return () => {
      dispatch({ type: FETCH_UNUSE, key })
    }
  }, [key])

  if (!value) {
    // No value: start a new request
    const fetchPromise = doFetch()
      .then(v => {
        setTimeout(() => dispatch({ type: FETCH_CLEANUP, key }), 1000)
        return v
      })
      .catch(e => {
        setTimeout(() => dispatch({ type: FETCH_CLEANUP, key }), 1000)
        throw e
      })
    throw fetchPromise
  } else if (value.isLoading) {
    // Still loading: wait on the original fetch promise
    throw value.promise
  } else if (value.isError) {
    // Error: throw with the network error
    throw value.error
  } else {
    // Success: return the value
    return value.value
  }
}

export const useFetchMeta = (url, cacheKey) => {
  // Check this request status in the store
  const key = cacheKey || url
  const value = useSelector(s => s.useFetch[key])
  return value && value.meta
}

export const fetchKeyReducer = (state, action) => {
  state = state || {}
  switch (action.type) {
    case FETCH_LOADING:
      return { isLoading: true, promise: action.promise, uses: state.uses }
    case FETCH_SUCCESS:
      return { isSuccess: true, value: action.value, uses: state.uses, meta: action.meta }
    case FETCH_ERROR:
      return { isError: true, error: action.error, uses: state.uses }
    case FETCH_USE:
      return { ...state, uses: (state.uses || 0) + 1 }
    case FETCH_UNUSE:
      if (state.uses < 2) return null
      return { ...state, uses: state.uses - 1 }
    case FETCH_CLEANUP:
      if ((state.isSuccess || state.isError) && !state.uses) return null
      return state
  }
}

export const fetchReducer = (state = {}, action) => {
  switch (action.type) {
    case FETCH_LOADING:
    case FETCH_SUCCESS:
    case FETCH_ERROR:
    case FETCH_USE:
    case FETCH_UNUSE:
    case FETCH_CLEANUP:
      return {
        ...state,
        [action.key]: fetchKeyReducer(state[action.key], action)
      }
    default:
      return state
  }
}
