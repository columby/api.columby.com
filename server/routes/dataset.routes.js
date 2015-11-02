'use strict';

var express = require('express'),
    datasetCtrl = require('../controllers/dataset.controller'),
    datasetPerms = require('../permissions/dataset.permission'),
    auth = require('../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app){


  router.get('/',
    datasetCtrl.index);

  router.get('/:id',
    datasetPerms.canView,
    datasetCtrl.show);

  router.post('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canCreate,
    datasetCtrl.create);

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.update);

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canDelete,
    datasetCtrl.destroy);


  // Dataset registry routes
  router.put('/:id/registry/:rid',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.updateRegistry
  );

  // Dataset tags routes
  router.post('/:id/tag',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.addTag);

  router.delete('/:id/tag/:tid',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.removeTag);

  // Dataset categories routes
  router.post('/:id/category',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.addCategory);

  router.delete('/:id/category/:cid',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.removeCategory);

  // Distribution Routes
  router.get('/:id/distribution',
    datasetCtrl.listDistributions);

  router.post('/:id/distribution',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.createDistribution);

  router.get('/:id/distribution/:did',
    datasetCtrl.getDistribution);

  router.put('/:id/distribution/:did',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.updateDistribution);

  router.delete('/:id/distribution/:did',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.destroyDistribution);

  app.use('/v2/dataset',router);

};
