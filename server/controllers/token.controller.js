'use strict';

var jwt = require('jwt-simple'),
    moment = require('moment'),
    config        = require('../config/config');


/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
exports.createToken = function(user) {
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.jwt.secret);
};
