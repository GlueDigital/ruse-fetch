import slice from './redux/slice'

export interface CacheEntry {
  loading: boolean
  isError?: boolean
  isSuccess?: boolean
  value: unknown | undefined
  error?: Error
  promise: Promise<unknown> | undefined
}

export interface FetchLoadingAction {
  url: string
  promise: Promise<unknown>
}

export interface FetchSuccessAction {
  url: string
  value: unknown
}

export interface FetchErrorAction {
  url: string
  error: Error
}

export type CacheType = Record<string, CacheEntry>

const slices = {
  useFetch: slice
}

export type RootState = {
  [Key in keyof typeof slices]: ReturnType<(typeof slices)[Key]>
}
