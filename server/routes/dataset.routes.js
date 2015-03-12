'use strict';

var express = require('express'),
    controller = require('../controllers/dataset.controller'),
    auth = require('../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app){


  /**
   *
   * List datasets
   *
   * Public access
   *
   **/
  router.get('/',
    controller.index);


  /**
   *
   * Get a dataset
   *
   * Public access
   *
   **/
  router.get('/:id',
    controller.show);

  /**
   *
   * Create a new dataset
   *
   * Roles: authenticated
   *
   **/
  router.post('/',
    auth.ensureAuthenticated,
    controller.canCreate,
    controller.create);

  /**
   *
   * Update a dataset
   *
   * Roles: authenticated
   *
   **/
  router.put('/:id',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.update);

  /**
   *
   * Delete a dataset
   *
   * Roles: authenticated
   *
   **/
  router.delete('/:id',
    auth.ensureAuthenticated,
    controller.canDelete,
    controller.destroy);

  router.post('/:id/tag',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.addTag);

  router.delete('/:id/tag/:tid',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.removeTag);

  /**
   * Distribution Routes
   *
   **/
  router.get('/:id/distribution',
    controller.listDistributions);

  router.post('/:id/distribution',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.createDistribution);

  router.get('/:id/distribution/:did',
    controller.getDistribution);

  router.put('/:id/distribution/:did',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.updateDistribution);

  router.delete('/:id/distribution/:did',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.destroyDistribution);

  /**
   * Reference Routes
   *
   **/
  router.get('/:id/reference',
    controller.listReferences);

  router.post('/:id/reference',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.createReference);

  router.get('/:id/reference/:rid',
    controller.getReference);

  router.put('/:id/reference/:rid',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.updateReference);

  router.delete('/:id/reference/:rid',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.destroyReference);

  app.use('/v2/dataset',router);

};
