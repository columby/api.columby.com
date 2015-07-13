# Installation

Serve locally with foreman start. Environment variables in /.env
Serve on server with node forever upstart process. Environment variables in /etc/init/columby-api.conf


Create a process for the node process.
https://github.com/cvee/node-upstart
https://github.com/zapty/forever-service
Make a system service out of a node process. Create

Use monit to monitor the node service.
