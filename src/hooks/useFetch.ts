import { useDispatch } from 'react-redux'
import { CacheOptions } from '../types'
import { useFetchCb } from './useFetchCb'
import { useAppSelector } from '../redux/selector'
import { fetchCleanup, fetchUnuse, fetchUse } from '../redux/slice'
import { useEffect } from 'react'

let cleanupTimer: ReturnType<typeof setTimeout>

const TIMEOUT = 30000

export function useFetch<T extends object | string>(
  // URL Puede ser nulo, usar '' ??
  url: string | null,
  options?: RequestInit,
  cacheOptions?: CacheOptions | string
): T {
  const dispatch = useDispatch()

  // CacheOpts puede no contener todas las propiedades
  const cacheOpts: CacheOptions =
    typeof cacheOptions === 'string'
      ? { key: cacheOptions, keep: false }
      : cacheOptions || { key: url || '', keep: false }

  const doFetch = useFetchCb<T>(url || '', options, cacheOpts)

  const key = cacheOpts.key || url || ''

  const cacheEntry = useAppSelector((s) => s.useFetch[key || ''])

  useEffect(() => {
    if (!url) return
    dispatch(fetchUse(key))
    return () => {
      dispatch(fetchUnuse(key))
    }
  }, [key, url, dispatch])

  if (!url) return null as unknown as T

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

  const fetchPromise = doFetch()
    .then((v) => {
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), TIMEOUT)
      return v
    })
    .catch((e) => {
      cleanupTimer = setTimeout(() => dispatch(fetchCleanup()), TIMEOUT)
      throw e
    })

  if (cacheEntry?.status === 'success') return cacheEntry.value

  throw fetchPromise
}
