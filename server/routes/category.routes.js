'use strict';

var express = require('express'),
    controller = require('../controllers/category.controller'),
    permission = require('../permissions/category.permission'),
    auth = require('../controllers/auth.controller'),
    models = require('../models/index'),
    router = express.Router();



module.exports = function(app){

  router.get('/', controller.index);

  router.get('/:id', controller.show);

  router.post('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canCreate,
    controller.create);

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.update);

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canDelete,
    controller.destroy);

  router.get('/:id/datasets',
    controller.getDatasets
  );

  router.post('/:id/addDataset',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.addDataset
  );
  router.post('/:id/removeDataset',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    permission.canEdit,
    controller.removeDataset
  );

  app.use('/v2/category',router);
};
