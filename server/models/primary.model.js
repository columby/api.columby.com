'use strict';

var Hashids = require('hashids'),
  hashids = new Hashids('Salt', 8);

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Primary = sequelize.define('Primary',
    {
      shortid:{
        type: DataTypes.STRING,
        unique: true
      },

      status: {
        type: DataTypes.ENUM,
        values: ['draft', 'processing', 'error', 'done'],
        defaultValue: 'draft'
      },

      statusMsg: {
        type: DataTypes.STRING
      },

      // sync status for external api syncs
      syncPeriod: {
        type: DataTypes.STRING
        //type: DataTypes.ENUM,
        //values: [ 'Do not sync', 'Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily' ]
      },

      syncDate: { type: DataTypes.DATE },

      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        associate: function(models) {
          Primary.belongsTo(models.Dataset, {
            as: 'dataset'
          });
          Primary.belongsTo(models.Distribution, {
            as: 'distribution'
          });
        }
      }
    }
  );

  /**
   *
   * Set shortid after creating a new account
   *
   */
  Primary.afterCreate( function(model) {
    model.updateAttributes({
      shortid: hashids.encode(parseInt(String(Date.now()) + String(model.id)))
    }).success(function(){}).error(function(){});
  });

  return Primary;
};
