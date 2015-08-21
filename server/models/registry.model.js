'use strict';


/**
 *
 * Registries
 *
 *
 */


module.exports = function(sequelize, DataTypes) {

  var Registry = sequelize.define('Registry',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      description: {
        type: DataTypes.TEXT,
      },

      url: {
        type: DataTypes.STRING,
        allowNull: false
      },

      icon: {
        type: DataTypes.STRING
      },

    }, {
      classMethods: {
        associate: function(models) {
          // Registry can belong to many datasets (many to many)
          Registry.belongsToMany(models.Dataset,{
            through: 'dataset_registries',
            as:'registries'
          });
          models.Dataset.belongsToMany(Registry,{
            through: 'dataset_registries',
            as:'registries'
          });

          // Registry can belong to many datasets (many to many)
          Registry.belongsToMany(models.Account, {
            through: 'account_registries',
            as:'registries'
          });
          models.Account.belongsToMany(Registry,{
            through: 'account_registries',
            as:'registries'
          });
        }
      }
    }
  );

  return Registry;
};
