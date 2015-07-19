'use strict';

var express = require('express'),
    referenceCtrl = require('../controllers/reference.controller'),
    referencePerms = require('../permissions/reference.permission'),
    auth = require('../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app){


  // Reference Routes
  router.get('/',
    referenceCtrl.index);

  router.post('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    referencePerms.canCreate,
    referenceCtrl.create);

  router.get('/:id',
    referenceCtrl.get);

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    referencePerms.canEdit,
    referenceCtrl.update);

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    referencePerms.canDelete,
    referenceCtrl.destroy);


  app.use('/v2/reference',router);

};
