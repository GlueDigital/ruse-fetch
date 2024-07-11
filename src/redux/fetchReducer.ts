import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FetchState {
  [key: string]: {
    isLoading?: boolean
    isSuccess?: boolean
    isError?: boolean
    value?: any
    error?: any
    promise?: Promise<any>
    meta?: {
      status: number
      headers: object
      ts: number
    }
    uses?: number
    keep?: boolean
    stale?: boolean
  }
}

const initialState: FetchState = {}

const useFetchSlice = createSlice({
  name: 'useFetch',
  initialState,
  reducers: {
    fetchLoading: (state, action: PayloadAction<{ key: string; promise: Promise<any> }>) => {
      const { key, promise } = action.payload
      state[key] = { ...state[key], isLoading: true, promise }
    },
    fetchSuccess: (state, action: PayloadAction<{ key: string; value: any; meta: any; keep?: boolean }>) => {
      const { key, value, meta, keep } = action.payload
      state[key] = { isSuccess: true, value, meta, keep, uses: state[key].uses, }
    },
    fetchError: (state, action: PayloadAction<{ key: string; error: any }>) => {
      const { key, error } = action.payload
      state[key] = { isError: true, error, uses: state[key].uses }
    },
    fetchUse: (state, action: PayloadAction<string>) => {
      const key = action.payload
      state[key] = { ...state[key], uses: (state[key]?.uses || 0) + 1 }
    },
    fetchUnuse: (state, action: PayloadAction<string>) => {
      const key = action.payload
      if (state[key]?.uses && state[key]?.uses < 2 && !state[key]?.keep) {
        delete state[key]
      } else {
        state[key] = { ...state[key], uses: (state[key]?.uses || 0) - 1, stale: (state[key]?.uses < 2) || false }
      }
    },
    fetchCleanup: (state) => {
      const newState = {}
      for (const key in state) {
        const v = state[key]
        if (v && ((!v.isSuccess && !v.isError) || v.uses || v.keep)) {
          newState[key] = v
        }
      }
      return newState
    }
  }
})

export const {
  fetchLoading,
  fetchSuccess,
  fetchError,
  fetchUse,
  fetchUnuse,
  fetchCleanup
} = useFetchSlice.actions

export default useFetchSlice.reducer