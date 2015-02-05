'use strict';

var express = require('express'),
    controller = require('./../controllers/account.controller'),
    auth = require('./../controllers/auth.controller'),
    router = express.Router();



module.exports = function(app) {


  router.get('/',
    auth.checkJWT,
      controller.index);

  router.get('/:id',
    auth.checkJWT,
    //controller.canEdit,
      controller.show);

  router.post('/',
    auth.isAdmin,
      controller.create);

  router.post('/addFile',
    auth.ensureAuthenticated,
    controller.canEdit,
    controller.addFile);

  router.put('/:id',
    auth.ensureAuthenticated,
    controller.canEdit,
      controller.update);
  //router.patch('/:id'    , controller.update);
  //router.delete('/:id'   , controller.destroy);

  app.use('/v2/account', router);
};
