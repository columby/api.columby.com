'use strict';

/**
 *
 * Main application file
 *
 */


/**
 *
 * Set default node environment to development
 *
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';


/**
 *
 * Dependencies
 *
 */
var express = require('express'),
    config = require('./config/config');


/**
 *
 * Setup server
 *
 */
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);


/**
 *
 * Setup models
 *
 */
var models = require('./models');


/**
 *
 * Setup routes
 *
 */
var routes = require('./routes')(app);


/**
 *
 * Start server
 *
 */
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
module.exports = app;
