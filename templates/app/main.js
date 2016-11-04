import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { Router, browserHistory } from 'react-router';
import configureStore from './store/configureStore';
import getRoutes from './routes';

const store = configureStore(window.__initialState__);

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={getRoutes(store)}/>
  </Provider>,
  document.getElementById('root')
);
