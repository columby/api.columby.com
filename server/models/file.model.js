'use strict';

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var File = sequelize.define('File', {

      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false
      },
      filetype: {
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.STRING
      },
      url: {
        type: DataTypes.STRING,
        isUrl: true
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      classMethods: {
        // Create associations to other models
        associate: function (models) {

          // Avatar association
          File.hasOne(models.Account, {
            foreignKey: 'avatar_id',
            as: 'avatar'
          });
            // Header image association
          File.hasOne(models.Account, {
            foreignKey: 'headerimg_id',
            as: 'headerImg'
          });

          // Each file should be connected to 1 publication account
          File.belongsTo(models.Account, {
            constraints: false,
            as: 'account'
          });
        }
      }
    }
  );

  return File;
};
