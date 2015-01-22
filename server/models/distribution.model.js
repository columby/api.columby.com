'use strict';

var Hashids = require('hashids'),
  hashids = new Hashids('Salt', 8);

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Distribution = sequelize.define('Distribution',
    {
      shortid:{
        type: DataTypes.STRING,
        unique: true
      },
      title: {
        type: DataTypes.STRING,
        defaultValue: 'Datasource'
      },
      type: {
        type: DataTypes.ENUM,
        values: ['localFile', 'remoteService', 'remoteFile'],
        comment: 'The type of source: uploaded file, a remote service for synchronization, a remote file for processing. '
      },
      status: {
        type: DataTypes.ENUM,
        values: ['draft','private','public'],
        defaultValue: 'draft'
      },

      // is valid for api
      valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag for a valid source for processing.'
      },

      // DCAT
      description     : { type: DataTypes.TEXT },
      issued          : { type: DataTypes.DATE },
      modified        : { type: DataTypes.DATE },
      license         : { type: DataTypes.STRING },
      rights          : { type: DataTypes.STRING },
      accessUrl       : { type: DataTypes.STRING(500) },
      downloadUrl     : { type: DataTypes.STRING(500) },
      mediaType       : { type: DataTypes.STRING },
      format          : { type: DataTypes.STRING },
      byteSize        : { type: DataTypes.INTEGER },

      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        associate: function(models) {
          // associate an uploaded file.
          Distribution.belongsTo(models.File, { as: 'file' });
        }
      }
    }
  );

  /**
   *
   * Set shortid after creating a new account
   *
   */
  Distribution.afterCreate( function(model) {
    model.updateAttributes({
      shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
    }).success(function(){}).error(function(){});
  });

  return Distribution;
};
