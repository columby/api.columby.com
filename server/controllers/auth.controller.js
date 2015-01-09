'use strict';

/**
 *
 * Dependencies
 *
 * @type {exports}
 */
var config = require('../config/environment/index'),
    jwt    = require('jwt-simple'),
    moment = require('moment')
;



/**
 *
 * Generate JSON Web Token
 *
 */
exports.createToken = function(user) {
  console.log('jwt user', user.id);
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  console.log('payload', payload);
  return jwt.encode(payload, config.jwt.secret);
};


/**
 *
 * Check if a user's jwt token is present
 * And add the user id to req
 *
 */
exports.checkJWT = function(req,res,next){
  console.log('checking jwt');
  if (!req.user) { req.user={}; }

  // Decode the token if present
  if (req.headers.authorization){
    console.log('header', req.headers.authorization);
    var token = req.headers.authorization.split(' ')[1];
    console.log('token', token);
    var payload = jwt.decode(token, config.jwt.secret);
    console.log('payload', payload);
    // Check token expiration date
    if (payload.exp <= moment().unix()) {
      console.log('Token has expired');
    }
    // Attach user id to req
    if (!payload.sub) {
      console.log('No user found from token');
    }
    req.jwt = payload;
  }

  next();
};

/**
 *
 * Login Required Middleware
 *
 */
exports.ensureAuthenticated = function(req, res, next) {

  if (!req.user) { req.user={}; }

  // Check for authorization header
  if (!req.headers.authorization) {
    return res.send({status: 'error', message: 'Please make sure your request has an Authorization header'});
  }
  // Decode the token
  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.jwt.secret);
  // Check token expiration date
  if (payload.exp <= moment().unix()) {
    return res.send({status: 'error', message: 'Token has expired'});
  }

  // Attach user_id to req
  if (!payload.sub) {
    return res.send({status: 'error', message: 'No user found from token'});
  }
  req.jwt = payload;
  next();
};


/**
 *
 * Admin required middleware
 *
 * Validate if a user has admin rights
 */
exports.isAdmin = function(req,res,next) {
  User.find(id).success(function(user){
    if (user && (user.roles.indexOf('admin') !== -1)) {
      req.user = user;
      next();
    } else {
      res.status(401).json('Administers only.');
    }
  }).error(function(err){
    res.json(err);
  });
};
