'use strict';

/**
 *
 * Dependencies
 *
 */
var _ = require('lodash'),
    Sequelize = require('sequelize'),
    models = require('../models/index'),
    Account = require('../models/index').Account,
    AccountsUser = require('../models/index').AccountsUser,
    Dataset = require('../models/index').Dataset,
    Collection = require('../models/index').Collection,
    File = require('../models/index').File;


function slugify(text) {
  return text.toString().toLowerCase()
    .split('@')[0]
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
    //limit characters
}


function getAccountUsers(account){
  // fetch users from given account

  // fetch primary account from user and rol for the given account

  console.log(account.id);
  var accounts=[];
  account.getUsers().success(function(users){
    //console.log('users', users[0].AccountsUser.dataValues);
    for (var i=0;i<users.length;i++){
      var user = users[0];
      user.getAccounts({
        where: { primary:true }
      }).success(function(a){
        //console.log(a);
        accounts.push(a);
      }).error(function(err){
        console.log('err',err);
      });
    }
    //console.log('aa', accounts);
  }).error(function(err){
    console.log('err',err);
  });
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
  // Check if a jwt is present
  if (req.jwt && req.jwt.sub){
    // Check if the user in the jwt exists
    models.User.find(req.jwt.sub).success(function(user){
      if (user.admin) {
        next();
      } else {
        user.getAccounts({ where:{ slug: req.params.id }}).success(function (accounts) {
          if (accounts && accounts.length>0){
            next();
          } else {
            return res.json({status:'err', msg:'No access. '});
          }
        }).error(function(err){
          return handleError(res,err);
        });
      }
    }).error(function(err){
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
  var offset = req.query.offset | 0;

  Account.findAll({
    where: filter,
    limit: limit,
    offset: offset,
    order: 'created_at DESC'
  }).success(function(accounts) {
    return res.json(accounts);
  }).error(function(err){
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

  Account.find({
    where: { slug: req.params.id },
    include: [
      //{ model: Collection },
      //{ model: Dataset },
      { model: File, as: 'avatar'},
      { model: File, as: 'headerImg'},
      { model: File, as: 'files'}
    ]
  }).success(function(account){
    getAccountUsers(account);
    res.json(account);
  }).error(function(err){
    console.log(err);
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
  Account.create(req.body).success(function(account) {
    return res.json(201, account);
  }).error(function(err){
    handleError(res,err);
    console.log(err);
  });
};


/**
 *
 * Updates an existing account in the DB.
 *
 * @param req
 * @param res
 *
 */
exports.update = function(req, res) {

  Account.find(req.body.id).success(function(account){
    // Set new avatar if needed
    if (req.body.avatar){
      account.setAvatar(req.body.avatar);
    }
    // Set new header image if needed
    if (req.body.headerImg){
      account.setHeaderImg(req.body.headerImg);
    }

    //console.log('account', account);
    account.updateAttributes(req.body).success(function(account) {
      console.log('success', account.dataValues);
      res.json(account);
    }).error(function(err) {
      handleError(res,err);
    });

  }).error(function(err){
    handleError(res,err);
  });
};

/**
 *
 * Deletes a account from the DB.
 *
 * @param req
 * @param res
 *
 */
exports.destroy = function(req, res) {
  Account.findById(req.params.id, function (err, account) {
    if(err) { return handleError(res, err); }
    if(!account) { return res.send(404); }
    account.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};


exports.addFile = function(req,res){
  console.log(req.body);
  Account.find(req.body.account_id).success(function(account){
    console.log('account: ', account.dataValues);
    account.addFile(req.body.id).success(function(model){
      console.log('model: ', model);
      return res.json({status: 'success'});
    }).error(function(err){
      return handleError(res,err);
    });
  }).error(function(err){
    return handleError(res,err);
  });
};


function handleError(res, err) {
  console.log('err',err);
  return res.send(500, err);
}
