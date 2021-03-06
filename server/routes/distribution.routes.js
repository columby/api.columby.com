'use strict';

var express = require('express'),
  distributionCtrl = require('../controllers/distribution.controller'),
  distributionPerms = require('../permissions/distribution.permission'),
  auth = require('../controllers/auth.controller'),
  router = express.Router();


module.exports = function(app){


  /**
   * Distribution Routes
   *
   **/
  router.get('/',
    distributionCtrl.index
  );

  router.post('/',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    auth.ensureAuthenticated,
    distributionPerms.canCreate,
    distributionCtrl.create
  );

  router.post('/validate-link',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    auth.ensureAuthenticated,
    distributionCtrl.validateLink);

  router.get('/:id',
    distributionCtrl.show);

  router.put('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    auth.ensureAuthenticated,
    distributionPerms.canEdit,
    distributionCtrl.update);

  router.delete('/:id',
    auth.validateJWT,
    auth.validateUser,
    auth.ensureAuthenticated,
    auth.ensureAuthenticated,
    distributionPerms.canDelete,
    distributionCtrl.destroy);


  app.use('/v2/distribution',router);

};
