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

  //router.get('/createDerivative',
  //  controller.createDerivative);

  router.get('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    perm.canUpload,
    controller.index);

  router.get('/:id',
    controller.show);

  router.post('/',
    auth.ensureAuthenticated,
    // check upload limit
    // validate upload space
    // upload using multer middleware

    // finishUpload
      controller.create);

  router.put('/:id',
    auth.ensureAuthenticated,
      controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
      controller.destroy);

  app.use('/v2/file', router);
};
