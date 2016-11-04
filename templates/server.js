import express from 'express'
import path from 'path'
import logger from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import dotenv from 'dotenv'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import request from 'request'
import sass from 'node-sass-middleware'
import webpack from 'webpack'
import config from './webpack.config'
import { createMemoryHistory, match, RouterContext } from 'react-router'
import serialize from 'serialize-javascript'
import * as fs from 'fs'

// Load environment variables from .env file
dotenv.load()

// ES6 Transpiler
import 'babel-core/register'
import 'babel-polyfill'

// Models
import User from './models/User'

import * as userController from './controllers/user'
import * as contactController from './controllers/contact'

// React and Server-Side Rendering
import routes from './app/routes'
import configureStore from './app/store/configureStore'

const app = express()

const compiler = webpack(config)

mongoose.connect(process.env.MONGODB)
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
  process.exit(1)
})
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))
app.set('port', process.env.PORT || 3000)
app.use(compression())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressValidator())
app.use(cookieParser())
app.use('/img', express.static('public/images'))
app.use('/css', sass({
  root: path.join(__dirname),
  src: path.join('app', 'styles'), 
  dest: path.join('public'), 
  debug: true,
  force: true
}), express.static(path.join(__dirname, 'public')))

app.use(function(req, res, next) {
  req.isAuthenticated = function() {
    const token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.cookies.token
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET)
    } catch (err) {
      return false
    }
  }

  if (req.isAuthenticated()) {
    const payload = req.isAuthenticated()
    User.findById(payload.sub, function(err, user) {
      user.picture = user.picture || user.gravatar
      req.user = user
      next()
    })
  } else {
    next()
  }
})

if (app.get('env') === 'development') {
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }))
  app.use(require('webpack-hot-middleware')(compiler))
}

app.post('/contact', contactController.contactPost)
app.put('/account', userController.ensureAuthenticated, userController.accountPut)
app.delete('/account', userController.ensureAuthenticated, userController.accountDelete)
app.post('/signup', userController.signupPost)
app.post('/login', userController.loginPost)
app.post('/forgot', userController.forgotPost)
app.post('/reset/:token', userController.resetPost)
app.get('/unlink/:provider', userController.ensureAuthenticated, userController.unlink)
app.post('/auth/facebook', userController.authFacebook)
app.get('/auth/facebook/callback', userController.authFacebookCallback)
app.post('/auth/google', userController.authGoogle)
app.get('/auth/google/callback', userController.authGoogleCallback)

// React server rendering
app.use(function(req, res) {
  const initialState = {
    auth: { token: req.cookies.token, user: req.user },
    messages: {}
  }
  const memoryHistory = createMemoryHistory(req.originalUrl)
  const store = configureStore(initialState, memoryHistory)
  match({ routes: routes(store, memoryHistory), location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message)
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      const content = renderToString(
        <Provider store={store}>
          <RouterContext {...renderProps}/>
        </Provider>
      )
      res.render('index', {
        content: content,
        store: serialize(store.getState())
      })
    } else {
      res.sendStatus(404)
    }
  })
})

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack)
    res.sendStatus(err.status || 500)
  })
}

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'))
})

export default app
