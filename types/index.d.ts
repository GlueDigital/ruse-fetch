interface FetchMeta {
  status: number
  headers: object
  ts: number
}

export declare function useFetchCb(url: string, options?: object, cacheKey?: string): function

export declare function useFetch<T>(url: string, options?: object, cacheKey?: string): T

export declare function useFetchMeta(url: string, cacheKey?: string): FetchMeta

export declare function fetchKeyReducer(state: object, action: object): object

export declare function fetchReducer(state: object, action: object): object
