"use strict";

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var config    = require('./../config/environment');

/**
 *
 * Database settings
 *
 **/
var sequelize = new Sequelize(config.db.uri, {
    dialect: config.db.dialect,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: false
    }
  }
);

/**
 *
 * Authenticate to the database
 *
 **/
sequelize
  .authenticate()
  .complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err)
    } else {
      console.log('Postgres; Connection has been established successfully.')
    }
  });

/**
 *
 * Read model files
 *
 **/
var db        = {};

fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize["import"](path.join(__dirname, file));
    console.log('adding ', model.name);
    db[model.name] = model;
  });


/**
 *
 * Create associations for loaded models
 *
 **/
Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

/**
 *
 * Resync database for development version
 *
 **/
if (config.seedDB === true){
  sequelize
    .sync({ force: true })
    .complete(function(err) {
      if (!!err) {
        console.log('An error occurred while creating the table:', err)
      } else {
        console.log('It worked!');
        require('./../seed/seed');
      }
    });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
