'use strict';

var models = require('../models/index'),
    Category = models.Category,
    User = models.User;


// helper to check if a user has access to a certain account.
function validateAccountAccess(user, account_id, cb) {

  if (user.admin) { return cb(true); }

  if (user.primary.id === account_id) {
    return cb(true);
  }

  // Iterate over user's accounts
  for (var i=0; i<user.organisations.length; i++){
    // Check if account is same as requested account
    if (parseInt(user.organisations[ i].id) === parseInt(account_id)) {
      // Check if account has the right role to edit.
      var role = user.organisations[ i].role;
      // User account with role owner or admin can edit an account. (not editor or viewer)
      if ( (role === 1) || (role === 2) ) {
        return cb(true);
      }
    }
  }

  return cb(false);
}


exports.canCreate = function(req,res,next){
  if (!req.jwt || !req.jwt.sub) { return res.json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.json({status: 'Error', msg: 'No user found'}); }
  if (!req.body.account_id) { return res.json({status: 'Error', msg: 'Missing required parameter account_id'}); }
  if (req.user.admin) { return next(); }

  validateAccountAccess(req.user, req.body.account_id, function(result){
    if (!result){ return res.status(401).json({status: 'Error', msg: 'No access'}); }
    next();
  });
}


exports.canEdit = function(req,res,next){
  if (!req.jwt || !req.jwt.sub) { return res.status(401).json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
  if (!req.body.account_id) { return res.status(401).json({status: 'Error', msg: 'Missing required parameter account_id'}); }
  if (req.user.admin) { return next(); }

  validateAccountAccess(req.user, req.body.account_id, function(result){
    if (!result){ return res.status(401).json({status: 'Error', msg: 'No access'}); }
    next();
  });
}

exports.canDelete = function(req,res,next){
  if (!req.jwt || !req.jwt.sub) { return res.json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.json({status: 'Error', msg: 'No user found'}); }
  if (!req.params.id) { return res.json({status: 'Error', msg: 'Missing required parameter id'}); }
  if (req.user.admin) { return next(); }

  models.Category.findById(req.params.id).then(function(category){
    validateAccountAccess(req.user, category.account_id, function(result){
      if (!result){ }
      next();
    });
  }).catch(function(err){
    return res.json({status: 'Error', msg: err});
  });
}
