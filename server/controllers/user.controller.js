'use strict';

var _             = require('lodash'),

    models        = require('../models/index'),

    config        = require('../config/environment/index'),
    auth          = require('../controllers/auth.controller'),
    emailService  = require('../controllers/email.controller');


/**
 *
 * Provide the currently logged in user details
 *
 */
exports.me = function(req, res) {
  console.log('Handling /me request. for JWT account id', req.jwt.sub);


  // TODO:
  //Company.findAll({
  //  include: [ { model: Division } ],
  //  order: [ [ Division, DepartmentDivision, 'name' ] ]
  //});
  models.User.find(req.jwt.sub).then(function(user) {
    console.log('User found: ', user.id);
    user.getAccounts({
      include: [
        { model: models.File, as: 'avatar'}
      ]
    }).then(function(accounts){
      //console.log('get accounts: ', accounts);
      console.log('Found '+ accounts.length + ' account(s)');
      user = user.dataValues;
      user.accounts = [];
      for (var i=0; i<accounts.length; i++){
        var account = accounts[ i].dataValues;
        //console.log('account,', account);
        account.role = accounts[ i].AccountsUsers.dataValues.role;
        delete account.AccountsUsers;
        //console.log('ava', account.avatar.dataValues);
        //account.avatar = account.avatar.dataValues;
        if (accounts[ i].primary) {
          user.primary = account;
        }
        user.accounts.push(account);
      }
      return res.json(user);
    }).catch(function(err){
      console.log(err);
    });
  }).catch(function(err){
    console.log('something went wrong!');
    handleError(res,err);
  });
};


exports.config = function(req,res){
  var c = {
    aws: {
      publicKey : config.aws.publicKey,
      bucket    : config.aws.bucket,
      endpoint  : config.aws.endpoint
    },
    embedly: {
      key       : config.embedly.key
    }
  };

  return res.json(c);
};


/**
 *
 * Get list of users
 *
 * Site admins only
 *
 **/
exports.index = function(req, res) {
  models.User.find(function (err, users) {
    if(err) { return handleError(res, err); }
    return res.json(users);
  });
};


/**
 *
 * Get a single user by user._id
 *
 * Site admins only
 *
 * @param req.params.id
 *
 **/
exports.show = function(req, res) {
  models.User.findOne({_id: req.params.id}, function (err, user) {
    console.log('user', user);
    if(err) { return handleError(res, err); }
    return res.json(user);
  });
};


/**
 *
 * Create a new user.
 *
 * Publicly accessible by registration form.
 *
 * @param req.body.email
 * @param req.body.name
 *
 * Create:
 *    new User,
 *    new Account (primary),
 *    update User with account-reference
 *    new login-token
 *    email user with login token
 *
 **/
exports.register = function(req, res) {
  console.log('new user', req.body);
  // Try to create a new user
  models.User.create(req.body)
    // Handle successful user creation
    .then(function(user) {

      // Create a primary publication account for this user.
      var newAccount = {
        name: req.body.name,
        primary: true
      };
      console.log('Creating user: ', newAccount);
      models.Account.create(newAccount).then(function(account){
        console.log('New account: ', account);
        // Add the new account to the craeted user
        user.addAccount(account).then(function(result){
          // Send email to user with login link.
          console.log('result after save: ', result);

          var vars = {
            user: {
              email: user.email,
              name: account.name
            }
          };
          console.log('var', vars);
          // Create Login Token
          // create a new logintoken
          models.Token.create({user_id: user.id}).then(function(token){
            console.log('token created', token.token);
            // Send the new token by email
            var emailVars = {
              //tokenurl: req.protocol + '://' + req.get('host') + '/u/signin?token=' + token.token,
              tokenurl: 'https://www.columby.com/u/signin?token=' + token.token,
              user: {
                email: user.email,
                name: user.name
              }
            };
            emailService.register(emailVars, function(result){
              console.log(user.shortid);
              console.log(result);
              if (result[0].status === 'sent') {
                return res.json({status: 'success', user: user.shortid});
              } else {
                return handleError(res, { status: 'error', err: 'Error sending mail.' });
              }
            });
          }).catch(function(err){
            console.log('err', err);
            return handleError(res,err);
          });
        }).catch(function(err){
          user.destroy();
          console.log('err',err);
          handleError(res,err);
        });
      }).catch(function(err){
        console.log(err);
        handleError(res,err);
      });
    }).catch(function(err){
      console.log(err);
      handleError(res,err);
    });
};


