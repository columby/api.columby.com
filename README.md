# Front end for [columby.com](http://columby.com)

This is the front-end for the columby.com website. It is based on [Angularjs](http://www.angularjs.com), using a separate API backend. 

## Installation

Install [gruntJS](http://www.grunjs.com)  

    npm install -g grunt-cli  

Create a file [environment.js] in ./client/config/environment with the proper environment variables. Possible environments: local, development, staging, dist Use grunt serve:environment for creating the right files. E.g. 
    
    grunt serve:local

To create the production version: 

    grunt serve:dist
    
    
## Environment specific
### Local
  UI: localhost:9000
  API: localhost:8000
  
### Development
  UI: columby.dev (alias www.columby.dev
  API: api.columby.dev
  
### Staging / production
  UI: columby.com (alias www.columby.com)
  API: api.columby.com
  
 
