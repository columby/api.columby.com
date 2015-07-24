'use strict';

/**
 * Build task
 */

var gulp                 = require('gulp');
var path                 = require('path');
var sq                   = require('streamqueue');
var runSequence          = require('run-sequence');
var del                  = require('del');

var toDelete = [];

module.exports = function (done) {
  runSequence(
    ['clean:dist'],
    ['copy:dist'],
    'clean:finish',
    done);
};

gulp.task('clean:dist', function (done) {
  del(['dist/**', '!dist', '!dist/.git{,/**}'], done);
});

gulp.task('clean:finish', function (done) {
  del([
    '.tmp/**',
    'dist/client/app.{css,js}',
    'dist/client/assets/styles'
  ].concat(toDelete), done);
});

gulp.task('copy:dist', function () {
  var main = gulp.src([
    'server/**/*',
    'package.json',
    '!server/config/env.js'
  ], { base: './' });
  var docs = gulp.src('client/docs/**/*', { base: './' });

  return sq({ objectMode: true }, main, docs)
    .pipe(gulp.dest('dist/'));
});
