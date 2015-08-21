'use strict';

var express = require('express'),
  controller = require('./../controllers/tag.controller'),
  auth = require('./../controllers/auth.controller'),
  tagPerms = require('./../permissions/tag.permission'),
  router = express.Router();


module.exports = function(app) {

  router.get('/',
    controller.index);

  // router.post('/',
  //   auth.validateJWT,
  //   auth.validateUser,
  //   auth.ensureAuthenticated,
  //   tagPerms.canCreate,
  //   controller.create);

  router.get('/:slug',
    controller.show);

  app.use('/v2/tag', router);

};
