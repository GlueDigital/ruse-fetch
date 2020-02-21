import { useDispatch, useSelector } from 'react-redux'

const FETCH_LOADING = 'useFetch/loading'
const FETCH_SUCCESS = 'useFetch/success'
const FETCH_ERROR = 'useFetch/error'

export const useFetch = (url, options, cacheKey) => {
  const dispatch = useDispatch()
  const key = cacheKey || url
  const value = useSelector(s => s.useFetch[key])
  if (!value) {
    // eslint-disable-next-line no-undef
    const fetchPromise = fetch(url, options)
      .then(res => {
        const resType = res.headers.get('Content-Type')
        const isJson = resType.startsWith('application/json')
        const valuePromise = isJson ? res.json() : res.text()
        return valuePromise
          .then(value => {
            if (res.ok) {
              dispatch({ type: FETCH_SUCCESS, key, value })
            } else {
              const msg = res.statusText || 'Error ' + res.status
              const err = new Error(msg)
              err.status = res.status
              err.payload = value
              throw err
            }
          })
      })
      .catch(error => {
        dispatch({ type: FETCH_ERROR, key, error })
        throw error
      })

    dispatch({ type: FETCH_LOADING, key, promise: fetchPromise })
    throw fetchPromise
  } else if (value.isLoading) {
    throw value.promise
  } else if (value.isError) {
    throw value.error
  } else if (value.isSuccess) {
    return value.value
  }
}

export const fetchReducer = (state = {}, action) => {
  switch (action.type) {
    case FETCH_LOADING:
      return {
        ...state,
        [action.key]: { isLoading: true, promise: action.promise }
      }
    case FETCH_SUCCESS:
      return {
        ...state,
        [action.key]: { isSuccess: true, value: action.value }
      }
    case FETCH_ERROR:
      return {
        ...state,
        [action.key]: { isError: true, error: action.error }
      }
    default:
      return state
  }
}

export default useFetch
