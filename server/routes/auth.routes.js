'use strict';

var express = require('express'),
    authCtrl = require('./../controllers/auth.controller'),
    router = express.Router();


module.exports = function(app){



/*
 |--------------------------------------------------------------------------
 | Login with Google
 |--------------------------------------------------------------------------
 */
router.post('/google', authCtrl.google);




/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */
// router.get('/unlink/:provider',
//   authPerms.ensureAuthenticated,
//   authCtrl.unlink);

app.use('/v2/auth/', router);

};
