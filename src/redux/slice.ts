import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  CacheType,
  FetchErrorAction,
  FetchLoadingAction,
  FetchSuccessAction
} from '../types'

const initialCache: CacheType = {}

const fetchSlice = createSlice({
  name: 'useFetch',
  initialState: initialCache,
  reducers: {
    fetchLoading(state, action: PayloadAction<FetchLoadingAction>) {
      const { url, promise, key } = action.payload
      state[url] = {
        ...(state[url] || {}),
        status: 'loading',
        promise,
        keep: false,
        uses: 0,
        key,
        stale: false
      }
    },
    fetchSuccess<T extends object>(
      state: CacheType,
      action: PayloadAction<FetchSuccessAction<T>>
    ) {
      const { url, value, keep } = action.payload
      state[url] = {
        ...(state[url] || {}),
        status: 'success',
        value,
        keep
      }
    },
    fetchError(state, action: PayloadAction<FetchErrorAction>) {
      const { url, error } = action.payload
      state[url] = {
        ...(state[url] || {}),
        status: 'error',
        error
      }
    },
    fetchUse(state, action: PayloadAction<string>) {
      const url = action.payload
      state[url] = {
        ...(state[url] || {}),
        uses: state[url].uses + 1
      }
    },
    fetchUnuse(state, action: PayloadAction<string>) {
      const url = action.payload
      if (state[url].uses < 2 && !state[url].keep) {
        delete state[url]
      } else {
        state[url] = {
          ...(state[url] || {}),
          uses: state[url].uses - 1,
          stale: state[url].uses < 2
        }
      }
    },
    fetchCleanup(state) {
      const keys = Object.keys(state)
      for (const key of keys) {
        const entry = state[key]
        if (
          !entry ||
          ((entry.status === 'success' || entry.status === 'error') &&
            !entry.uses &&
            !entry.keep)
        ) {
          delete state[key]
        }
      }
    }
  }
})

export const {
  fetchError,
  fetchLoading,
  fetchSuccess,
  fetchCleanup,
  fetchUnuse,
  fetchUse
} = fetchSlice.actions
export default fetchSlice.reducer
