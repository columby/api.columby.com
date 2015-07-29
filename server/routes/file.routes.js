'use strict';

var express = require('express'),
    controller = require('./../controllers/file.controller'),
    auth = require('./../controllers/auth.controller'),
    perm = require('./../permissions/file.permission'),
    router = express.Router();


module.exports = function(app) {

  router.post('/sign',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    controller.sign
  );

  router.post('/finish-upload',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    controller.finishUpload
  );

  router.get('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    controller.index);

  router.get('/:id',
    controller.show);

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    perm.canUpdate,
    controller.update);

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    perm.canDelete,
    controller.delete);

  app.use('/v2/file', router);
};
