'use strict';

var models = require('../models/index');


/**
 * Check if a user can create a requested publication account.
 *
 */
exports.canQuery = function(req, res, next) {
  if (user.admin) {
    console.log('User is admin, valid!');
    return next();
  } else  {
    return res.json({ status:'err', msg:'No access.' });
  }
};
