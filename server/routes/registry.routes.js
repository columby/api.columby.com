'use strict';

var express = require('express'),
  registryCtrl = require('./../controllers/registry.controller'),
  registryPerms = require('./../permissions/registry.permission'),
  authCtrl = require('./../controllers/auth.controller'),
  router = express.Router();



module.exports = function(app) {


  router.post('/validate', registryCtrl.validate);


  router.get('/ckan',
    authCtrl.validateJWT,
    authCtrl.validateUser,
    registryPerms.canQuery,
    registryCtrl.query
  );

  router.get('/',
    registryCtrl.index);

  // router.post('/',
  //   auth.ensureAuthenticated,
  //   controller.create);

  router.get('/:id',
    registryCtrl.show);

  app.use('/v2/registry', router);

};
