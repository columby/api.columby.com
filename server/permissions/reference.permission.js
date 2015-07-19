'use strict';

var models = require('../models/index'),
    authCtrl = require('../controllers/auth.controller'),
    config = require('../config/config');



// Fetch a specific reference
function getDataset(id, cb){
  models.Dataset.findById(id).then(function(dataset){
    cb(dataset);
  }).catch(function(err){
    cb(null,err);
  })
}


exports.canView = function(req,cb) {

  // everybody can view public references
  if (req.reference.private === false){
    return cb(true);
  }

  // Get the user to check the account

  // Account editors are allowed to view the reference.
  if (req.headers.authorization){
    console.log('checkin authorization header');
    var token = req.headers.authorization.split(' ')[1];
    var payload = jwt.decode(token, config.jwt.secret);
    if (payload.exp <= moment().unix()) {
      console.log('Token has expired');
    }
    // Attach user id to req
    if (!payload.sub) {
      return cb(false);
    } else {
      // account editors can view account private references
      getUser(payload.sub, function(user){
        if (user.admin) {
          console.log('User is admin, valid!');
          return cb(true);
        }

        // Iterate over user's accounts
        for (var i=0; i<user.account.length; i++){
          // Check if account is same as requested publication account for the new reference.
          if (user.account[ i].dataValues.id === req.reference.dataValues.account_id) {
            console.log('Account found for user, checking role');
            // Check if account has the right role to edit.
            var role = user.account[ i].AccountsUsers.role;
            // User account with role owner, admin can edit an account. (Not editor or viewer)
            if (role === 1 || 2 || 3) {
              console.log('Valid role! ' + role);
              return cb(true);
            }
          }
        }
        return cb(false);
      });
    }
  } else {
    return cb(false);
  }
}


exports.canCreate = function(req,res,next) {

  console.log('validating reference.canCreate');

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


exports.canEdit = function(req,res,next){
  console.log('validating reference.canEdit');
  // Check for token
  if (!req.jwt || !req.jwt.sub) { return res.json({status: 'error', msg: 'No access token provided'}); }
  // Check for user
  if (!req.user || !req.user.id) { return res.json({status: 'error', msg: 'No user found'}); }
  // An admin can edit everything
  if (req.user.admin) { return next(); }
  // check if dataset_id is provided
  if (!req.body.id) { return res.json({status: 'error', msg: 'Missing parameter id'}); }

  //console.log(req.body);
  // Get the reference's publication Account
  models.Reference.findById(req.body.id, {
    include: [ { model: models.Dataset, as: 'Dataset' } ]
  }).then(function(reference){
    //console.log('Reference: ', reference);
    if (!reference){
      return res.json({status:'error',msg:'No reference found'});
    }

    var referenceAccountId = reference.dataValues.Dataset.dataValues.account_id;

    if (req.user.primary.id === referenceAccountId){
      console.log('Primary account access');
      return next();
    }
    // Iterate over user's accounts
    console.log('Organisations: ', req.user.organisations);

    for (var i=0; i<req.user.organisations.length; i++){
      // Check if account is same as requested publication account for the new reference.
      if (user.organisations[ i].id === referenceAccountId) {
        console.log('Account found for user, checking role');
        // Check if account has the right role to edit.
        var role = user.account[ i].AccountsUsers.role;
        // User account with role owner, admin can edit an account. (Not editor or viewer)
        switch(role){
          case 1: case 2: case 3:
            console.log('Valid role! ' + role);
            return next();
        }
      }
    }

    // Otherwise no access
    return res.json({ status:'err', msg:'No access.' });
  }).catch(function(err){
    console.log('db error ', err);
    return res.json({status: 'Error', msg: err});
  });
}


exports.canDelete = function(req,res,next){
  console.log('validating reference.canDelete');

  // Check for token
  if (!req.jwt || !req.jwt.sub) { return res.json({status: 'error', msg: 'No access token provided'}); }
  // Check for user
  if (!req.user || !req.user.id) { return res.json({status: 'error', msg: 'No user found'}); }
  // An admin can edit everything
  if (req.user.admin) { return next(); }
  // check if dataset_id is provided
  if (!req.params.id) { return res.json({status: 'error', msg: 'Missing parameter id'}); }

  console.log('Finding Reference with id: ' + req.params.id);
  models.Reference.findById(req.params.id, {
    include: [ { model: models.Dataset, as: 'Dataset' } ]
  }).then(function(reference){
    //console.log('Reference: ', reference);
    if (!reference){
      return res.json({status:'error',msg:'No reference found'});
    }

    var referenceAccountId = reference.dataValues.Dataset.dataValues.account_id;

    if (req.user.primary.id === referenceAccountId){
      console.log('Primary account access');
      return next();
    }
    // Iterate over user's accounts
    console.log('Organisations: ', req.user.organisations);

    for (var i=0; i<req.user.organisations.length; i++){
      // Check if account is same as requested publication account for the new reference.
      if (user.organisations[ i].id === referenceAccountId) {
        console.log('Account found for user, checking role');
        // Check if account has the right role to edit.
        var role = user.account[ i].AccountsUsers.role;
        // User account with role owner, admin can edit an account. (Not editor or viewer)
        switch(role){
          case 1: case 2: case 3:
            console.log('Valid role! ' + role);
            return next();
        }
      }
    }

    // Otherwise no access
    return res.json({ status:'err', msg:'No access.' });
  }).catch(function(err){
    console.log('db error ', err);
    return res.json({status: 'Error', msg: err});
  });
}
