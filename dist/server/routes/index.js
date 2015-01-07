'use strict';

var fs = require('fs'),
    errors = require('../controllers/errors.controller');

module.exports = function(app) {

  fs.readdirSync(__dirname).forEach(function(file) {
    if ((file === 'index.js') || (file[0] === "."))  return;
    var name = file.substr(0, file.indexOf('.'));
    require('./' + name + '.routes')(app);
  });

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req,res){
      return res.json({status: 'not found'});
    });
};

