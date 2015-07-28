'use strict';

/**
 *
 * Dependencies
 *
 * @type {exports}
 */
var config = require('../config/config'),
    jwt    = require('jwt-simple'),
    moment = require('moment'),
    models = require('../models/index'),
    request = require('request'),
    userCtrl = require('./user.controller'),
    tokenCtrl = require('./token.controller')
''


/**
 *
 * Check if a user's jwt token is present
 * Validate the token if present
 * And add the contents to req.
 *
 */
exports.validateJWT = function(req,res,next){
  console.log('Validating JWT.');

  req.jwt = req.jwt || {};
  // Decode the token if present
  if (req.headers.authorization){
    var token = req.headers.authorization.split(' ')[1];
    var payload = {
      exp:null,
      sub:null
    };
    try {
      payload = jwt.decode(token, config.jwt.secret);
    } catch (err){

    }
    // Check token expiration date
    if ( (payload.exp) && (payload.exp <= moment().unix()) ) {
      return res.json({status: 'error', message: 'Token has expired'});
    }
    req.jwt = payload;
  }

  next();
};

/**
 *
 * Validate the user from the JWT token
 *
 */
exports.validateUser = function(req,res,next) {

  req.user = req.user || {};

  // fetch user if not present and JWT is present
  if ( (!req.user.id) && (req.jwt.sub) ) {
    models.User.find({
      where: { id: req.jwt.sub },
      include: [ { model: models.Account, as: 'account' } ]
    }).then(function(user){

      // transform user
      var u = user.dataValues;
      u.organisations = [];
      for (var i=0; i<user.account.length; i++) {
        var a = user.account[ i].dataValues;
        a.role = a.UserAccounts.dataValues.role;
        delete a.UserAccounts;
        if (a.primary) {
          u.primary = a;
        } else {
          u.organisations.push(a);
        }
      }
      delete u.account;

      req.user = u;

      next();
    });
  } else {
    next();
  }
};

// Validate if a user is logged in
exports.ensureAuthenticated = function(req,res,next) {
  if (req.user && req.user.id){
    next();
  } else {
    return res.json({status: 'error', message: 'Not authenticated'});
  }
}


/**
 * Login using google provider
 **/
exports.google = function(req, res) {

  console.log(req.body);
  // flag to register a new user or not
  var registration = req.body.register;
  console.log('reg', registration);

  var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.oauth.googleSecret,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };

  console.log('Requesting google account details', params);

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    var accessToken = token.access_token;
    var headers = { Authorization: 'Bearer ' + accessToken };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {

      // handle errors
      if (err) { return res.json({status: 'error', msg: err}); }
      if (profile.error){ return res.json({status:'error', msg: profile.error.message}); }

      // Check if user already exists in database
      console.log('Checking for existing user with email: ' + profile.email + ' And provider id: ' + profile.sub);

      userCtrl.getUserByEmail(profile.email, function(response){

        var user = response.user;

        // Handle error
        if (response.error) {
          console.log(response.error);
          return res.status(400).json({ status: 'error', msg: response.error });
        }

        // Handle a valid user login
        if (user && user.id && (user.provider === 'google') ) {
          // valid user found, send back user and JWT
          var token = tokenCtrl.createToken(user);
          return res.json({ user:user,token:token});
        }

        // Handle an existing user with the wrong provider
        if (user && user.id && (user.provider !== 'google') ) {
          return res.status(400).json({
            status: 'warning',
            statusCode: '100',
            msg: 'Your email address ' + profile.email + ' is registered, but not connected to Google. Please login with the following provider: ' + user.provider
          });
        }

        console.log(registration);
        // handle user not found and no registration
        if ( (!user || !user.id) && (registration==='false') ) {
          return res.status(400).json({
            status: 'warning',
            statusCode: '100',
            msg: 'The email address ' + profile.email + ' is not registered at Columby, please register for a new account first. '
          });
        }

        // handle registration of a new user
        if ( (!user || !user.id) && (registration==='true') ) {
          console.log('No existing user, creating a new one');
          userCtrl.createUser({
            provider: 'google',
            providerId: profile.sub,
            email: profile.email,
            //picture: profile.picture.replace('sz=50', 'sz=200'),
            account: {
              displayName: profile.name
            }
          }, function(user) {
            var u = user.dataValues;
            u.primary = user.primary;
            u.organisations = [];
            var token = tokenCtrl.createToken(user);
            return res.json({ user: u, token: token });
          });
        }
      });
    });
  });
};
