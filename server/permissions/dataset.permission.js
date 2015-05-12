'use strict';

var models = require('../models/index'),
    Dataset = models.Dataset,
    User = models.User,
    Account = models.Account,
    authCtrl = require('../controllers/auth.controller'),
    config = require('../config/environment/index'),
    jwt = require('jwt-simple'),
    moment = require('moment');



/**
 * Helper functions
 **/

// Fetch a specific user
function getUser(id, cb){
  User.find({
    where:{
      id: id
    },
    include: [
      { model: Account, as: 'account' }
    ]
  }).then(function(user){
    cb(user);
  }).catch(function(err){
    cb(err);
  });
}

// Fetch a specific dataset
function getDataset(id, cb){
  Dataset.find({
    where:{
      id: id
    }
  }).then(function(dataset){
    cb(dataset);
  }).catch(function(err){
    cb(err);
  })
}


/***
 *
 * Check to see if a user can view a specific dataset
 *
 ***/

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


/***
 *
 * Check to see if a user can view a specific dataset
 *
 ***/
exports.canCreate = function(req,res,next){
  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){
    if (!user){
      return res.status(401).json({status: 'Error', msg: 'No access'});
    }
    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }
    // Iterate over user's accounts
    for (var i=0; i<user.account.length; i++){
      // Check if account is same as requested publication account for the new dataset.
      if (user.account[ i].dataValues.id === req.body.account.id) {
        console.log('Account found for user, checking role');
        // Check if account has the right role to edit.
        var role = user.account[ i].AccountsUsers.role;
        // User account with role owner, admin can edit an account. (Not editor or viewer)
        if (role === 1 || 2 || 3) {
          console.log('Valid role! ' + role);
          return next();
        }
      }
    }
    // All failed, no access :(
    return res.status(401).json({status: 'Error', msg: 'No access'});
  });
}


exports.canEdit = function(req,res,next){
  console.log(req.body);

  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){

    if (!user){
      return res.status(401).json({status: 'Error', msg: 'No access'});
    }

    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }

    // Get the dataset's publication Account
    models.Dataset.find({
      where: { id: req.body.id },
      include: [ { model: models.Account, as: 'account' }]}).then(function(dataset){
        var datasetId = dataset.account.dataValues.id;
        // Iterate over user's accounts
        for (var i=0; i<user.account.length; i++){
          // Check if account is same as requested publication account for the new dataset.
          if (user.account[ i].dataValues.id === datasetId) {
            console.log('Account found for user, checking role');
            // Check if account has the right role to edit.
            var role = user.account[ i].AccountsUsers.role;
            // User account with role owner, admin can edit an account. (Not editor or viewer)
            if (role === 1 || 2 || 3) {
              console.log('Valid role! ' + role);
              return next();
            }
          }
        }
        return res.json({ status:'err', msg:'No access.' });
    }).catch(function(err){
      return res.status(401).json({status: 'Error', msg: err});
    });
  });
}


exports.canDelete = function(req,res,next){
  // Fetch the current user and associated accounts.
  getUser(req.jwt.sub, function(user){
    // An admin can edit everything
    if (user.admin) {
      console.log('User is admin, valid!');
      return next();
    }

    models.Dataset.find({
      where: { id: req.params.id },
      include: [ { model: models.Account, as: 'account' }]}).then(function(dataset){
        // Iterate over user's accounts
        for (var i=0; i<user.dataValues.account.length; i++){
          // Check if account is same as requested publication account for the new dataset.
          if (user.dataValues.account[ i].dataValues.id === dataset.dataValues.account.dataValues.id) {
            console.log('Account found for user, checking role');
            // Check if account has the right role to edit.
            var role = user.account[ i].AccountsUsers.role;
            // User account with role owner, admin can edit an account. (Not editor or viewer)
            if (role === 1 || 2 || 3) {
              console.log('Valid role! ' + role);
              return next();
            }
          }
        }
        return res.json({status:'error',message:'No access'});
      }).catch(function(err){
        console.log(err);
        return res.status(401).json({status: 'Error', msg: err});
      });
   });
}
