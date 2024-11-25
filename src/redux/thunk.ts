import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit'
import { createError, CustomError } from './error'
import { fetchError, fetchLoading, fetchSuccess } from './slice'
import { FetchMeta, RootState } from '../types'

type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>

export const fetchData =
  <T extends object>(
    url: string,
    key: string,
    keep: boolean,
    options?: RequestInit
  ) =>
  async (dispatch: AppDispatch) => {
    const promise = (async () => {
      try {
        const response = await fetch(url, options)
        const resType = response.headers.get('Content-Type')
        const isJson = resType && resType.startsWith('application/json')
        const value = isJson
          ? ((await response.json()) as T)
          : ((await response.text()) as string)

        if (!response.ok) {
          const msg = `Error ${response.status}`
          const error = createError(msg, { status: response.status }, value)
          dispatch(fetchError({ url, error }))
          throw error
        }

        const meta: FetchMeta = {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          ts: Date.now()
        }

        dispatch(fetchSuccess({ url, value, meta, keep }))
        return value
      } catch (error) {
        dispatch(fetchError({ url, error: error as CustomError<unknown> }))
        throw error
      }
    })()

    dispatch(fetchLoading({ url, promise, key }))
    return promise
  }
