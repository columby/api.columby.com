#!/usr/bin/env bash

echo " --------------------------"
echo "   Installing Columby API  "
echo " --------------------------"

apt-get update

# NODEJS
apt-get install nodejs npm nodejs-legacy
npm install -g forever grunt-cli

# NGINX
apt-get install -y nginx
cp ./nginx/api.columby.com.conf /etc/nginx/site-available/api.columby.com.conf
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
