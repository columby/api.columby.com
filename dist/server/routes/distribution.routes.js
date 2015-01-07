'use strict';

var express = require('express'),
  controller = require('../controllers/distribution.controller'),
  auth = require('../controllers/auth.controller'),
  router = express.Router();


module.exports = function(app){

  /**
   * Distribution Routes
   *
   **/
  router.get('/',
    controller.index);

  router.post('/',
    auth.ensureAuthenticated,
    controller.create);

  router.post('/validate-link',
    auth.ensureAuthenticated,
    controller.validateLink);

  router.get('/:id',
    controller.show);

  router.put('/:id',
    auth.ensureAuthenticated,
    controller.update);

  router.delete('/:id',
    auth.ensureAuthenticated,
    controller.destroy);


  app.use('/api/v2/distribution',router);

};
