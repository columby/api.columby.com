'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index');


/**
 *
 * Functions
 *
 */

// Get the primary account for a user.
function getPrimaryAccount(user, cb){
  console.log('Getting primary for user ' + user.id);
  models.User.find({
    where: {
      id: user.id
    },
    include: [{
      model: models.Account,
      as:'account',
      where: {
        primary: 'true'
      },
      include: [{
        model: models.File,
        as:'avatar'
      }]
    }]
  }).then(function(user){
    //console.log('user', user.account[0].dataValues);
    var a = user.account[ 0].dataValues;
    a.role = a.AccountsUsers.role;
    delete a.AccountsUsers;
    cb(a);
  }).catch(function(err){
    console.log('err',err);

  });
}
// Get the primary account for a list of users.
function getPrimaryAccounts(users, counter, result, cb){
  console.log('Getting primary account counter: ' + counter);
  console.log('The number of users is: ' + users.length);
  getPrimaryAccount(users[ counter], function(primary){
    console.log('primary id', primary.id);
    result.push(primary);
    handleGetPrimaryAccounts(users,counter,result,cb);
  });
}
// Handle the primary account result.
function handleGetPrimaryAccounts(users,counter,result,cb){
  counter++;
  if (counter<users.length){
    getPrimaryAccounts(users,counter,result,cb);
  } else {
    cb(result);
  }
}


/**
 * Check if a user can edit a requested publication account.
 *
 * @param req
 * @param res
 * @param next
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
 *
 * Get list of accounts
 *
 */
exports.index = function(req, res) {
  // Define WHERE clauses
  var filter = {
    private: false
  };
  // Set (default) limit
  var limit = req.query.limit || 10;
  // Set (default) offset
  var offset = req.query.offset || 0;

  models.Account.findAll({
    where: filter,
    limit: limit,
    offset: offset,
    order: 'created_at DESC'
  }).then(function(accounts) {
    return res.json(accounts);
  }).catch(function(err){
    console.log(err);
    return handleError(res, err);
  });
};


/**
 *
 * Get a single account
 *
 * @param req
 * @param res
 *
 */
exports.show = function(req, res) {

  models.Account.find({
    where: { slug: req.params.id },
    include: [
      { model: models.Collection },
      //{ model: Dataset },
      { model: models.File, as: 'avatar' },
      { model: models.File, as: 'headerImg' },
      { model: models.File, as: 'files' },
      { model: models.User, as: 'users' }
    ]
  }).then(function(account) {
    if (!account){ return account; }

    var a = account.dataValues;
    a.users = [];
    // Get users for this account when the account is not a primary Account
    if (!account.primary) {
      // We know the userID, next we need to know the primary-account for this user.
      // get account for this user
      console.log('getting accounts: ' + account.users.length);
      getPrimaryAccounts(account.users, 0, [], function(result){
        a.users = result;
        res.json(a);
      });

    } else {
      res.json(a);
    }
  }).catch(function(err){
    return handleError(res,err);
  });
};


/**
 *
 * Creates a new account in the DB.
 *
 * @param req
 * @param res
 *
 */
exports.create = function(req, res) {
  models.Account.create(req.body).then(function(account) {
    return res.json(201, account);
  }).catch(function(err){
    handleError(res,err);
    console.log(err);
  });
};


/**
 *
 * Updates an existing account in the DB.
 * Access control is done in previous middleware!
 *
 * @param req
 * @param res
 *
 */
exports.update = function(req, res) {

  models.Account.find(req.body.id).then(function(account){
    // Set new avatar if needed
    if (req.body.avatar){
      account.setAvatar(req.body.avatar);
    }
    // Set new header image if needed
    if (req.body.headerImg){
      account.setHeaderImg(req.body.headerImg);
    }

    //console.log('account', account);
    account.updateAttributes(req.body).then(function(account) {
      console.log('success', account.dataValues);
      res.json(account);
    }).catch(function(err) {
      handleError(res,err);
    });
  }).catch(function(err){
    handleError(res,err);
  });
};


/**
 *
 * Deletes a account from the DB.
 * Access control is done in previous middleware!
 *
 * @param req
 * @param res
 *
 */
exports.destroy = function(req, res) {
  models.Account.findById(req.params.id, function (err, account) {
    if(err) { return handleError(res, err); }
    if(!account) { return res.send(404); }
    account.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};


// Add a file to a user account. 
exports.addFile = function(req,res){
  console.log(req.body);
  models.Account.find(req.body.account_id).then(function(account){
    console.log('account: ', account.dataValues);
    account.addFile(req.body.id).then(function(model){
      console.log('model: ', model);
      return res.json({status: 'success'});
    }).catch(function(err){
      return handleError(res,err);
    });
  }).catch(function(err){
    return handleError(res,err);
  });
};



// Error handler
function handleError(res, err) {
  console.log('Account controller error: ', err);
  return res.status(500).json({status: 'error', msg:err});
}
