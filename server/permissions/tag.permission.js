'use strict';

var models = require('../models/index'),
    authCtrl = require('../controllers/auth.controller'),
    config = require('../config/config');


exports.canCreate = function(req,res,next) {

  console.log('validating tag.canCreate');

  // Check for token
  if (!req.jwt || !req.jwt.sub) { return res.status(401).json({status: 'Error', msg: 'No access token provided'}); }
  // Check for user
  if (!req.user || !req.user.id) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
  // An admin can edit everything
  if (req.user.admin) { return next(); }
  // check if dataset_id is provided
  if (!req.body.dataset_id) { return res.status(401).json({status: 'Error', msg: 'Missing parameter account_id'}); }

  // get dataset and publication account
  getDataset(req.body.dataset_id, function(dataset, err){
    if (err) { return res.status(401).json({status: 'Error', msg: 'Error', err: err }); }
    if (!dataset) { return res.status(401).json({status: 'Error', msg: 'No dataset found'}); }

    // Iterate over user's accounts and check if user can edit the dataset
    if (req.user.primary.id === dataset.account_id) {
      return next();
    }
    for (var i=0; i<req.user.organisations.length; i++){
      // Check if account is same as requested publication account for the new reference.
      if (user.organisations[ i].id === dataset.account_id) {
        // Check if account has the right role to edit.
        var role = user.account[ i].AccountsUsers.role;
        // User account with role owner, admin can edit an account. (Not editor or viewer)
        if (role === 1 || 2 || 3) {
          return next();
        }
      }
    }
    // All failed, no access :(
    console.log('All failed, no access.');
    return res.status(401).json({status: 'Error', msg: 'No access'});
  });
}
