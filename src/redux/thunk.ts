import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit'
import { createError, CustomError } from './error'
import { fetchError, fetchLoading, fetchSuccess } from './slice'
import { RootState } from '../types'

type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>

export const fetchData =
  (url: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const existingRequest = getState().useFetch[url]
    if (existingRequest?.loading) {
      return existingRequest.promise
    }

    const promise = (async () => {
      try {
        const response = await fetch(url)
        const resType = response.headers.get('Content-Type')
        const isJson = resType && resType.startsWith('application/json')
        const value = isJson ? await response.json() : await response.text()

        if (!response.ok) {
          const msg = `Error ${response.status}`
          const error = createError(msg, { status: response.status }, value)
          dispatch(fetchError({ url, error }))
          throw error
        }

        dispatch(fetchSuccess({ url, value }))
        return value
      } catch (error) {
        dispatch(fetchError({ url, error: error as CustomError<unknown> }))
        throw error
      }
    })()

    dispatch(fetchLoading({ url, promise }))
    return promise
  }
