'use strict';

var _             = require('lodash'),

    models        = require('../models/index'),

    config        = require('../config/environment/index'),
    auth          = require('../controllers/auth.controller'),
    emailService  = require('../controllers/email.controller');




function transformAccounts(user, cb){
  //console.log(user);
  var u = user.dataValues;
  u.organisations = [];

  for (var i = 0; i < user.account.length; i++) {
    //console.log(user.account[ i].dataValues);
    var account = user.account[ i].dataValues;
    account.role = account.UserAccounts.dataValues.role;
    delete account.AccountsUsers;
    if (account.primary) {
      u.primary = account;
    } else {
      u.organisations.push(account);
    }
  }
  delete u.account;

  cb(u);
}


/**
 *
 * Provide the currently logged in user details, including publication accounts
 *
 */
exports.me = function(req, res) {
  models.User.find({
    where: {
      id: req.jwt.sub
    },
    include:
      [{ model: models.Account, as: 'account', include:
        [{ model: models.File, as: 'avatar'}]
      }]
    }).then(function(user) {
      transformAccounts(user, function(_user){
        return res.json(_user);
      })
  }).catch(function(err){
    return handleError(res,err);
  });
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
 * Get a single user by user primary account slug
 *
 **/
exports.show = function(req, res) {
  console.log('get user with primary account slug: ' + req.params.slug);
  models.User.findAll({
    include:
      [{
        model: models.Account,
        as: 'account',
        where: {
          slug: req.params.slug
        },
        include:
        [{ model: models.File, as: 'avatar'}]
      }]
    }).then(function(user) {
      transformAccounts(user[0], function(_user){
        return res.json(_user);
      })
  }).catch(function(err){
    return handleError(res,err);
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
            return handleError(res,err);
          });
        }).catch(function(err){
          user.destroy();
          return handleError(res,err);
        });
      }).catch(function(err){
        return handleError(res,err);
      });
    }).catch(function(err){
      return handleError(res,err);
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
 *   Delete primary account
 *   Delete User
 *   Send email to user
 *
 **/
exports.delete = function(req, res) {
  models.User.find({
    where: {
      id: req.params.id
    }
  }).then(function(user){
    // Fetch the users primary account
    console.log('User: ', user);

    user.getAccount({
      where: {
        primary: true
      }
    }).then(function(account){
      console.log('account', account);
      // delete account
      if (account){
        account[ 0].destroy().then(function(result){
          console.log('Account deleted');
          console.log(result);
        });
      }
      // delete user
      user.destroy().then(function(result){
        console.log('User deleted');
        console.log(result);
        return res.json({status: 'success'});
      });
    }).catch(function(err){
      console.log(err);
      return handleError(res, err);
    });
  }).catch(function(err){
    console.log(err);
    return handleError(res, err);
  });;
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
 exports.login = function(req,res){
  console.log('Finding user ', req.body.email);
  models.User.find({
    where: {
      email: req.body.email
    },
    include: [
      { model: models.Account, as: 'account' }
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
  }).catch(function(err){
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

    // Token found, fetch the user and associated account
    models.User.find({
      where: { id: token.user_id },
      // todo: include avatar
      include: [ { model: models.Account, as: 'account' } ] } )
      .then(function (user) {

        if (!user) { return res.json(user); }

        // Make user verified if needed
        if (user.verified !== true) {
          user.verified = true;
          user.save().then(function(user){}).catch(function(err){
            return handleError(res,err);
          });
        }

        //delete the token
        token.destroy().then(function(res){}).catch(function(err){
          console.log('err token delete, ', err);
        });

        // Restructure associated accounts for this user.
        transformAccounts(user, function(_user){

          // Send back a JWT
          return res.json({
            user: _user,
            token: auth.createToken(user)
          });
        });

      }).catch(function (err) {
        return handleError(res, err);
      });
    });
}



/**
 *
 * Create a new user, with primary account
 *
 **/
exports.createUser = function(user, cb) {
  console.log('Creating new user: ', user);
  models.User.create(user).then(function(newUser){
    // Create primary account for the new user.
    var account = user.account;
    account.primary = true;
    console.log('creating account: ', account);
    models.Account.create(account).then(function(newAccount){
      // Create the connection between the user and the account.
      newUser.addAccount(newAccount, {role: 1}).then(function(){
        newUser.primary = newAccount.dataValues;
        // Send back the user
        cb(newUser);
      });
    }).catch(function(err){
      console.log(err);
      cb(err); });
  });
}


/**
 *
 * Fetch an existing user by email
 *
 **/
exports.getUserByEmail = function(email,cb){
  models.User.find({
    where:{
      email:email
    },
    include: [
      { model: models.Account, as: 'account', include: [
        { model: models.File, as: 'avatar'}
      ]}
    ]
    }).then(function(user){
      if (!user){
        cb({user: {}});
      } else {
        user = transformAccounts(user, function(user){
          cb({user: user});
        });
      }
    }).catch(function(err){
      cb({error:err});
    });
}


/**
 *
 * Error handler
 *
 **/
function handleError(res, err) {
  console.log('User Controller error:', err);
  return res.json({status: 'error', msg: err});
}
