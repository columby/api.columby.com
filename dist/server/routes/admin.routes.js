'use strict';

var express = require('express'),
    controller = require('./../controllers/admin.controller.js'),
    router = express.Router();

module.exports = function(app){

  router.get('/check-primary-accounts', controller.userAccounts );

  app.use('/api/v2/admin', router);
};
