'use strict';

var express = require('express'),
    controller = require('../controllers/search.controller'),
    auth = require('../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app){

  router.get('/', controller.search);

  app.use('/api/v2/search', router);
};
