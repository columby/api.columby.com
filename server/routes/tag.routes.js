'use strict';

var express = require('express'),
  controller = require('./../controllers/tag.controller'),
  auth = require('./../controllers/auth.controller'),
  router = express.Router();



module.exports = function(app) {

  router.get('/',
    controller.index);

  router.post('/',
    auth.ensureAuthenticated,
    controller.create);

  router.get('/:slug',
    controller.show);

  app.use('/v2/tag', router);

};