/**
 *
 * Update an existing user.
 *
 * Admins only
 *
 * @param req.body.verified
 * @param req.body.accounts
 *
 *
 **/
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  models.User.findById(req.params.id, function (err, user) {
    if (err) { return handleError(res, err); }
    if(!user) { return res.send(404); }
    var updated = _.merge(user, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, user);
    });
  });
};


/**
 *
 * Delete an existing user.
 *
 * Admins only
 *
 * @param req.body.verified
 * @param req.body.accounts
 *
 * Delete:
 *   Delete primary account
 *   Delete User
 *   Send email to user
 *
 **/
exports.destroy = function(req, res) {
  models.User.findById(req.params.id, function (err, user) {
    if(err) { return handleError(res, err); }
    if(!user) { return res.send(404); }
    user.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};


/**
 *
 * Login a user with an email-address and send a one-time login-token back
 *
 * Public access
 *
 * @param req.body.email
 *
 **/
exports.login = function(req,res) {
  console.log('Finding user ', req.body.email);
  models.User.find({
    where: {
      email: req.body.email
    },
    include: [
      { model: models.Account }
    ]
  }).then(function(user) {
    if (!user) {
      return res.json({
        status: 'not_found',
        msg: 'The requested user with email ' + req.body.email + ' was not found.'
      });
    }

    // create a new logintoken
    models.Token.create({user_id: user.id}).then(function(token){
      console.log('token created', token.token);
      // Send the new token by email
      var vars = {
        tokenurl: 'https://www.columby.com/u/signin?token=' + token.token,
        user: {
          email: user.email,
          name: user.name
        }
      };
      emailService.login(vars, function(result){
        console.log(result);
        console.log(user.shortid);
        if (result[0].status === 'sent') {
          return res.json({status: 'success', user: user.shortid});
        } else {
          return handleError(res, { status: 'error', err: 'Error sending mail.' });
        }
      });
    }).catch(function(err){
      console.log('err', err);
      return handleError(res,err);
    });
  })
  .catch(function(err){
    if (err) { return handleError(res, err); }
  });
};


/**
 *
 * Verify a supplied token and return a JWT when validated.
 *
 * Public access
 *
 * @param req.query.token
 *
 **/
exports.verify = function(req,res) {

  var loginToken = req.query.token;

  // Check if supplied token exists and delete it after use
  models.Token.find({where:{'token': loginToken}}).then(function(token) {
    if (!token) {
      return res.json({status: 'error', err: 'token not found'});
    }

    models.User.find(token.user_id).then(function (user) {
      if (!user) { return res.json(user); }
      // Make user verified if needxed
      if (user.verified !== true) {
        user.verified = true;
        user.save().then(function(user){}).catch(function(err){
          console.log('eee',err);
        });
      }

      user.getAccounts({
        include: [
          {model: models.File, as: 'avatar'}
        ]
      }).then(function (accounts) {
        //console.log('get accounts: ', accounts);
        //console.log('Found ' + accounts.length + ' account(s)');
        user = user.dataValues;
        user.accounts = [];
        for (var i = 0; i < accounts.length; i++) {
          var account = accounts[i].dataValues;
          account.role = accounts[i].AccountsUsers.dataValues.role;
          delete account.AccountsUsers;
          if (accounts[i].primary) {
            user.primary = account;
          }
          user.accounts.push(account);
        }

        //delete the token
        token.destroy().then(function(res){}).catch(function(err){
          console.log('err token delete, ', err);
        });
        // Send back a JWT
        return res.json({
          user: user,
          token: auth.createToken(user)
        });
      }).catch(function (err) {
        console.log(err);
      });
    }).catch(function (err) {
      console.log('something went wrong!');
      handleError(res, err);
    });
  });
};


/**
 *
 * Error handler
 *
 **/
function handleError(res, err) {
  console.log('User Controller error:', err);
  return res.json({status: 'error', msg: err});
}
