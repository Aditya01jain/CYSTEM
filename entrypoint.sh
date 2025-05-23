#!/bin/bash
set -e;

# We don't want expression expansion here, we literally want this string
# shellcheck disable=SC2016
envsubst '${url}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Starting nginx"
nginx