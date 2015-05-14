'use strict';

var express = require('express'),
    collectionCtrl = require('../controllers/collection.controller'),
    collectionPerms = require('../permissions/collection.permission'),
    auth = require('../controllers/auth.controller'),
    models = require('../models/index'),
    router = express.Router();



module.exports = function(app){

  router.get('/', collectionCtrl.index);

  router.get('/:id', collectionCtrl.show);

  router.post('/',
    auth.ensureAuthenticated,
    collectionPerms.canEdit,
    collectionCtrl.create);

  router.put('/:id',
    auth.ensureAuthenticated,
    collectionPerms.canEdit,
    collectionCtrl.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    collectionPerms.canEdit,
    collectionCtrl.destroy);

  router.get('/:id/datasets',
    collectionCtrl.getDatasets
  );

  router.post('/:id/addDataset',
    auth.ensureAuthenticated,
    collectionPerms.canEdit,
    collectionCtrl.addDataset
  );
  router.post('/:id/removeDataset',
    auth.ensureAuthenticated,
    collectionPerms.canEdit,
    collectionCtrl.removeDataset
  );

  app.use('/v2/collection',router);
};
