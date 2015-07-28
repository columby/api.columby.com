'use strict';

var models = require('../models/index');


/**
 * Check if a user can create a requested publication account.
 *
 */
exports.canCreate = function(req, res, next) {
  console.log('Check if user can create this account.');

  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.params.id) { return res.json({status: 'error', msg: 'No account id parameter found.'}); }

  // An admin can edit everything
  if (user.admin) {
    console.log('User is admin, valid!');
    return next();
  }

  // Iterate over user's accounts
  for (var i=0; i<req.user.organisations.length; i++){
    // Check if account is same as requested account
    if (parseInt(req.user.organisations[ i].id) === parseInt(req.params.id)) {
      // Check if account has the right role to edit.
      var role = req.user.organisations[ i].role;
      // User account with role owner or admin can edit an account. (not editor or viewer)
      if ( (role === 1) || (role === 2) ) {
        return next();
      }
    }
  }
  // All failed, no access :(
  return res.json({ status:'err', msg:'No access.' });
};

/**
 * Check if a user can edit a requested publication account.
 *
 */
exports.canEdit = function(req, res, next) {
  console.log('Check if user can edit this account.');
  console.log(req.params);

  if (!req.jwt) { return res.json({status: 'error', msg: 'No jwt found.'}); }
  if (!req.user) { return res.json({status: 'error', msg: 'No user found.'}); }
  if (!req.params.id) { return res.json({status: 'error', msg: 'No account id parameter found.'}); }
  // An admin can edit everything
  if (req.user.admin) {
    console.log('User is admin, valid!');
    return next();
  }

  // Iterate over user's accounts
  for (var i=0; i<req.user.organisations.length; i++){
    // Check if account is same as requested account
    if (parseInt(req.user.organisations[ i].id) === parseInt(req.params.id)) {
      console.log('Account found for user, checking role' );
      // Check if account has the right role to edit.
      console.log(req.user.organisations[ i]);
      var role = req.user.organisations[ i].role;
      // User account with role owner or admin can edit an account. (not editor or viewer)
      if ( (role === 1) || (role === 2) ) {
        console.log('Valid role! ' + role);
        return next();
      }
    }
  }

  // All failed, no access :(
  console.log('No access');
  return res.json({ status:'err', msg:'No access.' });
};
