'use strict';

var express = require('express'),
    controller = require('./../controllers/account.controller'),
    permission = require('./../permissions/account.permission'),
    auth = require('./../controllers/auth.controller'),
    router = express.Router();



module.exports = function(app) {


  router.get('/',
    auth.validateJWT,
    controller.index
  );

  router.get('/:slug',
    auth.validateJWT,
    auth.validateUser,
    controller.show
  );

  router.post('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canCreate,
    controller.create
  );


  router.post('/addFile',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.addFile
  );

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.update
  );


  app.use('/v2/account', router);
};
