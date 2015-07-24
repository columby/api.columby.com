/**
 * Express configuration
 */

'use strict';

var express = require('express');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var auth = require('http-auth');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./config');
var cors = require('cors');
var scribe = require('scribe-js')();
var console = process.console;

module.exports = function(app) {
  var env = app.get('env');

  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  app.use(cors());

  var basicAuth = auth.basic({ //basic auth config
      realm: "ScribeJS WebPanel",
      file: __dirname + '/scribe.htpasswd'
  });
  
  app.use(scribe.express.logger()); //Log each request
  app.use('/logs', auth.connect(basicAuth), scribe.webPanel());
  console.log('Logger started. ');


  if ('production' === env) {
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};
