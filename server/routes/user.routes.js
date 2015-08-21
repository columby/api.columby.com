'use strict';

/**
 * Dependencies
 *
 * @type {exports}
 */
var express = require('express'),
    controller = require('./../controllers/user.controller'),
    auth = require('./../controllers/auth.controller'),
    permission = require('./../permissions/user.permission'),
    router = express.Router();


module.exports = function(app) {

  /**
   *
   * Login and registration functions
   *
   */
  router.post('/login', controller.login);
  router.post('/register', controller.register);
  router.get('/verify', controller.verify);


  /**
   *
   * Show currently logged in user account
   *
   **/
  router.post( '/me',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    controller.me
  );

  /**
   *
   * List user accounts
   *
   **/
  router.get('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canShow,
    controller.index
  );

  /**
   * Show a user accounts
   *
   **/
  router.get('/:slug',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canShow,
    controller.show
  );

  /**
   * Create a new user
   *
   * Roles: all
   *
   */
  router.post('/',
    controller.register);

  /**
   *
   * Update an existing user account
   *
   */
  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.update
  );

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canDelete,
    controller.delete
  )


  /**
   * Apply the routes to our application
   *
   */
  app.use('/v2/user/', router);

};
