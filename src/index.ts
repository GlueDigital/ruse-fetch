import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const FETCH_LOADING = 'useFetch/loading'
const FETCH_SUCCESS = 'useFetch/success'
const FETCH_ERROR = 'useFetch/error'
const FETCH_USE = 'useFetch/use'
const FETCH_UNUSE = 'useFetch/unuse'
const FETCH_CLEANUP = 'useFetch/cleanup'

let cleanupTimer = null

export type FetchCallback<T> = (url?: string, options?: RequestInit, cacheKeyOrOpts?: CacheOptions | string) => Promise<T>

export interface CacheOptions {
  key?: string
  keep?: boolean
}

export const useFetchCb = <T> (url?: string, options?: RequestInit, cacheKeyOrOpts?: CacheOptions | string): FetchCallback<T> => {
  const dispatch = useDispatch()

  return (cbUrl?: string, cbOptions?: RequestInit, cbCacheKeyOrOpts?: CacheOptions | string) => {
    url = cbUrl || url
    options = cbOptions || options
    cacheKeyOrOpts = cbCacheKeyOrOpts || cacheKeyOrOpts
    const cacheOpts: CacheOptions = typeof cacheKeyOrOpts === 'string' ? { key: cacheKeyOrOpts } : cacheKeyOrOpts || {}

    const key = cacheOpts.key || url

    const fetchPromise = fetch(url, options)
      .then(res => {
        const resType = res.headers.get('Content-Type')
        const isJson = resType && resType.startsWith('application/json')
        const meta = {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          ts: Date.now()
        }
        const valuePromise = isJson ? res.json() : res.text()
        return valuePromise
          .then(value => {
            if (res.ok) {
              dispatch({ type: FETCH_SUCCESS, key, value, meta, keep: cacheOpts.keep })
              return value
            } else {
              const msg = 'Error ' + res.status
              const err: any = new Error(msg)
              err.status = res.status
              err.payload = value
              throw err
            }
          })
      })
    .catch(error => {
      dispatch({ type: FETCH_ERROR, key, error })
      throw error
    })

    dispatch({ type: FETCH_LOADING, key, promise: fetchPromise })
    return fetchPromise
  }
}

export const useFetch = <T> (url: string, options?: RequestInit, cacheKeyOrOpts?: CacheOptions | string): T => {
  const dispatch = useDispatch()
  const cacheOpts: CacheOptions = typeof cacheKeyOrOpts === 'string' ? { key: cacheKeyOrOpts } : cacheKeyOrOpts || {}
  const doFetch = useFetchCb(url, options, cacheOpts)

  // Check this request status in the store
  const key = cacheOpts.key || url
  const value = useSelector<any, any>(s => s.useFetch[key])

  // Mark as used/unused on mount/unmount
  useEffect(() => {
    if (!url) return
    dispatch({ type: FETCH_USE, key })
    return () => {
      dispatch({ type: FETCH_UNUSE, key })
    }
  }, [key, url])

  if (!url) {
    return null
  }

  if (value) {
    if (value.isSuccess) {
      if (!value.stale || value.isLoading) {
        return value.value
      }
    } else if (value.isError) {
      throw value.error
    } else if (value.isLoading) {
      throw value.promise
    }
  }

  // No value (or stale): start a new request
  if (cleanupTimer) clearTimeout(cleanupTimer)
  const fetchPromise = doFetch()
    .then(v => {
      cleanupTimer = setTimeout(() => dispatch({ type: FETCH_CLEANUP }), 1000)
      return v
    })
    .catch(e => {
      cleanupTimer = setTimeout(() => dispatch({ type: FETCH_CLEANUP }), 1000)
      throw e
    })

  // If we have a (stale) value, use it now, even though we started a new request
  if (value?.isSuccess) return value.value

  // Otherwise, throw the promise
  throw fetchPromise
}

export interface FetchMeta {
  status: number
  headers: object
  ts: number
}

export const useFetchMeta = (url: string, cacheKey?: string): FetchMeta => {
  // Check this request status in the store
  const key = cacheKey || url
  const value = useSelector<any, any>(s => s.useFetch[key])
  return value && value.meta
}

export const fetchKeyReducer = (unsafeState, action) => {
  const state = unsafeState || {}
  switch (action.type) {
    case FETCH_LOADING:
      return { ...state, isLoading: true, promise: action.promise }
    case FETCH_SUCCESS:
      return { isSuccess: true, value: action.value, uses: state.uses, meta: action.meta, keep: action.keep }
    case FETCH_ERROR:
      return { isError: true, error: action.error, uses: state.uses }
    case FETCH_USE:
      return { ...state, uses: (state.uses || 0) + 1 }
    case FETCH_UNUSE:
      if (state.uses < 2 && !state.keep) return null
      return { ...state, uses: state.uses - 1, stale: state.uses < 2 }
  }
}

export const fetchReducer = (state = {}, action) => {
  switch (action.type) {
    case FETCH_LOADING:
    case FETCH_SUCCESS:
    case FETCH_ERROR:
    case FETCH_USE:
    case FETCH_UNUSE:
      return {
        ...state,
        [action.key]: fetchKeyReducer(state[action.key], action)
      }
    case FETCH_CLEANUP:
      const ret = {}
      for (const key in state) {
        const v = state[key]
        if (v && ((!v.isSuccess && !v.isError) || v.uses || v.keep)) {
          ret[key] = v
        }
      }
      return ret
    default:
      return state
  }
}
