'use strict';

var pg = require('pg'),
    escape = require('pg-escape'),
    _ = require('lodash'),
    config = require('../config/environment');


exports.query = function(req,res){

    var conn = config.db.postgis;

    if (!conn)
        return res.json({status: 'error', message: 'No database connection '});

    var q = {},
        r = {};

    try{
        q=JSON.parse(req.query.q);
        if (!typeof(q===Object)) return res.json('Error: Not a valid object.');
    }catch(e){
        return res.json({status: 'error', message: String(e)});
    }

    r.type   = q.type || null;
    r.table  = String(q.table) || null;
    r.fields = q.fields || '*';
    r.limit  = parseInt(q.limit) || parseInt(q.LIMIT) || 1000;
    r.offset = parseInt(q.offset) || 0;

    // basics
    if (r.type.toLowerCase() !== 'select')
        return res.json({status: 'error', message: 'Only SELECT statement supported.'});
    if (!r.table)
        return res.json({status: 'error', message: 'Tablename is required '});
    if (!r.fields instanceof Array)
        return res.json({status: 'error', message: 'Fields should be array'});
    if (r.limit>1000)
        r.limit=1000;

    // transformations


    // query validation passed, create query string
    var sql = escape('SELECT ' + r.fields + ' FROM ' + r.table + ' OFFSET ' + r.offset + ' LIMIT ' + r.limit +';');

    // connect to the geo-db
    pg.connect(conn, function (err, client, done) {
        done();
        if (err)
            return res.json({status: 'error', message: 'There was an error connecting to the database. '});
        client.query(sql,function(err,result){
            if (result && result.rows) {
                return res.json(result.rows);
            }
            if (err){
                return res.json({status:'error', message: String(err)});
            }
            return res.json('error');
        });
    });
};
