# ruse-fetch

A simple React hook to use fetch with Suspense and Redux. Ideal for universal apps.

## Getting started

Install it with:

> npm install ruse-fetch

To make it work, you need to add our reducer to your Redux store:

```js
import { createStore, combineReducers } from 'redux'
import { fetchReducer } from 'ruse-fetch'

const reducers = {
  /* your other reducers... */
  useFetch: fetchReducer
}
const store = createStore(combineReducers(reducers))
```

Finally, to use it, just do:

```js
import { useFetch } from 'ruse-fetch'

const MyComponent = ({ id }) => {
  const data = useFetch(`https://jsonplaceholder.typicode.com/users/${id}`)
  return <div>{data.name}</div>
}
```

The parameters are the same as for fetch, so if you need to set any options, just pass them along:

```js
const data = useFetch(url, {
  method: 'POST',
  headers: { Authorization: myAuth }
})
```

### Handling loading and errors

Instead of creating our own solution for these cases, we use the already available tools in react.
Just use `<Suspense>` for the loading status, and error boundaries for errors:

```js
const MyComponentWrapper = ({ id }) =>
  <ErrorBoundary fallback="Not Found">
    <Suspense fallback="Loading...">
      <MyComponent id={id} />
    </Suspense>
  </ErrorBoundary>
```

### Server-side rendering

This library is compatible with server side rendering but, unfortunately, React doesn't support suspense on the server yet.
While it doesn't get released, you can use [react-async-ssr](https://www.npmjs.com/package/react-async-ssr) to bridge the gap.

If you're already sending your Redux store from server to client, things will just work. The server will wait for all fetch requests before sending its response, and the client won't repeat any fetch during hydration, but will make any new fetch it requires later.

### Cache

If multiple components use the same URL, only a single request will be made.
This caching is based only on the URL. If you need to override this, you can pass an alternative cache key as the third parameter, and any components sharing the key will make a single request.
