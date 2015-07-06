'use strict';

var Hashids = require('hashids'),
    hashids = new Hashids('Salt', 8);


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

module.exports = function(sequelize, DataTypes) {

  /**
   *
   * Schema definition
   *
   */
  var Account = sequelize.define('Account',
    {
      shortid: {
        type: DataTypes.STRING,
        unique: true
      },

      // Public displayname
      displayName: {
        type: DataTypes.STRING,
        required: true,
        unique: true
      },

      // automatically generated slug
      slug: {
        type: DataTypes.STRING,
        unique: true
      },

      // Public email
      email: {
        type: DataTypes.STRING
      },

      // Public description
      description: {
        type: DataTypes.TEXT
      },

      // This account is a primary account for a user or not
      primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      plan: {
        type:DataTypes.STRING,
        defaultValue: 'free'
      },

      contact: {
        type: DataTypes.TEXT
      },

      url: {
        type: DataTypes.STRING
      },

      location: {
        type: DataTypes.STRING
      },

      uuid: {
        type: DataTypes.UUID
      },

      created_at:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },{
      classMethods: {
        // Create associations to other models
        associate: function(models) {

          // Each account can have a reference to a File (image) as avatarImage
          // creates Account.avatar_id
          Account.belongsTo(models.File,{
            foreignKey: 'avatar_id',
            as: 'avatar'
          });

          // Each account can have a reference to a File (image) as headerImage
          // creates Account.headerimg_id
          Account.belongsTo(models.File,{
            foreignKey: 'headerimg_id',
            as: 'headerImg'
          });

          // An account can have files attached
          Account.belongsToMany(models.File, {
            through: 'AccountFiles',
            as: 'files'
          });
          models.File.belongsToMany(Account, {
            through: 'AccountFiles',
            as: 'accountFiles'
          });


          // A user can have multiple accounts with roles
          Account.belongsToMany(models.User, {
            as: 'users',
            through: models.UserAccounts
          });

          Account.hasMany(models.Dataset);

          Account.hasMany(models.Distribution);

        }
      }
    }
  );

  /**
   *
   * Create a slug based on the account name
   *
   */
  Account.beforeCreate( function(account, fn){
    account.slug = slugify(account.displayName);
  });

  /**
   *
   * Set shortid after creating a new account
   *
   */
  Account.afterCreate( function(account) {
    if (!account.shortId) {
      account.updateAttributes({
        shortid: hashids.encode(parseInt(String(Date.now()) + String(account.id)))
      });
    }
  });


  return Account;
};
