import { useAppSelector } from '../redux/selector'

export function useFetchMeta(url: string, cacheKey?: string) {
  // Check this request status in the store
  const key = cacheKey || url
  const cacheEntry = useAppSelector((s) => s.useFetch[key])

  if (!cacheEntry || !('meta' in cacheEntry)) {
    return undefined
  }

  return cacheEntry.meta
}
