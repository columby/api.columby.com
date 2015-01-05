'use strict';


/**
 *
 * Tags
 *
 *
 */

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Tag = sequelize.define('Tag',
    {
      text: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
      },

      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        associate: function(models) {
          Tag.hasMany(models.Dataset,{as:'tags'});
          models.Dataset.hasMany(Tag,{as:'tags'});


        }
      }
    }
  );

  return Tag;
};
