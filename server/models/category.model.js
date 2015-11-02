'use strict';

module.exports = function(sequelize, DataTypes) {

  var Category = sequelize.define('Category',
    {
      name: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },{
      classMethods: {
        associate: function(models) {

          // Optional parent Id
          Category.belongsTo(models.Category, { as: 'parent' });

          // An account can have multiple collection
          models.Account.hasMany(Category);
          Category.belongsTo(models.Account);

          // A category can have multiple datasets, datasets can belong to many collections (Many to many)
          Category.belongsToMany(models.Dataset, {
            through: 'dataset_categories',
            as: 'categories'
          });
          models.Dataset.belongsToMany(Category, {
             through: 'dataset_categories',
             as: 'categories'
          });
        }
      }
    }
  );

  return Category;
};
