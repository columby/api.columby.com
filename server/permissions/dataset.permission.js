'use strict';

var models = require('../models/index'),
    authCtrl = require('../controllers/auth.controller'),
    config = require('../config/config'),
    jwt    = require('jwt-simple'),
    moment = require('moment');



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


exports.canView = function(req,res,next){
  console.log('validating canview ', req.params);
  models.Dataset.findOne({
    where: {
      shortid: req.params.id
    },
    include: [ { model: models.Account, as: 'account' }]
  }).then(function(dataset){
    req.dataset = dataset;
    if (!req.dataset.private) {
      // public datasets are publicly visible
      next();
    } else {
      // otherwise check access
      // get jwt
      req.jwt = req.jwt || {};
      // Decode the token if present
      if (req.headers.authorization){
        try {
          req.jwt = jwt.decode(req.headers.authorization.split(' ')[1], config.jwt.secret);
        } catch (err){}
        // get user
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

            // validate access
            validateAccountAccess(req.user, dataset.dataValues.account_id, function(result){
              if (result) {
                console.log('access granted');
                next();
              } else {
                return res.json({result: null, msg: 'No access'});
              }
            });
          });
        } else {
          return res.json({result: null, msg: 'No User'});
        }
      } else  {
        return res.json({result:null, msg: 'No JWT'});
      }
    }
  }).catch(function(err){
    console.log(err);
    return res.status(401).json({status: 'Error', msg: 'Error finding dataset: ' + req.params.id});
  });
}

/***
 *
 * Check to see if a user can create a specific dataset
 *
 ***/
exports.canCreate = function(req,res,next) {

  if (!req.jwt || !req.jwt.sub) { return res.status(401).json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
  if (!req.body.account_id) { return res.status(401).json({status: 'Error', msg: 'Missing required parameter account_id'}); }
  if (req.user.admin) { return next(); }

  validateAccountAccess(req.user, req.body.account_id, function(result){
    if (!result){ return res.status(401).json({status: 'Error', msg: 'No access'}); }
    next();
  });
}


/***
 *
 * Check to see if a user can edit a specific dataset
 *
 ***/
exports.canEdit = function(req,res,next){

  if (!req.jwt || !req.jwt.sub) { return res.status(401).json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
  if (!req.params.id) { return res.json({status:'error', msg: 'Required parameter dataset id missing.'}); }

  // Get the dataset's publication Account
  models.Dataset.findById(req.params.id, {
    include: [ { model: models.Account, as: 'account' }]
  }).then(function(dataset){
    req.dataset = dataset;
    validateAccountAccess(req.user, dataset.dataValues.account_id, function(result){
      if (!result) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
      // Valid
      return next();
    });
  }).catch(function(err){
    return res.status(401).json({status: 'Error', msg: JSON.stringify(err)});
  });
}


/***
 *
 * Check to see if a user can delete a specific dataset
 *
 ***/
exports.canDelete = function(req,res,next){
  if (!req.jwt || !req.jwt.sub) { return res.status(401).json({status: 'Error', msg: 'No access token provided'}); }
  if (!req.user || !req.user.id) { return res.status(401).json({status: 'Error', msg: 'No user found'}); }
  if (!req.params.id) { return res.json({status:'error', msg: 'Required parameter dataset id missing.'}); }

  // Get the dataset's publication Account
  models.Dataset.findById(req.params.id, {
    include: [ { model: models.Account, as: 'account' }]
  }).then(function(dataset){
    req.dataset = dataset;
    validateAccountAccess(req.user, dataset.dataValues.account_id, function(result){
      if (!result) {
        return res.status(401).json({status: 'Error', msg: 'No user found'});
      }
      return next();
    });
  }).catch(function(err){
    return res.status(401).json({status: 'Error', msg: JSON.stringify(err)});
  });
}


// Validate if a user can view a specific dataset
exports.canViewDataset = function(req,cb) {

  // everybody can view public datasets
  if (req.dataset.private === false){
    return cb(true);
  }

  // Get the user to check the account

  // Account editors are allowed to view the dataset.
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
      // account editors can view account private datasets
      getUser(payload.sub, function(user){
        if (user.admin) {
          console.log('User is admin, valid!');
          return cb(true);
        }

        // Iterate over user's accounts
        for (var i=0; i<user.account.length; i++){
          // Check if account is same as requested publication account for the new dataset.
          if (user.account[ i].dataValues.id === req.dataset.dataValues.account_id) {
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
