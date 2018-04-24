#!/bin/sh
export B2DROP_USER=$1
export B2DROP_PASSWORD=$2
export WEBDAV_URL=$3

# print ENV variables
echo "User is $B2DROP_USER"
echo "Password is $B2DROP_PASSWORD"
echo "URL is $WEBDAV_URL"

if [ -z "${B2DROP_USER}" ]; then
    echo "B2DROP_USER is unset or set to the empty string"
else
    # Create entry in secrets file
    echo "$WEBDAV_URL $B2DROP_USER $B2DROP_PASSWORD" >> /etc/davfs2/secrets

    # make dir for mount
    mkdir -p ~/work/b2drop

    # mount b2drop to dir
    mount.davfs $WEBDAV_URL ~/work/b2drop
fi
