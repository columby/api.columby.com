'use strict';

var pg = require('pg'),
    escape = require('pg-escape'),
    config = require('../../config/config'),
    path = require('path');

exports.query = function(req,res){
  // handle response based on request type
  switch (req.query.REQUEST) {
    case 'GetCapabilities':
      res.sendFile(__dirname + '/wfs/capabilities.xml');
      break;
    case 'DescribeFeatureType':
      break;

    case 'GetFeature':
      var params = req.query;
      //http://webhelp.esri.com/arcims/9.2/general/mergedProjects/wfs_connect/wfs_connector/get_feature.htm
      var service      = params.SERVICE || 'wfs'; // wfs
      var tablename    = params.TYPENAME,        // table
          bbox         = params.BBOX,            // boundaries
          featureid    = params.FEATUREID,
          filter       = params.FILTER,
          maxfeatures  = params.MAXFEATURES,
          outputformat = params.OUTPUTFORMAT,    // geojson or gml
          propertyname = params.PROPERTYNAME;    //
      var version      = params.VERSION || '2.0.0';         // 2.0

      // check typename
      if (!tablename){
        return res.json({
          status: 'error',
          error:'no tablename'
        });
      }

      // get columns
      /*
      var queryColumns = "SELECT 'SELECT ' || array_to_string(ARRAY(SELECT 'o' || '.' || c.column_name FROM information_schema.columns As c WHERE table_name = '" + typename + "' AND  c.column_name NOT IN('cid', 'the_geom', 'createdAt', 'updatedAt')), ',') || ' FROM " + typename + " As o' As sqlstmt";
      */

      var queryColumns = "SELECT c.column_name FROM information_schema.columns AS c WHERE table_name = '" + tablename + "'";//" AND  c.column_name NOT IN('cid', 'the_geom', 'created_at', 'updated_at')";


      // open connection
      pg.connect(config.db.postgis.uri, function(err, client) {

        if (err) { return res.json({status: 'error', msg: err}); }

        client.query(queryColumns, function(err, result) {

          if(err) { return res.json({status: 'error', msg: err}); }
          var geometry = false;
          var query = 'SELECT ';
          var columns = [];
          for (var i=0; i<result.rows.length; i++){
            var exluded = ['cid', 'the_geom', 'created_at', 'updated_at'];
            if (exluded.indexOf(result.rows[ i].column_name)===-1){
              columns.push(result.rows[ i].column_name);
            }
            if (result.rows[ i].column_name === 'the_geom'){
              geometry=true;
            }
          }
          query += columns.join(', ') + ' ';
          // Return geometry informatin if available
          if (geometry){
            query += "st_asgeojson(the_geom) as the_geom ";
          }
          query += "FROM " + tablename;
          //return res.json(query);
          client.query(query, function(err,result){
            if(err) { return res.json({status: 'error', msg: err}); }
            return res.json(result.rows);
          });
        });
      });
      break;

    case 'GetPropertyValue':

      break;

    default: return res.json('Wrong REQUEST type');
  }
};
