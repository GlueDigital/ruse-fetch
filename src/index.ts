import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useAppSelector } from './redux/selector'
import { fetchData } from './redux/thunk'

export type FetchCallback<T> = (
  url?: string,
  options?: RequestInit,
  cacheKeyOrOpts?: CacheOptions | string
) => Promise<T>

export interface CacheOptions {
  key?: string
  keep?: boolean
}

export const useFetchCbTest = (url: string) => {
  const dispatch = useDispatch()

  const call = useCallback(() => {
    const promise = dispatch(fetchData(url))
    return promise
  }, [dispatch, url])

  return call
}

export const useFetchTest = (url: string) => {
  const cacheEntry = useAppSelector((s) => s.useFetch[url])
  const doFetch = useFetchCbTest(url)

  if (cacheEntry) {
    if (cacheEntry.isSuccess) {
      return cacheEntry.value
    } else if (cacheEntry.isError) {
      throw cacheEntry.error
    } else if (cacheEntry.loading) {
      throw cacheEntry.promise
    }
  }

  const fetchPromise = doFetch()

  throw fetchPromise
}

export { default as fetchReducer } from './redux/slice'
