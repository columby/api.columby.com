'use strict';

var express = require('express'),
    limiterCtrl = require('./../controllers/data/limiter.controller'),
    sqlCtrl = require('./../controllers/data/sql.controller'),
    wfsCtrl = require('./../controllers/data/wfs.controller'),
    iatiCtrl = require('./../controllers/data/iati.controller'),
    router = express.Router();


module.exports = function(app) {


  router.get('/:id',
    limiterCtrl.checkLimiter,
    sqlCtrl.query
  );

  router.get('/:id/sql',
    limiterCtrl.checkLimiter,
    sqlCtrl.query
  );

  router.get('/:id/wfs',
    limiterCtrl.checkLimiter,
    wfsCtrl.query
  );

  router.get('/:id/iati',
    limiterCtrl.checkLimiter,
    sqlCtrl.query
  );

  app.use('/v2/data', router);
};
