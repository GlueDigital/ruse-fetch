import slice from './redux/slice'

type Status = 'loading' | 'success' | 'error'

export interface FetchMeta {
  status: number
  headers: Record<string, string>
  ts: number
}

export interface CacheOptions {
  key?: string
  keep?: boolean
}

export interface CacheEntry<T extends object> {
  status: Status
  value: T | string
  promise: Promise<T> | null
  key: string
  uses: number
  keep: boolean
  stale: boolean
}

export interface CacheEntryWithError<T extends object> extends CacheEntry<T> {
  error: Error
  status: 'error'
}

export interface CacheEntryWithMeta<T extends object> extends CacheEntry<T> {
  meta: FetchMeta
}

export interface FetchLoadingAction {
  promise: Promise<unknown>
  key: string
}

export interface FetchSuccessAction<T extends object> {
  key: string
  value: T | string
  meta: FetchMeta
  keep: boolean
}

export interface FetchErrorAction {
  error: Error
  key: string
}

export type CacheType = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CacheEntry<any> | CacheEntryWithError<any> | CacheEntryWithMeta<any>
>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const slices = {
  useFetch: slice
}

export type RootState = {
  [Key in keyof typeof slices]: ReturnType<(typeof slices)[Key]>
}
