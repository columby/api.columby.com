'use strict';

var path = require('path'),
    Hashids = require('hashids'),
    hashids = new Hashids('Salt', 8);

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Slugify a string.
   *
   */
  function slugify(text) {

    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')         // Trim - from start of text
      .replace(/-+$/, '');        // Trim - from end of text
                                  // Limit characters
  }

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
      },
      hooks: {
        // Create a slug based on the account name

        beforeCreate: function(model) {
          model.filename = slugify(path.basename(model.filename, path.extname(model.filename))) + path.extname(model.filename);
        },

        afterCreate: function(model) {
          console.log('changing filename after create');
          // update filename
          model.update({
            filename: path.basename(model.filename, path.extname(model.filename)) + '_' + model.id + path.extname(model.filename)
          }).then(function(result){
            //console.log('updated', result);
          }).catch(function(err){
            //console.log('err', err);
          });
        }
      }
    }
  );
  return File;
};
