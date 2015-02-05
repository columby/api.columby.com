'use strict';

/**
 * Dependencies
 *
 * @type {exports}
 */
var express = require('express'),
    controller = require('./../controllers/user.controller'),
    auth = require('./../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app) {

  /**
   * Check if a user can edit a requested user account.
   *
   * @param req
   * @param res
   * @param next
   *
   */
  function canEdit(req, res, next) {
    console.log(req.params);
    console.log(req.body);
    if (req.user) {
      if ((req.user.roles.indexOf('admin')) || (req.user._id === req.params.id)) {
        next();
      }
    } else {
      res.status(401).json('Not authorized');
    }
  }


  /**
   * Get website configuration (public keys etc).
   *
   */
  router.post('/config',
    controller.config);


  /**
   * Login and registration functions
   *
   * Roles: visitor
   *
   */
  router.post('/login', controller.login);
  router.post('/register', controller.register);
  router.get('/verify', controller.verify);


  /**
   * Show currently logged in user account
   *
   * Roles: admin, authenticated
   *
   */
  router.post( '/me',
    auth.ensureAuthenticated,
    controller.me)
  ;

  /**
   * List user accounts
   *
   * Roles: admin
   *
   */
  router.get('/',
    auth.ensureAuthenticated,
    auth.isAdmin,
    controller.index);

  /**
   * Show a user accounts
   *
   * Roles: admin
   *
   */
  router.get('/:id',
    auth.ensureAuthenticated,
    auth.isAdmin,
    controller.show);

  /**
   * Create a new user
   *
   * Roles: all
   *
   */
  router.post('/',
    controller.register);

  /**
   * Update an existing user account
   *
   * Roles: admin
   * Permissions: edit own account
   *
   */
  router.put('/:id',
    auth.ensureAuthenticated,
    canEdit,
    controller.update);

  /**
   * Apply the routes to our application
   *
   */
  app.use('/v2/user/', router);

};
