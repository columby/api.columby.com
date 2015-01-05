'use strict';

var express = require('express'),
    controller = require('./../controllers/collection.controller.js'),
    router = express.Router();

module.exports = function(app){


  router.get('/', controller.index);
  router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

  app.use('/api/2/collection',router);
};
