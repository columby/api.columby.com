'use strict';

var express = require('express'),
  controller = require('../controllers/primary.controller'),
  auth = require('../controllers/auth.controller'),
  router = express.Router();


module.exports = function(app){

  /**
   * Primary Routes
   *
   **/
  router.get('/',
    controller.index);

  router.post('/',
    auth.ensureAuthenticated,
    controller.create);

  router.get('/:id',
    controller.show);

  router.post('/:id/sync',
    controller.sync);

  router.put('/:id',
    auth.ensureAuthenticated,
    controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    controller.destroy);


  app.use('/api/v2/primary', router);

};
