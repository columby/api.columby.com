'use strict';

var fs = require('fs'),
path=require('path');


module.exports = function(app) {

  fs.readdirSync(__dirname).forEach(function(file) {
    if ((file === 'index.js') || (file[0] === "."))  return;
    var name = file.substr(0, file.indexOf('.'));
    require('./' + name + '.routes')(app);
  });

  app.route('/*')
    .get(function(req,res){
      return res.json({status: 'not found'});
    });
};
