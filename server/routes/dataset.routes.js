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
    datasetCtrl.show);

  router.post('/',
    auth.ensureAuthenticated,
    datasetPerms.canCreate,
    datasetCtrl.create);

  router.put('/:id',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    datasetPerms.canDelete,
    datasetCtrl.destroy);


  // Dataset tags routes
  router.post('/:id/tag',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.addTag);

  router.delete('/:id/tag/:tid',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.removeTag);


  // Distribution Routes
  router.get('/:id/distribution',
    datasetCtrl.listDistributions);

  router.post('/:id/distribution',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.createDistribution);

  router.get('/:id/distribution/:did',
    datasetCtrl.getDistribution);

  router.put('/:id/distribution/:did',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.updateDistribution);

  router.delete('/:id/distribution/:did',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.destroyDistribution);

  // Reference Routes
  router.get('/:id/reference',
    datasetCtrl.listReferences);

  router.post('/:id/reference',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.createReference);

  router.get('/:id/reference/:rid',
    datasetCtrl.getReference);

  router.put('/:id/reference/:rid',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.updateReference);

  router.delete('/:id/reference/:rid',
    auth.ensureAuthenticated,
    datasetPerms.canEdit,
    datasetCtrl.destroyReference);


  app.use('/v2/dataset',router);

};
