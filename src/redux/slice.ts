import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import type {
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
      const { promise, key } = action.payload
      state[key] = {
        ...(state[key] || {}),
        status: 'loading',
        promise,
        keep: false,
        key,
        stale: false
      }
    },
    fetchSuccess<T extends object>(
      state: CacheType,
      action: PayloadAction<FetchSuccessAction<T>>
    ) {
      const { value, keep, key, meta } = action.payload
      state[key] = {
        ...(state[key] || {}),
        status: 'success',
        promise: null,
        value,
        meta,
        keep
      }
    },
    fetchError(state, action: PayloadAction<FetchErrorAction>) {
      const { key, error } = action.payload
      state[key] = {
        ...(state[key] || {}),
        promise: null,
        status: 'error',
        error
      }
    },
    fetchUse(state, action: PayloadAction<string>) {
      const key = action.payload
      state[key] = {
        ...(state[key] || {}),
        uses: (state[key]?.uses || 0) + 1
      }
    },
    fetchUnuse(state, action: PayloadAction<string>) {
      const key = action.payload
      if (state[key].uses < 2 && !state[key].keep) {
        delete state[key]
      } else {
        state[key] = {
          ...(state[key] || {}),
          uses: state[key].uses - 1,
          stale: state[key].uses < 2
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
