'use strict';

var express = require('express'),
    sqlController = require('./../controllers/data_sql.controller'),
    router = express.Router();


module.exports = function(app) {

    router.get('/sql',
        sqlController.query);

    app.use('/v2/data', router);
};
