'use strict';

/**
 *
 * Dependencies
 *
 */
var models = require('../models/index');

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
 * @api {get} v2/account/:slug Get account
 * @apiName GetAccount
 * @apiGroup Account
 * @apiVersion 2.0.0
 *
 * @apiDescription Get an account
 *
 * @apiParam {Number} slug Account unique slug.
 *
 * @apiSuccess {object} account Details from the account.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [{
 *        "status": "success",
 *        "account": {}
 *    }]
 */
exports.show = function(req, res) {
  console.log('Show account with slug: ' + req.params.slug);

  // Find the account and related data
  models.Account.find({
    plain: true,
    where: { slug: req.params.slug },
    include: [
      { model: models.File, as: 'avatar' },
      { model: models.File, as: 'headerImg' },
      { model: models.File, as: 'files' },
      { model: models.User, as: 'users', include: [
        { model: models.Account, as: 'account', where: { primary: true }, include: [
          { model: models.File, as: 'avatar' },
        ] }
      ]}
    ]
  }).then(function(account) {

    account.getRegistries().then(function(registries){

      var a = {
        id: account.dataValues.id,
        shortid: account.dataValues.shortId,
        displayName: account.dataValues.displayName,
        slug: account.dataValues.slug,
        email: account.dataValues.email,
        description: account.dataValues.description,
        primary: account.dataValues.primary,
        contact: account.dataValues.contact,
        url: account.dataValues.url,
        location: account.dataValues.location,
        avatar: account.avatar,
        headerImg: account.headerImg,
        files: account.files,
        people: []
      }

      for (var i=0; i<account.users.length;i++){
        var u = account.users[ i].dataValues.account[0].dataValues;
        u.role = account.users[ i].UserAccounts.dataValues.role;
        delete u.UserAccounts;
        delete u.plan;
        delete u.uuid;
        a.people.push(u);
      }

      a.registries = registries;

      return res.json(a);
    });
  }).catch(function(err){
    console.log('err', err);
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

  models.Account.findById(req.body.id).then(function(account){
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


/**
 * @api {post} v2/account/:id/registry/:rid Update account registry
 * @apiName UpdateAccountRegistry
 * @apiGroup Account
 * @apiVersion 2.0.0
 *
 * @apiDescription Update an existing registry connected to a publication account
 *
 * @apiParam {Number} id Account unique ID.
 * @apiParam {Number} rid Registry unique ID.
 *
 * @apiSuccess {object} registry Details from the account registry with updated result.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [{
 *        "id": "1"
 *    }]
 */
exports.updateRegistry = function(req,res){
  var fields = req.body;
  models.account_registries.findById(req.params.rid).then(function(registry){

    if (fields.active===false) {
      fields.autoadd=false;
    }
    registry.updateAttributes(fields).then(function(result) {
      return res.json(result);
    }).catch(function(err){
      return handleError(res,err);
    })
  }).catch(function(err){
    return handleError(res,err);
  });
}

// Error handler
function handleError(res, err) {
  console.log('Account controller error: ', err.name);
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.json({
      status: 'error',
      msg: err.errors
    })
  } else {
    return res.status(500).json({status: 'error', msg:err});
  }
}
