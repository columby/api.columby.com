'use strict';

var pg = require('pg'),
    escape = require('pg-escape'),
    config = require('../../config/config');

exports.query = function(req,res) {

  // Connect to the geoDatabase
  // Todo: permanent connection?
  var postgisConn = config.db.postgis.uri;
  if (!postgisConn) {
    return res.json({status: 'error', message: 'No postgis database connection details.'});
  }

  // Validate for required query elements
  if (!req.query.table) {
    return res.json({status: 'error', message: 'Tablename is required.'});
  }
  if (!req.query.type || req.query.type.toLowerCase() !== 'select') {
    return res.json({status: 'error', message: 'Only SELECT statement supported.'});
  }

  var r = {};
  r.type   = req.query.type || 'select';
  r.table  = 'primary_' + String(req.query.table);
  r.fields = req.query.fields || '*';
  r.limit  = parseInt(req.query.limit) || 1000;
  r.offset = parseInt(req.query.offset) || 0;
  if (r.limit>1000) { r.limit=1000; }

  // query validation passed, create query string
  var sql = escape('SELECT ' + r.fields + ' FROM ' + r.table + ' OFFSET ' + r.offset + ' LIMIT ' + r.limit +';');


  // connect to the geo-db
  pg.connect(postgisConn, function (err, client, done) {
    if (err) { return res.json({status: 'error', message: 'There was an error connecting to the database. ', err:err}); }

    client.query(sql,function(err,result){
      done();
      if (err){ return res.json({status:'error', message: String(err)}); }

      return res.json({
        rows: result.rows,
      });
    });
  });
};
