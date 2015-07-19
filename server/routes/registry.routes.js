'use strict';

var express = require('express'),
  controller = require('./../controllers/registry.controller'),
  //auth = require('./../controllers/auth.controller'),
  router = express.Router();



module.exports = function(app) {

  router.get('/',
    controller.index);

  // router.post('/',
  //   auth.ensureAuthenticated,
  //   controller.create);

  router.get('/:id',
    controller.show);

  app.use('/v2/registry', router);

};
