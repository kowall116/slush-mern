import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux'
import messages from './messages';
import auth from './auth';

export default combineReducers({
  messages,
  auth,
  routing: routerReducer
});
