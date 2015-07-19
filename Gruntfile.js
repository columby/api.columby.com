// Generated on 2014-11-07 using generator-angular-fullstack 2.0.13
'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically, when needed
  require('jit-grunt')(grunt, {
    express: 'grunt-express-server',
    useminPrepare: 'grunt-usemin',
    concat: 'grunt-contrib-concat'
  });

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);


  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    pkg: grunt.file.readJSON('package.json'),

    yeoman: {
      dist: 'dist'
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*',
            '!<%= yeoman.dist %>/.openshift',
            '!<%= yeoman.dist %>/Procfile'
          ]
        }]
      },
      server: '.tmp'
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dest: '<%= yeoman.dist %>',
          src: [
            'package.json',
            'Procfile',
            '.env',
            '.env2',
            'server/**/*'
          ]
        }]
      }
    },

    env: {
      production: {
        NODE_ENV: 'production'
      },
      development: {
        NODE_ENV: 'development'
      },
    }
  });

  // Used for delaying livereload until after server has restarted
  grunt.registerTask('wait', function () {
    grunt.log.ok('Waiting for server reload...');

    var done = this.async();

    setTimeout(function () {
      grunt.log.writeln('Done waiting!');
      done();
    }, 1500);
  });

  grunt.registerTask('express-keepalive', 'Keep grunt running', function() {
    this.async();
  });


  // build
  grunt.registerTask('build', [
    'clean:dist',
    'copy:dist'
  ]);


  grunt.registerTask('serve:development', [
    'env:development',
    'express:development',
    'wait',
    'open',
    'express-keepalive'
  ]);

  grunt.registerTask('serve:production', [
    'build',
    'env:production',
    'express:production',
    'wait',
    'open',
    'express-keepalive'
  ]);

};
