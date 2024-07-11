import { useCallback, useEffect } from 'react'
import {  useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { fetchLoading, fetchSuccess, fetchError, fetchUse, fetchUnuse, fetchCleanup } from './redux/fetchReducer'

let cleanupTimer = null

export type FetchCallback<T> = (url?: string, options?: RequestInit, cacheKeyOrOpts?: CacheOptions | string) => Promise<T>

export interface CacheOptions {
  key?: string
  keep?: boolean
}

export const useFetchCb = <T> (hUrl?: string, hOptions?: RequestInit, hCacheKeyOrOpts?: CacheOptions | string): FetchCallback<T> => {
  const dispatch = useDispatch()

  return useCallback((cbUrl?: string, cbOptions?: RequestInit, cbCacheKeyOrOpts?: CacheOptions | string) => {
    const url = cbUrl || hUrl
    const options = cbOptions || hOptions
    const cacheKeyOrOpts = cbCacheKeyOrOpts || hCacheKeyOrOpts
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
              dispatch(fetchSuccess({ key, value, meta, keep: cacheOpts.keep }))
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
      dispatch(fetchError({key, error}))
      throw error
    })
    dispatch(fetchLoading({key, promise: fetchPromise}))
    return fetchPromise
  }, [dispatch, hUrl, hOptions, hCacheKeyOrOpts])
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
    dispatch(fetchUse(key))
    return () => {
      dispatch(fetchUnuse(key))
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
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), 3000)
      return v
    })
    .catch(e => {
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), 3000)
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
