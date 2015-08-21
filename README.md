# API for columby.com

## About
This is the backend for [columby.com](http://columby.com).

## Technology used
The Columby API is built with the following great (open source) technology:
  * [Digital Ocean Server](http://digitalocean.com)
  * [Ubuntu 14.0.4 LTS](http://releases.ubuntu.com/14.04/)
  * [NodeJS](http://nodejs.org)
  * [Gulp](http://gulpjs.com/)
  * [Express](http://expressjs.com) - Web server
  * [Sequelize](http://sequelizejs.com) - Database communication
  * [Node JWT](https://github.com/hokaccha/node-jwt-simple) - User authentication
  * [Postgresql with postGIS](http://postgis.net) - Main database with excellent geo-support
  * [Forever](https://github.com/foreverjs/forever) - A simple CLI tool for ensuring that a given script runs continuously (i.e. forever)  
  * [NGINX](http://nginx.org)
  * Cron  
  * [Upstart](http://upstart.ubuntu.com/)


## Workflow
Development - Staging - Production  
All development and pull-requests are handled in the development branch.  
[Wercker](http://www.wercker.com) is used to build and deploy automatically when new code is pushed to a branch.

### Development
To run the API locally, use gulp to start the process. A configuration file at /server/config/env.js is required with the proper environment variables.

    gulp serve

### Staging / Production
Create a production version with Gulp:

    gulp build

Serve ./dist/server/server.js using gulp, or the columby-api upstart process.

    pm2 start

## Contact
Email: [admin@columby.com](mailto:admin@columby.com)  
Github: [Github issues](https://github.com/columby/api.columby.com/issues)
