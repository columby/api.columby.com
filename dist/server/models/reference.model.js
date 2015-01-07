'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   * Schema definition
   *
   */
  var Reference = sequelize.define('Reference',
    {
      description: {
        type: DataTypes.TEXT
      },
      url:{
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.STRING
      },
      provider_name: {
        type: DataTypes.STRING
      },
      provider_display: {
        type: DataTypes.STRING
      },
      image: {
        type: DataTypes.STRING
      }
    },{
      classMethods: {
        associate: function(models) {
          Reference.belongsTo(models.Dataset,{
            as: 'Dataset'
          });
        }
      }
    }
  );

  return Reference;
};
