import { combineReducers } from '@reduxjs/toolkit'
import useFetchReducer from './fetchReducer'

const rootReducer = combineReducers({
  useFetch: useFetchReducer,
})

export default rootReducer