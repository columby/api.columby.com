'use strict';


/**
 *
 * Tags
 *
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
  var Tag = sequelize.define('Tag',
    {
      text: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
      },

      slug: {
        type: DataTypes.STRING
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

  Tag.beforeCreate( function(tag, fn){
    tag.slug = slugify(tag.text);
  });

  return Tag;
};
