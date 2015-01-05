'use strict';

var express = require('express'),
    controller = require('./../controllers/file.controller'),
    auth = require('./../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app) {

  router.get('/sign',
    auth.ensureAuthenticated,
      controller.sign);

  router.post('/s3success',
    auth.ensureAuthenticated,
      controller.handleS3Success);

  //router.get('/createDerivative',
  //  controller.createDerivative);

  router.get('/',
    controller.index);

  router.get('/:id',
    controller.show);

  router.post('/',
    auth.ensureAuthenticated,
      controller.create);

  router.put('/:id',
    auth.ensureAuthenticated,
      controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
      controller.destroy);

  app.use('/api/v2/file', router);
};
