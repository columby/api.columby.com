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

      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },

      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        associate: function(models) {
          // Tag can belong to many datasets (many to many)
          Tag.belongsToMany(models.Dataset,{
            through: 'dataset_tags',
            as:'datasets'
          });
          models.Dataset.belongsToMany(Tag,{
            through: 'dataset_tags',
            as:'tags'
          });
        }
      }
    }
  );

  return Tag;
};
