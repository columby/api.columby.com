'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index');



function getAccountUsers(account){
  // fetch users from given account

  // fetch primary account from user and rol for the given account

  console.log(account.id);
  var accounts=[];
  account.getUsers().then(function(users){
    //console.log('users', users[0].AccountsUser.dataValues);
    for (var i=0;i<users.length;i++){
      var user = users[0];
      user.getAccounts({
        where: { primary:true }
      }).then(function(a){
        //console.log(a);
        accounts.push(a);
      }).catch(function(err){
        console.log('err',err);
      });
    }
    //console.log('aa', accounts);
  }).catch(function(err){
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
    models.User.find(req.jwt.sub).then(function(user){
      if (user.admin) {
        next();
      } else {
        user.getAccounts({ where:{ slug: req.params.id }}).then(function (accounts) {
          if (accounts && accounts.length>0){
            next();
          } else {
            return res.json({status:'err', msg:'No access. '});
          }
        }).catch(function(err){
          return handleError(res,err);
        });
      }
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
  var offset = req.query.offset | 0;

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
      { model: models.File, as: 'avatar'},
      { model: models.File, as: 'headerImg'},
      { model: models.File, as: 'files'}
    ]
  }).then(function(account){
    getAccountUsers(account);
    res.json(account);
  }).catch(function(err){
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


function handleError(res, err) {
  console.log('err',err);
  return res.send(500, err);
}
