import { applyMiddleware, compose, createStore } from 'redux'
import { browserHistory } from 'react-router'
import thunk from 'redux-thunk'
import rootReducer from '../reducers'
import { routerMiddleware } from 'react-router-redux'
import { apiMiddleware } from 'redux-api-middleware'

export default function configureStore(initialState, history) {
  const userHistory = history || browserHistory
  const store = createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(
        thunk,
        routerMiddleware(userHistory),
        apiMiddleware
      ),
      typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
    )
  )
   
  if (module.hot) {
    // Enable hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
