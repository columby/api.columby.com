'use strict';

var models = require('../models/index');


/**
 * Check if a user can create a requested publication account.
 *
 */
exports.canCreate = function(req, res, next) {
  console.log('Check if user can create this account.');
  // Check if a jwt is present
  if (req.jwt && req.jwt.sub){
    // Check if the user in the jwt exists
    models.User.find({
      where: {
        id: req.jwt.sub
      },
      include: [
        { model: models.Account, as: 'account' }
      ]
    }).then(function(user){

      // An admin can edit everything
      if (user.admin) {
        console.log('User is admin, valid!');
        return next();
      }

      // Iterate over user's accounts
      for (var i=0; i<user.account.length; i++){
        // Check if account is same as requested account
        if (user.account[ i].dataValues.id === req.body.id) {
          console.log('Account found for user, checking role');
          // Check if account has the right role to edit.
          var role = user.account[ i].AccountsUsers.role;
          // User account with role owner or admin can edit an account. (not editor or viewer)
          if ((role === 1 || 2 )) {
            console.log('Valid role! ' + role);
            return next();
          }
        }
      }

      // All failed, no access :(
      return res.json({ status:'err', msg:'No access.' });

    }).catch(function(err){
      return handleError(res,err);
    });
  } else {
    return res.json({status:'err', msg:'User not logged in'});
  }
};

/**
 * Check if a user can edit a requested publication account.
 *
 */
exports.canEdit = function(req, res, next) {
  console.log('Check if user can edit this account.');
  // Check if a jwt is present
  if (req.jwt && req.jwt.sub){
    // Check if the user in the jwt exists
    models.User.find({
      where: {
        id: req.jwt.sub
      },
      include: [
        { model: models.Account, as: 'account' }
      ]
    }).then(function(user){

      // An admin can edit everything
      if (user.admin) {
        console.log('User is admin, valid!');
        return next();
      }

      // Iterate over user's accounts
      for (var i=0; i<user.account.length; i++){
        // Check if account is same as requested account
        if (user.account[ i].dataValues.id === req.body.id) {
          console.log('Account found for user, checking role');
          // Check if account has the right role to edit.
          var role = user.account[ i].UserAccounts.role;
          // User account with role owner or admin can edit an account. (not editor or viewer)
          if ((role === 1 || 2 )) {
            console.log('Valid role! ' + role);
            return next();
          }
        }
      }

      // All failed, no access :(
      return res.json({ status:'err', msg:'No access.' });

    }).catch(function(err){
      console.log(err);
      return res.json({ status:'err', msg:err });
    });
  } else {
    return res.json({status:'err', msg:'User not logged in'});
  }
};
