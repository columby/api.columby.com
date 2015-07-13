#!/usr/bin/env bash

echo " --------------------------"
echo "   Installing Columby API  "
echo " --------------------------"

apt-get update

# NODEJS
npm install -g nodejs npm nodejs-legacy forever grunt-cli

# NGINX
apt-get install -y nginx
cp ./nginx/api.columby.com.conf /etc/nginx/conf.d/api.columby.com.conf
mkdir -p /var/log/columby
mkdir -p /var/log/columby/api
chown columby:columby /var/log/columby -R
service nginx reload && service nginx restart

# GIT CLONE AND INSTALL
cd /home/columby/www
git clone https://github.com/columby/api.columby.com.git
git checkout -b staging
npm install
grunt build

# CRON
crontab -l | { cat; echo "00 01 * * * sh /home/columby/bin/backup_cms.sh"; } | crontab -

# Create init script


# Start process
start columby-api

# done!
echo "Done! "
