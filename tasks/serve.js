'use strict';

/**
 * Serve app. For dev purpose.
 */

var gulp       = require('gulp');
var ripe       = require('ripe');
var nodemon    = require('gulp-nodemon');
var env        = require('gulp-env');
var open       = require('gulp-open');
var livereload = require('gulp-livereload');

var config = require('../server/config/config');

var openOpts = {
  url: 'http://localhost:' + config.port,
  already: false
};

module.exports = {

  nodemon: function () {

    try {
      env({
        file: "server/config/env.js"
      });
    } catch(err) {
      console.log('No env.js found');
    }

    return nodemon({
        script: 'server/server.js',
        ext: 'js',
        ignore: ['client', 'dist', 'node_modules', 'gulpfile.js']
      })
      .on('start', function () {
        if (!openOpts.already) {
          openOpts.already = true;
          ripe.wait(function () {
            gulp.src('client/index.html')
              .pipe(open('', openOpts));
          });
        } else {
          ripe.wait(function () {
            livereload.changed('/');
          });
        }
      });
  }
};
