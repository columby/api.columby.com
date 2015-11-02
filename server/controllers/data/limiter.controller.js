'use strict';

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(250, 'hour');

exports.checkLimiter = function(req,res,next){
  if (limiter.tryRemoveTokens(1)) {
    next();
  } else {
    return res.json('API limit received.');
  }

};
