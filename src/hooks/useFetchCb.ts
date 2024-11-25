import { useDispatch } from 'react-redux'
import { CacheOptions } from '../types'
import { useCallback } from 'react'
import { fetchData } from '../redux/thunk'

export function useFetchCb<T extends object | string>(
  topUrl: string,
  topOptions?: RequestInit,
  topCacheOptions?: CacheOptions | string
): (
  cbUrl?: string,
  cbOptions?: RequestInit,
  cbCacheOptions?: CacheOptions | string
) => Promise<T>

export function useFetchCb<T extends object | string>(
  topUrl?: undefined,
  topOptions?: RequestInit,
  topCacheOptions?: CacheOptions | string
): (
  cbUrl: string,
  cbOptions?: RequestInit,
  cbCacheOptions?: CacheOptions | string
) => Promise<T>

export function useFetchCb<T extends object | string>(
  topUrl?: string,
  topOptions?: RequestInit,
  topCacheOptions?: CacheOptions | string
) {
  const dispatch = useDispatch()

  const call = useCallback(
    (
      cbUrl: string,
      cbOptions?: RequestInit,
      cbCacheOptions?: CacheOptions | string
    ): Promise<T | string> => {
      const url = cbUrl || topUrl

      if (!url) throw new Error('URL is mandatory')

      const options = cbOptions || topOptions
      const cacheKeyOrOpts = cbCacheOptions || topCacheOptions
      const cacheOpts: CacheOptions =
        typeof cacheKeyOrOpts === 'string'
          ? { key: cacheKeyOrOpts, keep: false }
          : cacheKeyOrOpts || { key: url, keep: false }

      const key = cacheOpts.key || url

      const promise = fetchData<T>(
        url as string,
        key as string,
        cacheOpts.keep || false,
        options
      )

      return promise(dispatch)
    },
    [dispatch, topUrl, topOptions, topCacheOptions]
  )

  return call
}
