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
      const url = action.payload.url
      state[url] = {
        ...state[url],
        promise: action.payload.promise,
        loading: true
      }
    },
    fetchSuccess(state, action: PayloadAction<FetchSuccessAction>) {
      const url = action.payload.url
      state[url] = {
        ...state[url],
        loading: false,
        isSuccess: true,
        value: action.payload.value,
        promise: undefined
      }
    },
    fetchError(state, action: PayloadAction<FetchErrorAction>) {
      const url = action.payload.url
      state[url] = {
        ...state[url],
        loading: false,
        isError: true,
        error: action.payload.error
      }
    }
  }
})

export const { fetchError, fetchLoading, fetchSuccess } = fetchSlice.actions
export default fetchSlice.reducer
