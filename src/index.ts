import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from './redux/selector'
import { fetchData } from './redux/thunk'
import { fetchCleanup, fetchUnuse, fetchUse } from './redux/slice'

let cleanupTimer: ReturnType<typeof setTimeout>

export type FetchCallback<T> = (
  url?: string,
  options?: RequestInit,
  cacheKeyOrOpts?: CacheOptions | string
) => Promise<T>

export interface CacheOptions {
  key?: string
  keep?: boolean
}

export function useFetchCb<T extends object>(
  topUrl: string,
  topOptions?: RequestInit,
  topCacheOptions?: CacheOptions | string
) {
  const dispatch = useDispatch()

  const call = useCallback(
    (
      cbUrl: string,
      cbOptions?: RequestInit,
      cbCacheOptions?: CacheOptions | string
    ) => {
      const url = cbUrl || topUrl
      const options = cbOptions || topOptions
      const cacheKeyOrOpts = cbCacheOptions || topCacheOptions
      const cacheOpts: CacheOptions =
        typeof cacheKeyOrOpts === 'string'
          ? { key: cacheKeyOrOpts, keep: false }
          : cacheKeyOrOpts || { key: url, keep: false }

      const key = cacheOpts.key || url

      const promise = fetchData<T>(url, key, cacheOpts.keep || false, options)
      return promise(dispatch)
    },
    [dispatch, topUrl, topOptions, topCacheOptions]
  )

  return call
}

export function useFetch<T extends object>(
  url: string,
  options?: RequestInit,
  cacheOptions?: CacheOptions | string
) {
  const dispatch = useDispatch()

  const cacheOpts: CacheOptions =
    typeof cacheOptions === 'string'
      ? { key: cacheOptions, keep: false }
      : cacheOptions || { key: url, keep: false }

  const key = cacheOpts.key || url

  const doFetch = useFetchCb<T>(url, options, cacheOpts)

  const cacheEntry = useAppSelector((s) => s.useFetch[url])

  useEffect(() => {
    dispatch(fetchUse(key))
    return () => {
      dispatch(fetchUnuse(key))
    }
  }, [key, url, dispatch])

  if (cacheEntry) {
    if (cacheEntry.status === 'success' && !cacheEntry.stale) {
      return cacheEntry.value
    } else if (cacheEntry.status === 'error' && 'error' in cacheEntry) {
      throw cacheEntry.error
    } else if (cacheEntry.status === 'loading') {
      throw cacheEntry.promise
    }
  }

  if (cleanupTimer) clearTimeout(cleanupTimer)
  const fetchPromise = doFetch(url, options, cacheOpts)
    .then((v) => {
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), 30000)
      return v
    })
    .catch((e) => {
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), 30000)
      throw e
    })

  if (cacheEntry.status === 'success') return cacheEntry.value

  throw fetchPromise
}

export function useFetchMeta(url: string, cacheKey?: string) {
  // Check this request status in the store
  const key = cacheKey || url
  const cacheEntry = useAppSelector((s) => s.useFetch[key])

  if (!cacheEntry || !('meta' in cacheEntry)) {
    return undefined
  }

  return cacheEntry.meta
}

export { default as fetchReducer } from './redux/slice'
